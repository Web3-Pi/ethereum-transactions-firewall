import {
  TransactionPayload,
  WrappedTransaction,
} from "../transactions/transaction.js";

export abstract class TransactionValidator {
  public abstract validate(tx: WrappedTransaction): Promise<true>;
  public async init() {}
  public async close() {}
}

export class ValidationError extends Error {
  constructor(
    msg: string,
    public tx: TransactionPayload,
    public jsonRpcId?: string,
  ) {
    super(msg);
  }
}
