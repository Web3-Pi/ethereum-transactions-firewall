import { UserData, WrappedTransaction } from "./transaction.js";
import assert from "node:assert";
import { TransactionFactory, TypedTransaction } from "web3-eth-accounts";
import { JsonRpcRequest } from "web3";
import { toBuffer } from "ethereumjs-util";

export interface TransactionBuilderConfig {
  authorizedAddressesPath: string;
  knownContractsPath: string;
  knownContractAbisPath: string;
}

export class TransactionBuilder {
  private isLoaded = false;

  private authorizedAddresses = new Map<string, string>();
  private knownContracts = new Map<string, string>();
  private knownContractAbis = new Map<string, string>();

  constructor(private config: TransactionBuilderConfig) {}

  public async loadConfig() {
    // TODO
    this.isLoaded = true;
  }

  public fromJsonRpcRequest(req: JsonRpcRequest): WrappedTransaction | null {
    if (req.method !== "eth_sendRawTransaction" || !req.params?.[0]) {
      return null;
    }

    const txData = toBuffer(req.params[0] as string);
    return this.fromSerializedData(txData);
  }

  public fromSerializedData(data: Uint8Array): WrappedTransaction {
    assert(this.isLoaded, "Config not loaded");

    try {
      const baseTransaction = TransactionFactory.fromSerializedData(data);
      const userData = this.getUserData(baseTransaction);

      return new WrappedTransaction(baseTransaction, userData);
    } catch (error) {
      console.error("Raw transaction data:", Buffer.from(data).toString("hex"));
      console.error(error);
      throw new Error(`Failed to decode transaction. ${error}`);
    }
  }

  private getUserData(transaction: TypedTransaction): UserData {
    // TODO
    return {};
  }
}
