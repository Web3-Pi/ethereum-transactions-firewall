import { UserData, WrappedTransaction } from "./transaction.js";
import assert from "node:assert";
import { TransactionFactory, TypedTransaction } from "web3-eth-accounts";
import { JsonRpcRequest } from "web3";
import { toBuffer } from "ethereumjs-util";
import { ContractParser } from "./parser.js";
import * as fs from "node:fs";

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
    try {
      const authorizedAddresses: string[] = JSON.parse(
        await fs.promises.readFile(
          this.config.authorizedAddressesPath,
          "utf-8",
        ),
      );
      const knownContracts: string[] = JSON.parse(
        await fs.promises.readFile(this.config.knownContractsPath, "utf-8"),
      );
      const knownContractAbis: string[] = JSON.parse(
        await fs.promises.readFile(this.config.knownContractAbisPath, "utf-8"),
      );
      this.authorizedAddresses = new Map(
        authorizedAddresses.map((key) => [key, key]),
      );
      this.isLoaded = true;
      this.contractParser.loadConfig({ knownContracts, knownContractAbis });
    } catch (error) {
      throw new Error(`Failed to load config. ${error}`);
    }
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
