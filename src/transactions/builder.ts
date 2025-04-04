import { UserData, WrappedTransaction } from "./transaction.js";
import assert from "node:assert";
import { TransactionFactory, TypedTransaction } from "web3-eth-accounts";
import { JsonRpcRequest } from "web3";
import { toBuffer } from "ethereumjs-util";
import { ContractParser } from "./parser.js";

export interface TransactionBuilderConfig {
  authorizedAddressesPath: string;
  knownContractsPath: string;
  knownContractAbisPath: string;
}

export class TransactionBuilder {
  private isLoaded = false;

  private authorizedAddresses = new Map<string, string>();

  constructor(
    private contractParser: ContractParser,
    private config: TransactionBuilderConfig,
  ) {}

  public async loadConfig() {
    // TODO: read from fs
    const authorizedAddresses: string[] = [];
    this.authorizedAddresses = new Map(
      authorizedAddresses.map((key) => [key, key]),
    );
    const knownContracts: string[] = [];
    const knownContractAbis: string[] = [];
    this.contractParser.loadConfig({ knownContracts, knownContractAbis });
    this.isLoaded = true;
  }

  public fromJsonRpcRequest(req: JsonRpcRequest): WrappedTransaction | null {
    if (req.method !== "eth_sendRawTransaction" || !req.params?.[0]) {
      return null;
    }
    assert(this.isLoaded, "Config not loaded");

    try {
      const txData = toBuffer(req.params[0] as string);
      const baseTransaction = TransactionFactory.fromSerializedData(txData);
      const userData = this.getUserData(baseTransaction);

      return new WrappedTransaction(baseTransaction, userData);
    } catch (error) {
      throw new Error(`Failed to decode transaction. ${error}`);
    }
  }

  private getUserData(transaction: TypedTransaction): UserData {
    return {
      labelFrom:
        this.authorizedAddresses.get(
          transaction.getSenderAddress().toString(),
        ) || "unknown",
      labelTo:
        this.authorizedAddresses.get(transaction.to?.toString() || "") ||
        "unknown",
      contractInfo: this.contractParser.getContractInfo(transaction),
    };
  }
}
