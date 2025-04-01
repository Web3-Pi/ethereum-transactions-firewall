import { mock } from "ts-mockito";
import { TransactionValidator } from "./transaction-validator.js";

describe("TransactionValidator", () => {
  test("should validate a valid transaction", () => {
    const txValidator = new TransactionValidator();
    const mockTransaction = mock(Transaction);
    expect(txValidator.validate(mockTransaction)).toBeTruthy();
  });

  test("should validate an invalid transaction", () => {
    const txValidator = new TransactionValidator();
    const mockTransaction = mock(Transaction);
    expect(txValidator.validate(mockTransaction)).toBeFalsy();
  });
});
