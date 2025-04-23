import { JsonRpcRequest } from "web3";
import { TransactionBuilder } from "./builder.js";
import { ContractParser } from "./parser.js";
import { instance, mock } from "ts-mockito";
import { Logger } from "../utils/logger.js";
import { fileURLToPath } from "node:url";
import path from "path";
import { ethers } from "ethers";
import { WrappedTransaction } from "./transaction.js";

const __filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(__filename);

type Transaction = {
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  data: string;
};

const generateSignedTx = async (tx: Transaction) => {
  const privateKey =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wallet = new ethers.Wallet(privateKey);
  return await wallet.signTransaction(tx);
};

describe("Transaction Builder", () => {
  let builder: TransactionBuilder;
  const contractParserMock: ContractParser = mock(ContractParser);
  const config = {
    authorizedAddressesPath: dirname + "/../../test/config/auth_addr.json",
    knownContractsPath: dirname + "/../../test/config/known_contracts.json",
  };

  beforeEach(async () => {
    builder = new TransactionBuilder(
      instance(contractParserMock),
      config,
      instance(mock<Logger>()),
    );
    await builder.loadConfig();
  });

  test("should build transaction object from json rpc request", async () => {
    const signedTx = await generateSignedTx({
      to: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      value: "7",
      gas: "21000",
      gasPrice: "1000000000",
      data: "0x",
    });
    const rpcReq: JsonRpcRequest = {
      jsonrpc: "2.0",
      method: "eth_sendRawTransaction",
      params: [signedTx],
      id: 1,
    };

    const wrappedTx = builder.fromJsonRpcRequest(rpcReq);
    expect(wrappedTx).toBeInstanceOf(WrappedTransaction);
    expect(wrappedTx?.dto).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        from: expect.any(String),
        to: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        value: "7",
        data: "0x",
        txType: "transfer",
        labelFrom: "Account #0",
        labelTo: "Account #1",
      }),
    );
  });
});
