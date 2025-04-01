import { Transaction, TypedTransaction } from "web3-eth-accounts";

export interface UserData {
  labelFrom?: string;
  labelTo?: string;
  labelContract?: string;
}

export class UserTransaction extends Transaction {
  constructor(
    baseTransaction: TypedTransaction,
    private userData: UserData,
  ) {
    super(baseTransaction, { freeze: false });
  }

  get labelFrom() {
    return this.userData.labelFrom;
  }

  get labelTo() {
    return this.userData.labelTo;
  }

  get labelContract() {
    return this.userData.labelContract;
  }

  public toString(): string {
    return JSON.stringify(this);
  }
}
