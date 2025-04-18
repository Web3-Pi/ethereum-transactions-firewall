import { TypedTransaction } from "web3-eth-accounts";
import { sha3 } from "web3-utils";
import { decodeParameters } from "web3-eth-abi";
import { ContractInfo, TransactionType } from "./transaction.js";
import { AbiFragment, ContractAbi } from "web3";
import { bufferToHex } from "ethereumjs-util";
import { standardABIs } from "./standard-abis.js";

export class ContractParser {
  private authorizedAddresses: Map<string, string> = new Map();
  private userDefinedContracts: Map<
    string,
    { name: string; abi?: ContractAbi }
  > = new Map();
  private standardABIs: Map<string, { name: string; abi: ContractAbi }> =
    new Map(standardABIs.map((item) => [item.name, item]));

  public loadConfig(
    authorizedAddresses: Map<string, string>,
    knownContracts: Map<string, { name: string; abi?: ContractAbi }>,
  ): void {
    this.authorizedAddresses = authorizedAddresses;
    this.userDefinedContracts = knownContracts;
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
      const userDefinedContract =
        this.userDefinedContracts.get(contractAddress);

      const methodData = bufferToHex(Buffer.from(transaction.data));
      const methodSig = methodData.slice(0, 10);

      const knownContract =
        userDefinedContract && userDefinedContract.abi
          ? userDefinedContract
          : this.findStandardContract(methodSig);

      if (!knownContract) {
        return null;
      }

      const knownContractABI: ContractAbi = Array.isArray(knownContract.abi)
        ? knownContract.abi
        : [knownContract.abi];

      const methodAbi = this.getMethodAbi(knownContractABI, methodSig);

      if (methodAbi && methodAbi.type === "function") {
        const inputTypes = methodAbi.inputs?.map((input) => input.type) || [];
        const params = decodeParameters(inputTypes, methodData.slice(10));
        const args = this.getMethodArgs(methodAbi, params);

        return {
          address: contractAddress,
          labelAddress: knownContract.name,
          functionName: "name" in methodAbi ? methodAbi.name : "unknown",
          args,
        };
      }
    }

    return null;
  }

  private getMethodAbi(knownAbi: ContractAbi, methodSig: string) {
    return knownAbi.find((abi) => {
      if (abi.type !== "function") return false;
      const name = "name" in abi ? abi.name : "";
      if (!name) return false;

      const signature = `${name}(${abi.inputs?.map((input) => input.type).join(",")})`;
      const hash = sha3(signature);
      if (!hash) return false;
      return hash.slice(0, 10).toLowerCase() === methodSig.toLowerCase();
    });
  }

  private getMethodArgs(
    methodAbi: AbiFragment,
    params: { [key: string]: unknown },
  ) {
    return methodAbi.inputs?.map((input, index) => {
      const value = String(params[index]);
      const label =
        input.type === "address"
          ? this.authorizedAddresses.get(value.toLowerCase())
          : undefined;

      return {
        name: input.name || "unknown",
        type: input.type,
        value: String(params[index]),
        label,
      };
    });
  }

  private findStandardContract(methodSig: string) {
    return Array.from(this.standardABIs.entries()).find(([, abi]) =>
      this.getMethodAbi(abi.abi, methodSig),
    )?.[1];
  }
}
