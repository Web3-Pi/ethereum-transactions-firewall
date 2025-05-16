import {
  ContractInfo,
  TransactionPayload,
  WrappedTransaction,
} from "../transactions/transaction.js";
import { instance, mock, when } from "ts-mockito";
import { Logger } from "../utils/logger.js";
import {
  RulesValidator,
  AddressRule,
  ValueRule,
  ContractRule,
} from "./rules-validator.js";
import * as fs from "node:fs";
import { TypedTransaction } from "web3-eth-accounts";

jest.mock("node:fs", () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

describe("RulesValidator", () => {
  let validator: RulesValidator;
  let testTx: WrappedTransaction;
  let loggerMock: Logger;

  const configMock = {
    addressRulesPath: "address_rules.json",
    valueRulesPath: "value_rules.json",
    contractRulesPath: "contract_rules.json",
  };

  const mockAddressRules: AddressRule[] = [
    {
      action: "allow",
      from: "0x1234",
      to: "0x5678",
      comment: "Test allow rule",
    },
    {
      action: "allow",
      from: "*",
      to: "0x1234",
      comment: "Wildcard rule",
    },
    {
      action: "deny",
      from: "0x1234",
      to: "0xBAD",
      comment: "Explicit deny rule",
    },
  ];

  const mockValueRules: ValueRule[] = [
    {
      minValue: 0,
      maxValue: 100,
      minGasPrice: 1,
      maxGasPrice: 50,
      comment: "Low value transaction",
    },
    {
      minValue: 0,
      maxValue: 1000,
      minGasPrice: 1,
      maxGasPrice: 100,
      comment: "Medium value transaction",
    },
    {
      minValue: null,
      maxValue: null,
      minGasPrice: 1,
      maxGasPrice: 30,
      comment: "Any value with standard gas price",
    },
  ];

  const mockContractRules: ContractRule[] = [
    {
      action: "allow",
      functionName: "transfer",
      args: new Map(),
      comment: "Allow transfer function",
    },
    {
      action: "deny",
      functionName: "approve",
      args: new Map(),
      comment: "Deny approve function",
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    (fs.promises.readFile as jest.Mock).mockImplementation((path) => {
      if (path === configMock.addressRulesPath) {
        return Promise.resolve(JSON.stringify(mockAddressRules));
      } else if (path === configMock.valueRulesPath) {
        return Promise.resolve(JSON.stringify(mockValueRules));
      } else if (path === configMock.contractRulesPath) {
        return Promise.resolve(JSON.stringify(mockContractRules));
      }
      return Promise.reject(new Error("Unknown file"));
    });

    loggerMock = mock<Logger>();
    validator = new RulesValidator(configMock, instance(loggerMock));
    await validator.init();
  });

  test("init should load configuration from files", async () => {
    expect(fs.promises.readFile).toHaveBeenCalledTimes(3);
    expect(fs.promises.readFile).toHaveBeenCalledWith(
      configMock.addressRulesPath,
      "utf-8",
    );
    expect(fs.promises.readFile).toHaveBeenCalledWith(
      configMock.valueRulesPath,
      "utf-8",
    );
    expect(fs.promises.readFile).toHaveBeenCalledWith(
      configMock.contractRulesPath,
      "utf-8",
    );
  });

  test("init should throw error if configuration loading fails", async () => {
    (fs.promises.readFile as jest.Mock).mockRejectedValueOnce(
      new Error("Failed to load"),
    );

    const validatorWithError = new RulesValidator(
      configMock,
      instance(loggerMock),
    );
    await expect(validatorWithError.init()).rejects.toThrow(
      "Failed to load rules configuration",
    );
  });

  test("should accept transaction that matches address rules, value rules, and has no contract interaction", async () => {
    const txMock = mock<WrappedTransaction>();

    when(txMock.dto).thenReturn({
      from: "0x1234",
      to: "0x5678",
      value: "50",
    } as TransactionPayload);

    when(txMock.baseTransaction).thenReturn({
      gasPrice: BigInt(20),
    } as TypedTransaction);

    testTx = instance(txMock);

    await expect(validator.validate(testTx)).resolves.toBe(true);
  });

  test("should reject transaction blocked by address rule", async () => {
    const txMock = mock<WrappedTransaction>();

    when(txMock.dto).thenReturn({
      from: "0x1234",
      to: "0xBAD",
      value: "50",
    } as TransactionPayload);

    when(txMock.baseTransaction).thenReturn({
      gasPrice: BigInt(20),
    } as TypedTransaction);

    testTx = instance(txMock);

    await expect(validator.validate(testTx)).rejects.toThrow(
      "Transaction denied by address rule",
    );
  });

  test("should reject transaction that doesn't match any address rule", async () => {
    (fs.promises.readFile as jest.Mock).mockImplementationOnce(() => {
      return Promise.resolve(
        JSON.stringify([mockAddressRules[0], mockAddressRules[2]]),
      );
    });

    await validator.init();

    const txMock = mock<WrappedTransaction>();

    when(txMock.dto).thenReturn({
      from: "0xUNKNOWN",
      to: "0xUNKNOWN",
      value: "50",
    } as TransactionPayload);

    when(txMock.baseTransaction).thenReturn({
      gasPrice: BigInt(20),
    } as TypedTransaction);

    testTx = instance(txMock);

    await expect(validator.validate(testTx)).rejects.toThrow(
      "Transaction denied: No matching address rule found",
    );
  });

  test("should reject transaction that doesn't match any value rule", async () => {
    const txMock = mock<WrappedTransaction>();

    when(txMock.dto).thenReturn({
      from: "0x1234",
      to: "0x3456",
      value: "5000",
    } as TransactionPayload);

    when(txMock.baseTransaction).thenReturn({
      gasPrice: BigInt(20),
    } as TypedTransaction);

    testTx = instance(txMock);

    await expect(validator.validate(testTx)).rejects.toThrow(
      "Transaction denied: No matching address rule found",
    );
  });

  test("should reject transaction with gas price outside allowed range", async () => {
    const txMock = mock<WrappedTransaction>();

    when(txMock.dto).thenReturn({
      from: "0x1234",
      to: "0x5678",
      value: "50",
    } as TransactionPayload);

    when(txMock.baseTransaction).thenReturn({
      gasPrice: BigInt(200),
    } as TypedTransaction);

    testTx = instance(txMock);

    await expect(validator.validate(testTx)).rejects.toThrow(
      "Transaction denied: No matching value rule found",
    );
  });

  test("should correctly handle EIP-1559 transactions with maxFeePerGas", async () => {
    const txMock = mock<WrappedTransaction>();

    when(txMock.dto).thenReturn({
      from: "0x1234",
      to: "0x5678",
      value: "50",
    } as TransactionPayload);

    when(txMock.baseTransaction).thenReturn({
      maxFeePerGas: BigInt(20),
    } as TypedTransaction);

    testTx = instance(txMock);

    await expect(validator.validate(testTx)).resolves.toBe(true);
  });

  test("should reject transaction with missing gasPrice and maxFeePerGas", async () => {
    const txMock = mock<WrappedTransaction>();

    when(txMock.dto).thenReturn({
      from: "0x1234",
      to: "0x5678",
      value: "50",
    } as TransactionPayload);

    when(txMock.baseTransaction).thenReturn({} as TypedTransaction);

    testTx = instance(txMock);

    await expect(validator.validate(testTx)).rejects.toThrow(
      "Transaction denied: No matching value rule found",
    );
  });

  test("should validate contract interaction with matching allow rule", async () => {
    const txMock = mock<WrappedTransaction>();

    when(txMock.dto).thenReturn({
      from: "0x1234",
      to: "0x5678",
      value: "50",
      contractInfo: {
        address: "0x5678",
        functionName: "transfer",
        args: [],
      } as ContractInfo,
    } as TransactionPayload);

    when(txMock.baseTransaction).thenReturn({
      gasPrice: BigInt(20),
    } as TypedTransaction);

    testTx = instance(txMock);

    await expect(validator.validate(testTx)).resolves.toBe(true);
  });

  test("should reject contract interaction with matching deny rule", async () => {
    const txMock = mock<WrappedTransaction>();

    when(txMock.dto).thenReturn({
      from: "0x1234",
      to: "0x5678",
      value: "50",
      contractInfo: {
        address: "0x5678",
        functionName: "approve",
        args: [],
      } as ContractInfo,
    } as TransactionPayload);

    when(txMock.baseTransaction).thenReturn({
      gasPrice: BigInt(20),
    } as TypedTransaction);

    testTx = instance(txMock);

    await expect(validator.validate(testTx)).rejects.toThrow(
      "Transaction denied by contract rule",
    );
  });

  test("should reject contract interaction with no matching rule", async () => {
    const txMock = mock<WrappedTransaction>();

    when(txMock.dto).thenReturn({
      from: "0x1234",
      to: "0x5678",
      value: "50",
      contractInfo: {
        address: "0x5678",
        functionName: "unknownFunction",
        args: [],
      } as ContractInfo,
    } as TransactionPayload);

    when(txMock.baseTransaction).thenReturn({
      gasPrice: BigInt(20),
    } as TypedTransaction);

    testTx = instance(txMock);

    await expect(validator.validate(testTx)).rejects.toThrow(
      "Transaction denied: No matching contract rule found",
    );
  });
});
