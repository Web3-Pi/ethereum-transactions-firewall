import { TypedTransaction } from "web3-eth-accounts";
import { TransactionType } from "../transactions/transaction.js";
import { bufferToHex, isZeroAddress } from "ethereumjs-util";

export function getTransactionType(
  transaction: TypedTransaction,
): TransactionType {
  if (
    (!transaction.to || isZeroAddress(transaction.to.toString())) &&
    transaction.data &&
    !isZeroAddress(transaction.data.toString())
  ) {
    return "contract-creation";
  }
  if (
    transaction.to &&
    !isZeroAddress(transaction.to.toString()) &&
    (!transaction.data ||
      transaction.data.toString() === "0x" ||
      bufferToHex(Buffer.from(transaction.data)) === "0x")
  ) {
    return "transfer";
  }
  if (
    transaction.to &&
    !isZeroAddress(transaction.to.toString()) &&
    transaction.data &&
    !isZeroAddress(transaction.data.toString())
  ) {
    return "contract-call";
  }

  // TODO: ERC-20, ERC-721...

  return "unknown";
}
