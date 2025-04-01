import { mock } from "ts-mockito";
import { TransactionValidator } from "./transaction-validator.js";
import { ValidatingProxy } from "./validating-proxy.js";

describe("Proxy", () => {
  let txValidator: TransactionValidator;

  beforeEach(() => {
    txValidator = mock(TransactionValidator);
  });
  test("should create and listen http proxy server", async () => {
    const proxy = new ValidatingProxy(txValidator, { todo: true });
    await proxy.listen();
  });

  test("should get a valid response from the proxy for a valid transaction call", async () => {});

  test("should get a valid response from the proxy for an invalid transaction call", async () => {});
});
