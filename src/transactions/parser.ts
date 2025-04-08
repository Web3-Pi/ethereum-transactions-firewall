import { TypedTransaction } from "web3-eth-accounts";
import { AbiItem, sha3 } from "web3-utils";
import { decodeParameters } from "web3-eth-abi";
import { ContractInfo, TransactionType } from "./transaction.js";
import { Contract, ContractAbi } from "web3";
import { bufferToHex } from "ethereumjs-util";

export class ContractParser {
  private authorizedAddresses: Map<string, string> = new Map();
  private knownContracts: Map<string, string> = new Map();
  private knownContractAbis: Map<string, AbiItem[]> = new Map();
  private contractInstances: Map<string, Contract<ContractAbi>> = new Map();

  public loadConfig(
    authorizedAddresses: Map<string, string>,
    knownContracts: Map<string, string>,
    knownContractAbis: Map<string, AbiItem[]>,
  ): void {
    this.authorizedAddresses = authorizedAddresses;
    this.knownContracts = knownContracts;
    this.knownContractAbis = knownContractAbis;
  }

  public getContractInfo(
    transaction: TypedTransaction,
    txType: TransactionType,
  ): ContractInfo | null {
    if (txType === "contract-creation") {
      // TODO
      return null;
    }
    if (txType === "contract-call") {
      const contractAddress = transaction.to?.toString()?.toLowerCase() || "";
      const knownAbi = this.knownContractAbis.get(contractAddress);
      if (!knownAbi) {
        return null;
      }
      let contractInstance = this.contractInstances.get(contractAddress);
      if (!contractInstance) {
        contractInstance = new Contract(
          knownAbi,
          contractAddress,
        ) as Contract<ContractAbi>;
        this.contractInstances.set(
          contractAddress.toLowerCase(),
          contractInstance,
        );
      }

      const methodData = bufferToHex(Buffer.from(transaction.data));
      const methodSig = methodData.slice(0, 10);
      const methodAbi = knownAbi.find((abi) => {
        if (abi.type !== "function") return false;
        const name = "name" in abi ? abi.name : "";
        if (!name) return false;

        const signature = `${name}(${abi.inputs?.map((input) => input.type).join(",")})`;
        const hash = sha3(signature);
        if (!hash) return false;
        return hash.slice(0, 10).toLowerCase() === methodSig.toLowerCase();
      });

      if (methodAbi && methodAbi.type === "function") {
        const inputTypes = methodAbi.inputs?.map((input) => input.type) || [];
        const params = decodeParameters(inputTypes, methodData.slice(10));

        const args = methodAbi.inputs?.map((input, index) => {
          const value = String(params[index]);
          const label =
            input.type === "address"
              ? this.authorizedAddresses.get(value.toLowerCase())
              : undefined;

          return {
            name: input.name || "",
            type: input.type,
            value: String(params[index]),
            label,
          };
        });

        return {
          address: contractAddress,
          labelAddress:
            this.knownContracts.get(contractAddress.toLowerCase()) || undefined,
          functionName: "name" in methodAbi ? methodAbi.name : "unknown",
          args,
        };
      }
    }

    return {
      address: transaction.to?.toString() || "",
      labelAddress:
        this.knownContracts.get(
          transaction.to?.toString().toLowerCase() || "",
        ) || undefined,
      functionName: "unknown",
      args: [],
    } as ContractInfo;
  }
}
