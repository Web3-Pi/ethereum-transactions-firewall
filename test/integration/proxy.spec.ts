import { ValidatingProxy } from "../../src/proxy/proxy.js";
import { TransactionBuilder } from "../../src/transactions/builder.js";
import { ContractParser } from "../../src/transactions/parser.js";
import { WebsocketTransactionValidator } from "../../src/proxy/validator.js";
import { fileURLToPath } from "node:url";
import path from "path";
import { Logger } from "../../src/utils/logger.js";
import { anything, instance, mock, when } from "ts-mockito";
import { testContracts, wallets } from "../fixtures/contracts.js";
import { ethers } from "ethers";
import { ChildProcess, spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(__filename);

const config = {
  proxyPort: 19500,
  rpcEndpoint: "http://localhost:8545",
};

describe("Firewall proxy tests", function () {
  let proxy: ValidatingProxy;
  let transactionValidatorMock: WebsocketTransactionValidator;

  let hardhatProcess: ChildProcess;

  beforeAll(async () => {
    return new Promise<void>((resolve, reject) => {
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
      hardhatProcess.kill();
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
    proxy = new ValidatingProxy(
      instance(transactionValidatorMock),
      transactionBuilder,
      {
        proxyPort: config.proxyPort,
        endpointUrl: config.rpcEndpoint,
        logger: instance(loggerMock),
      },
    );
  });

  afterEach(async function () {
    if (proxy) await proxy.close();
  });

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
    const erc20Instance = testContracts.erc20.create(wallets[0]);
    await expect(
      erc20Instance.transfer(wallets[1].address, ethers.parseUnits("7")),
    ).rejects.toThrow(
      "Error: potential phishing attempt detected - reverting transaction. Transaction rejected",
    );
  });
});
