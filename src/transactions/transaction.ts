import { TypedTransaction } from "web3-eth-accounts";
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
  | "erc-20"
  | "contract-creation"
  | "contract-call"
  | "unknown";

export interface TransactionPayload extends ParsedData {
  id: string;
  from: string;
  to?: string;
  value: string;
  data: string;
}

export class WrappedTransaction {
  public id: string;
  constructor(
    public baseTransaction: TypedTransaction,
    private parsedData: ParsedData,
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
}
