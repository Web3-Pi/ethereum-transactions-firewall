import { TypedTransaction } from "web3-eth-accounts";
import { ContractInfo } from "./transaction.js";

export class ContractParser {
  private knownContracts = new Map<string, string>();
  private knownContractAbis = new Map<string, string>();

  public loadConfig(config: {
    knownContracts: string[];
    knownContractAbis: string[];
  }) {
    this.knownContracts = new Map(
      config.knownContracts.map((key) => [key, key]),
    );
    this.knownContractAbis = new Map(
      config.knownContractAbis.map((key) => [key, key]),
    );
  }
  public getContractInfo(transaction: TypedTransaction): ContractInfo {
    return {} as ContractInfo;
  }
}
