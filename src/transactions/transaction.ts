import { TypedTransaction } from "web3-eth-accounts";
import { bufferToHex } from "ethereumjs-util";

export interface ContractInfo {
  address: string;
  labelAddress?: string;
  functionName: string;
  args?: string[];
}

export interface UserData {
  labelFrom?: string;
  labelTo?: string;
  contractInfo?: ContractInfo;
}

export interface TransactionPayload extends UserData {
  id: string;
  from: string;
  to?: string;
  value: string;
  data: string;
  txType:
    | "transfer"
    | "erc-20-transfer"
    | "contract-creation"
    | "contract-call";
}

export class WrappedTransaction {
  public id: string;
  constructor(
    public baseTransaction: TypedTransaction,
    private userData: UserData,
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
      txType: "transfer",
      ...this.userData,
    };
  }

  public toString(): string {
    return JSON.stringify({
      from:
        this.baseTransaction.getSenderAddress() +
        ` (${this.userData.labelFrom || "unknown"})`,
      to:
        this.baseTransaction.to?.toString() +
        ` (${this.userData.labelTo || "unknown"})`,
      value: this.baseTransaction.value.toString(),
    });
  }
}
