import { ValidatingProxy } from "../../src/proxy/proxy.js";
import { TransactionBuilder } from "../../src/transactions/builder.js";
import { ContractParser } from "../../src/transactions/parser.js";
import { WebsocketTransactionValidator } from "../../src/proxy/validator.js";
import { fileURLToPath } from "node:url";
import path from "path";
import { Logger } from "../../src/utils/logger.js";
import { anything, instance, mock, when, verify, reset } from "ts-mockito";
import { testContracts, wallets } from "../fixtures/contracts.js";
import { ethers } from "ethers";
import { ChildProcess, spawn } from "node:child_process";
import { WrappedTransaction } from "../../src/transactions/transaction.js";
import { MetricsCollector } from "../../src/metrics/metrics.js";

const __filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(__filename);

const config = {
  proxyPort: 19500,
  rpcEndpoint: "http://localhost:8545",
};

describe("Firewall proxy tests", function () {
  let proxy: ValidatingProxy;
  let transactionValidatorMock: WebsocketTransactionValidator;
  let metricsCollectorMock: MetricsCollector;

  let hardhatProcess: ChildProcess;

  beforeAll(async () => {
    return new Promise<void>((resolve) => {
      hardhatProcess = spawn("npx", ["hardhat", "node"], {
        stdio: ["ignore", "pipe", "pipe"],
        shell: true,
      });

      hardhatProcess.stdout?.on("data", (data) => {
        if (
          data
            .toString()
            .includes("Started HTTP and WebSocket JSON-RPC server at")
        ) {
          resolve();
        }
      });
    });
  });

  afterAll(async () => {
    if (hardhatProcess) {
      hardhatProcess.stdout?.destroy();
      hardhatProcess.stderr?.destroy();
      hardhatProcess.kill("SIGTERM");

      return new Promise<void>((resolve) => {
        let resolved = false;

        const finalize = () => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };
        hardhatProcess?.on("exit", finalize);
        const timeoutId = setTimeout(() => {
          try {
            if (hardhatProcess?.killed === false) {
              hardhatProcess.kill("SIGKILL");
            }
          } finally {
            finalize();
          }
        }, 3000);

        hardhatProcess?.on("exit", () => clearTimeout(timeoutId));
      });
    }
  });

  beforeEach(async function () {
    const loggerMock = mock<Logger>();
    const contractParser = new ContractParser();
    const transactionBuilder = new TransactionBuilder(
      contractParser,
      {
        authorizedAddressesPath: dirname + "/../config/auth_addr.json",
        knownContractsPath: dirname + "/../config/known_contracts.json",
      },
      instance(loggerMock),
    );
    transactionValidatorMock = mock<WebsocketTransactionValidator>();
    metricsCollectorMock = mock<MetricsCollector>();
    proxy = new ValidatingProxy(
      {
        proxyPort: config.proxyPort,
        endpointUrl: config.rpcEndpoint,
        logger: instance(loggerMock),
      },
      instance(transactionValidatorMock),
      transactionBuilder,
      instance(metricsCollectorMock),
    );
  });

  afterEach(async function () {
    if (proxy) await proxy.close();
    reset(transactionValidatorMock);
  });

  describe("forwarding requests", () => {
    test("should accept transaction", async () => {
      when(transactionValidatorMock.validate(anything())).thenResolve(true);
      await proxy.listen();
      const erc20Instance = testContracts.erc20.create(wallets[0]);
      const tx = await erc20Instance.transfer(
        wallets[1].address,
        ethers.parseUnits("7"),
      );
      const receipt = await tx.wait();
      expect(receipt.status).toBe(1);
    });

    test("should reject transaction", async () => {
      when(transactionValidatorMock.validate(anything())).thenReject(
        new Error("Transaction rejected"),
      );
      await proxy.listen();
      const erc20Instance = testContracts.erc20.create(wallets[1]);
      await expect(
        erc20Instance.transfer(wallets[1].address, ethers.parseUnits("7")),
      ).rejects.toThrow(
        "Error: potential phishing attempt detected - reverting transaction. Transaction rejected",
      );
    });
  });

  describe("decoding transactions", () => {
    test("user defined contract", async () => {
      let capturedVerifyingTx: WrappedTransaction | undefined;

      when(transactionValidatorMock.validate(anything())).thenCall((arg) => {
        capturedVerifyingTx = arg;
        return Promise.resolve(true);
      });

      await proxy.listen();
      const userContract = testContracts.userDefined.create(wallets[5]);
      const tx = await userContract.testContract(
        ethers.parseUnits("7"),
        "0x19EE20338a4c4bF8F6aEbc79D9D3Af2A01434119",
      );
      await tx.wait();
      const contractAddress = userContract.target.toString().toLowerCase();
      verify(transactionValidatorMock.validate(anything())).once();
      expect(capturedVerifyingTx).toBeDefined();
      expect(capturedVerifyingTx?.dto.to).toBe(contractAddress);
      expect(capturedVerifyingTx?.dto.labelFrom).toEqual("Account #5");
      expect(capturedVerifyingTx?.dto.txType).toEqual("contract-call");
      expect(capturedVerifyingTx?.dto.contractInfo).toEqual({
        address: contractAddress,
        args: [
          {
            name: "testArg1",
            type: "uint256",
            value: "7000000000000000000",
          },
          {
            label: "My test wallet 1",
            name: "testArg2",
            type: "address",
            value: "0x19EE20338a4c4bF8F6aEbc79D9D3Af2A01434119",
          },
        ],
        functionName: "testContract",
        labelAddress: "userDefined",
      });
    });

    test("ERC-20", async () => {
      let capturedVerifyingTx: WrappedTransaction | undefined;

      when(transactionValidatorMock.validate(anything())).thenCall((arg) => {
        capturedVerifyingTx = arg;
        return Promise.resolve(true);
      });

      await proxy.listen();
      const erc20Contract = testContracts.erc20.create(wallets[2]);
      const tx = await erc20Contract.transfer(
        "0x19EE20338a4c4bF8F6aEbc79D9D3Af2A01434119",
        ethers.parseUnits("7"),
      );
      await tx.wait();
      const contractAddress = erc20Contract.target.toString().toLowerCase();
      verify(transactionValidatorMock.validate(anything())).once();
      expect(capturedVerifyingTx).toBeDefined();
      expect(capturedVerifyingTx?.dto.to).toBe(contractAddress);
      expect(capturedVerifyingTx?.dto.labelFrom).toEqual("Account #2");
      expect(capturedVerifyingTx?.dto.txType).toEqual("contract-call");
      expect(capturedVerifyingTx?.dto.contractInfo).toEqual({
        address: contractAddress,
        args: [
          {
            label: "My test wallet 1",
            name: "to",
            type: "address",
            value: "0x19EE20338a4c4bF8F6aEbc79D9D3Af2A01434119",
          },
          {
            name: "value",
            type: "uint256",
            value: "7000000000000000000",
          },
        ],
        functionName: "transfer",
        labelAddress: "Possible interface: ERC20 (Fungible Token)",
      });
    });

    test("ERC-721 (NFT)", async () => {
      let capturedVerifyingTx: WrappedTransaction | undefined;

      when(transactionValidatorMock.validate(anything())).thenCall((arg) => {
        capturedVerifyingTx = arg;
        return Promise.resolve(true);
      });

      await proxy.listen();
      const nftContract = testContracts.erc721.create(wallets[3]);
      const tx = await nftContract.safeTransferFrom(
        "0x19EE20338a4c4bF8F6aEbc79D9D3Af2A01434119",
        "0xdE07073781CADaD26053b6d36D8768f0bD283751",
        1,
      );
      await tx.wait();
      const contractAddress = nftContract.target.toString().toLowerCase();
      verify(transactionValidatorMock.validate(anything())).once();
      expect(capturedVerifyingTx).toBeDefined();
      expect(capturedVerifyingTx?.dto.to).toBe(contractAddress);
      expect(capturedVerifyingTx?.dto.labelFrom).toEqual("Account #3");
      expect(capturedVerifyingTx?.dto.txType).toEqual("contract-call");
      expect(capturedVerifyingTx?.dto.contractInfo).toEqual({
        address: contractAddress,
        args: [
          {
            label: "My test wallet 1",
            name: "from",
            type: "address",
            value: "0x19EE20338a4c4bF8F6aEbc79D9D3Af2A01434119",
          },
          {
            label: "My test wallet 2",
            name: "to",
            type: "address",
            value: "0xdE07073781CADaD26053b6d36D8768f0bD283751",
          },
          {
            name: "tokenId",
            type: "uint256",
            value: "1",
          },
        ],
        functionName: "safeTransferFrom",
        labelAddress: "Possible interface: ERC721 (Non-Fungible Token)",
      });
    });

    test("ERC-1155", async () => {
      let capturedVerifyingTx: WrappedTransaction | undefined;

      when(transactionValidatorMock.validate(anything())).thenCall((arg) => {
        capturedVerifyingTx = arg;
        return Promise.resolve(true);
      });

      await proxy.listen();
      const erc1155Contract = testContracts.erc1155.create(wallets[4]);
      const tx = await erc1155Contract.safeTransferFrom(
        "0x19EE20338a4c4bF8F6aEbc79D9D3Af2A01434119",
        "0xdE07073781CADaD26053b6d36D8768f0bD283751",
        123,
        5,
        "0x",
      );

      await tx.wait();
      const contractAddress = erc1155Contract.target.toString().toLowerCase();
      verify(transactionValidatorMock.validate(anything())).once();
      expect(capturedVerifyingTx).toBeDefined();
      expect(capturedVerifyingTx?.dto.to).toBe(contractAddress);
      expect(capturedVerifyingTx?.dto.labelFrom).toEqual("Account #4");
      expect(capturedVerifyingTx?.dto.txType).toEqual("contract-call");
      expect(capturedVerifyingTx?.dto.contractInfo).toEqual({
        address: contractAddress,
        args: [
          {
            label: "My test wallet 1",
            name: "from",
            type: "address",
            value: "0x19EE20338a4c4bF8F6aEbc79D9D3Af2A01434119",
          },
          {
            label: "My test wallet 2",
            name: "to",
            type: "address",
            value: "0xdE07073781CADaD26053b6d36D8768f0bD283751",
          },
          {
            name: "id",
            type: "uint256",
            value: "123",
          },
          {
            name: "value",
            type: "uint256",
            value: "5",
          },
          {
            name: "data",
            type: "bytes",
            value: "0x",
          },
        ],
        functionName: "safeTransferFrom",
        labelAddress: "Possible interface: ERC1155 (Multi Token Standard)",
      });
    });

    test("ERC-4626 (Vault)", async () => {
      let capturedVerifyingTx: WrappedTransaction | undefined;

      when(transactionValidatorMock.validate(anything())).thenCall((arg) => {
        capturedVerifyingTx = arg;
        return Promise.resolve(true);
      });

      await proxy.listen();
      const vaultContract = testContracts.erc4626.create(wallets[7]);
      const tx = await vaultContract.deposit(
        ethers.parseUnits("10"),
        "0x19EE20338a4c4bF8F6aEbc79D9D3Af2A01434119",
      );
      await tx.wait();
      const contractAddress = vaultContract.target.toString().toLowerCase();
      verify(transactionValidatorMock.validate(anything())).once();
      expect(capturedVerifyingTx).toBeDefined();
      expect(capturedVerifyingTx?.dto.to).toBe(contractAddress);
      expect(capturedVerifyingTx?.dto.labelFrom).toEqual("Account #7");
      expect(capturedVerifyingTx?.dto.txType).toEqual("contract-call");
      expect(capturedVerifyingTx?.dto.contractInfo).toEqual({
        address: contractAddress,
        args: [
          {
            name: "assets",
            type: "uint256",
            value: "10000000000000000000",
          },
          {
            label: "My test wallet 1",
            name: "receiver",
            type: "address",
            value: "0x19EE20338a4c4bF8F6aEbc79D9D3Af2A01434119",
          },
        ],
        functionName: "deposit",
        labelAddress: "Possible interface: ERC4626 (Tokenized Vault)",
      });
    });

    test("ERC-20-Burnable", async () => {
      let capturedVerifyingTx: WrappedTransaction | undefined;

      when(transactionValidatorMock.validate(anything())).thenCall((arg) => {
        capturedVerifyingTx = arg;
        return Promise.resolve(true);
      });

      await proxy.listen();
      const burnableTokenContract = testContracts.erc20burnable.create(
        wallets[8],
      );
      const tx = await burnableTokenContract.burn(ethers.parseUnits("5"));
      await tx.wait();
      const contractAddress = burnableTokenContract.target
        .toString()
        .toLowerCase();
      verify(transactionValidatorMock.validate(anything())).once();
      expect(capturedVerifyingTx).toBeDefined();
      expect(capturedVerifyingTx?.dto.to).toBe(contractAddress);
      expect(capturedVerifyingTx?.dto.labelFrom).toEqual("Account #8");
      expect(capturedVerifyingTx?.dto.txType).toEqual("contract-call");
      expect(capturedVerifyingTx?.dto.contractInfo).toEqual({
        address: contractAddress,
        args: [
          {
            name: "value",
            type: "uint256",
            value: "5000000000000000000",
          },
        ],
        functionName: "burn",
        labelAddress:
          "Possible interface: ERC20Burnable (Burnable Token Extension)",
      });
    });

    test("Ownable", async () => {
      let capturedVerifyingTx: WrappedTransaction | undefined;

      when(transactionValidatorMock.validate(anything())).thenCall((arg) => {
        capturedVerifyingTx = arg;
        return Promise.resolve(true);
      });

      await proxy.listen();
      const ownableContract = testContracts.ownable.create(wallets[10]);
      const tx = await ownableContract.transferOwnership(
        "0xdE07073781CADaD26053b6d36D8768f0bD283751",
      );
      await tx.wait();
      const contractAddress = ownableContract.target.toString().toLowerCase();
      verify(transactionValidatorMock.validate(anything())).once();
      expect(capturedVerifyingTx).toBeDefined();
      expect(capturedVerifyingTx?.dto.to).toBe(contractAddress);
      expect(capturedVerifyingTx?.dto.labelFrom).toEqual("Account #10");
      expect(capturedVerifyingTx?.dto.txType).toEqual("contract-call");
      expect(capturedVerifyingTx?.dto.contractInfo).toEqual({
        address: contractAddress,
        args: [
          {
            label: "My test wallet 2",
            name: "newOwner",
            type: "address",
            value: "0xdE07073781CADaD26053b6d36D8768f0bD283751",
          },
        ],
        functionName: "transferOwnership",
        labelAddress: "Possible interface: Ownable (Ownership Management)",
      });
    });

    test("AccessControl", async () => {
      let capturedVerifyingTx: WrappedTransaction | undefined;

      when(transactionValidatorMock.validate(anything())).thenCall((arg) => {
        capturedVerifyingTx = arg;
        return Promise.resolve(true);
      });

      await proxy.listen();
      const accessControlContract = testContracts.accesscontrol.create(
        wallets[11],
      );
      const tx = await accessControlContract.grantRole(
        ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")),
        "0x19EE20338a4c4bF8F6aEbc79D9D3Af2A01434119",
      );
      await tx.wait();
      const contractAddress = accessControlContract.target
        .toString()
        .toLowerCase();
      verify(transactionValidatorMock.validate(anything())).once();
      expect(capturedVerifyingTx).toBeDefined();
      expect(capturedVerifyingTx?.dto.to).toBe(contractAddress);
      expect(capturedVerifyingTx?.dto.labelFrom).toEqual("Account #11");
      expect(capturedVerifyingTx?.dto.txType).toEqual("contract-call");
      expect(capturedVerifyingTx?.dto.contractInfo).toEqual({
        address: contractAddress,
        args: [
          {
            name: "role",
            type: "bytes32",
            value: ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")),
          },
          {
            label: "My test wallet 1",
            name: "account",
            type: "address",
            value: "0x19EE20338a4c4bF8F6aEbc79D9D3Af2A01434119",
          },
        ],
        functionName: "grantRole",
        labelAddress:
          "Possible interface: AccessControl (Role-Based Access Control)",
      });
    });
  });
});
