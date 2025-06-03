import { Transaction, TypedTransaction } from "web3-eth-accounts";
import { bufferToHex } from "ethereumjs-util";

export interface ContractArg {
  name: string;
  type: string;
  value: string;
  label?: string;
}

export interface ContractInfo {
  address: string;
  labelAddress?: string;
  functionName: string;
  args?: ContractArg[];
}

export interface ParsedData {
  txType: TransactionType;
  labelFrom?: string;
  labelTo?: string;
  contractInfo?: ContractInfo;
}

export type TransactionType =
  | "transfer"
  | "contract-creation"
  | "contract-call"
  | "unknown";

export interface TransactionPayload extends ParsedData {
  id: string;
  from: string;
  to?: string;
  value: string;
  data: string;
  nonce?: string;
  gasLimit?: string;
  chainId?: string;
  networkName?: string;
  transactionType?: string;
  // Legacy
  gasPrice?: string;
  // EIP-1559
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;

  avgGasPrice?: number;
  avgFeePerGas?: number;
}

const NETWORK_NAMES: Record<number, string> = {
  1: "Ethereum Mainnet",
  5: "Goerli",
  17000: "Holesky",
  11155111: "Sepolia",
  137: "Polygon Mainnet",
  80001: "Polygon Mumbai",
  560048: "Hoodi",
};

export class WrappedTransaction {
  public id: string;
  constructor(
    public baseTransaction: TypedTransaction,
    private parsedData: ParsedData,
    public jsonRpcId?: string,
    public avgGasPrice?: number,
    public avgFeePerGas?: number,
  ) {
    this.id = bufferToHex(Buffer.from(baseTransaction.hash()));
  }

  get dto(): TransactionPayload {
    return {
      id: this.id,
      from: this.baseTransaction.getSenderAddress().toString(),
      to: this.baseTransaction.to?.toString(),
      value: this.baseTransaction.value.toString(),
      data: bufferToHex(Buffer.from(this.baseTransaction.data)),
      nonce: this.baseTransaction.nonce?.toString(),
      gasLimit: this.baseTransaction.gasLimit?.toString(),
      chainId: !(this.baseTransaction instanceof Transaction)
        ? this.baseTransaction.chainId?.toString()
        : undefined,
      networkName: this.getNetworkName(),
      transactionType: this.getTransactionTypeName(this.baseTransaction.type),
      maxFeePerGas:
        "maxFeePerGas" in this.baseTransaction
          ? this.baseTransaction.maxFeePerGas.toString()
          : undefined,
      maxPriorityFeePerGas:
        "maxPriorityFeePerGas" in this.baseTransaction
          ? this.baseTransaction.maxPriorityFeePerGas.toString()
          : undefined,
      gasPrice:
        "gasPrice" in this.baseTransaction
          ? this.baseTransaction.gasPrice.toString()
          : undefined,
      avgGasPrice: this.avgGasPrice,
      avgFeePerGas: this.avgFeePerGas,
      ...this.parsedData,
    };
  }

  public toString(): string {
    return JSON.stringify({
      from:
        this.baseTransaction.getSenderAddress() +
        ` (${this.parsedData.labelFrom || "unknown"})`,
      to:
        this.baseTransaction.to?.toString() +
        ` (${this.parsedData.labelTo || "unknown"})`,
      value: this.baseTransaction.value.toString(),
    });
  }

  private getNetworkName() {
    if (
      this.baseTransaction &&
      "chainId" in this.baseTransaction &&
      this.baseTransaction.chainId
    ) {
      const chainId = Number(this.baseTransaction.chainId);
      if (chainId in NETWORK_NAMES) {
        return NETWORK_NAMES[chainId];
      }
    }
    if (
      this.baseTransaction &&
      "common" in this.baseTransaction &&
      this.baseTransaction.common
    ) {
      const common = this.baseTransaction.common;
      if (common["_chainParams"] && common["_chainParams"].name) {
        return common["_chainParams"].name.toString();
      }
    }
    return undefined;
  }

  private getTransactionTypeName(
    transactionObject:
      | { type?: number | null; _type?: number | null }
      | number
      | undefined
      | null,
  ): string | undefined {
    let numericType: number | undefined | null;

    if (
      typeof transactionObject === "number" ||
      transactionObject === null ||
      transactionObject === undefined
    ) {
      numericType = transactionObject;
    } else if (
      transactionObject &&
      typeof transactionObject.type === "number"
    ) {
      numericType = transactionObject.type;
    } else if (
      transactionObject &&
      "_type" in transactionObject &&
      typeof transactionObject._type === "number"
    ) {
      numericType = transactionObject._type;
    } else if (transactionObject && transactionObject.type === null) {
      numericType = null;
    } else if (
      transactionObject &&
      "_type" in transactionObject &&
      transactionObject._type === null
    ) {
      numericType = null;
    }

    if (numericType === null || numericType === undefined) {
      return undefined;
    }

    switch (numericType) {
      case 0:
        return "Legacy";
      case 1:
        return "EIP-2930";
      case 2:
        return "EIP-1559";
      case 3:
        return "EIP-4844";
      default:
        return `Unknown Type (${numericType})`;
    }
  }
}
