import { TypedTransaction } from "web3-eth-accounts";

export interface UserData {
  labelFrom?: string;
  labelTo?: string;
  labelContract?: string;
}

export interface TransactionPayload extends UserData {
  from: string;
  to?: string;
  value: string;
  contract: "TODO";
}

export class WrappedTransaction {
  constructor(
    public baseTransaction: TypedTransaction,
    private userData: UserData,
  ) {}

  get dto(): TransactionPayload {
    return {
      from: this.baseTransaction.getSenderAddress().toString(),
      to: this.baseTransaction.to?.toString(),
      value: this.baseTransaction.value.toString(),
      ...this.userData,
      contract: "TODO",
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
      contract: "TODO",
    });
  }
}
