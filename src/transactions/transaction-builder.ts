import { UserData, UserTransaction } from "./transaction.js";
import assert from "node:assert";
import {
  TransactionFactory,
  TxData,
  TypedTransaction,
} from "web3-eth-accounts";

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
    // todo
    this.isLoaded = true;
  }

  public fromTxData(txData: TxData): UserTransaction {
    assert(this.isLoaded, "Config not loaded");

    try {
      const baseTransaction = TransactionFactory.fromTxData(txData);

      const userData = this.getUserData(baseTransaction);

      return new UserTransaction(baseTransaction, userData);
    } catch (error) {
      console.error(error);
      throw new Error(`Failed to decode transaction. ${error}`);
    }
  }

  private getUserData(transaction: TypedTransaction): UserData {
    // TODO
    return {};
  }
}
