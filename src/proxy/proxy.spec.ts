import { instance, mock, reset, when, anything, verify } from "ts-mockito";
import { ValidatingProxy } from "./proxy.js";
import { ValidationError } from "./validator.js";
import { TransactionBuilder } from "../transactions/builder.js";
import {
  TransactionPayload,
  WrappedTransaction,
} from "../transactions/transaction.js";
import { Logger } from "../utils/logger.js";
import nock from "nock";
import {
  InMemoryMetricsCollector,
  MetricsCollector,
} from "../metrics/metrics.js";
import { WebsocketTransactionValidator } from "./websocket-validator.js";

describe("Proxy", () => {
  const transactionValidatorMock = mock(WebsocketTransactionValidator);
  const transactionBuilderMock = mock(TransactionBuilder);
  const transactionMock = mock(WrappedTransaction);
  const metricsCollectorMock = mock<MetricsCollector>(InMemoryMetricsCollector);
  when(transactionMock.dto).thenReturn({} as TransactionPayload);
  when(metricsCollectorMock.getAvgGasPrice()).thenResolve(null);
  when(metricsCollectorMock.getAvgFeePerGas()).thenResolve(null);
  const configMock = {
    proxyPort: 18555,
    endpointUrl: "http://localhost:8545/",
    logger: instance(mock<Logger>()),
    mode: "interactive",
  } as const;

  let proxy: ValidatingProxy;

  const rpcRequest = async (method = "POST", body: object = { test: "?" }) =>
    fetch(`http://localhost:${configMock.proxyPort}`, {
      method,
      headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify(body),
    });

  nock(configMock.endpointUrl)
    .post("/")
    .reply(200, { jsonrpc: "2.0", id: 1, result: "0xSuccess" })
    .persist();

  beforeEach(async () => {
    reset(transactionValidatorMock);
    reset(transactionBuilderMock);
    proxy = new ValidatingProxy(
      configMock,
      instance(transactionValidatorMock),
      instance(transactionBuilderMock),
      instance(metricsCollectorMock),
    );
    await proxy.listen();
  });

  afterEach(async () => {
    await proxy.close();
  });

  afterAll(() => {
    nock.cleanAll();
  });

  test("should forward the request for types other than transaction", async () => {
    when(transactionBuilderMock.fromJsonRpcRequest(anything())).thenReturn(
      null,
    );
    when(transactionValidatorMock.validate(anything())).thenResolve(true);
    const response = await rpcRequest();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("result", "0xSuccess");
  });

  test("should get a valid response for call with proper transaction and correct validation", async () => {
    when(transactionBuilderMock.fromJsonRpcRequest(anything())).thenReturn(
      transactionMock,
    );
    when(transactionValidatorMock.validate(anything())).thenResolve(true);
    const response = await rpcRequest();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      id: 1,
      jsonrpc: "2.0",
      result: "0xSuccess",
    });
  });

  test("should get a response with error for call with proper transaction and incorrect validation", async () => {
    when(
      transactionBuilderMock.fromJsonRpcRequest(
        anything(),
        anything(),
        anything(),
      ),
    ).thenReturn(transactionMock);
    when(transactionValidatorMock.validate(anything())).thenReject(
      new ValidationError("Rejected by user", transactionMock.dto),
    );

    const response = await rpcRequest();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      error: {
        code: -32000,
        message:
          "Error: potential phishing attempt detected - reverting transaction. Rejected by user",
      },
    });
  });

  test("should get a response with error for call with invalid transaction", async () => {
    when(
      transactionBuilderMock.fromJsonRpcRequest(
        anything(),
        anything(),
        anything(),
      ),
    ).thenThrow(new Error("Invalid transaction decoding"));
    when(transactionValidatorMock.validate(anything())).thenResolve(true);
    const response = await rpcRequest();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      error: {
        code: -32000,
        message:
          "Error: potential phishing attempt detected - reverting transaction. Invalid transaction decoding",
      },
    });
  });

  test("should forward the request if it is of type OPTIONS", async () => {
    nock(configMock.endpointUrl).options("/").reply(200);
    const response = await rpcRequest("OPTIONS");
    expect(response.status).toBe(200);
  });

  test("should process batch of rpc requests", async () => {
    when(
      transactionBuilderMock.fromJsonRpcRequest(
        anything(),
        anything(),
        anything(),
      ),
    ).thenReturn(transactionMock);
    when(transactionValidatorMock.validate(anything())).thenResolve(true);
    const response = await rpcRequest("POST", [
      { jsonrpc: "2.0", id: 1 },
      { jsonrpc: "2.0", id: 2 },
    ]);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      id: 1,
      jsonrpc: "2.0",
      result: "0xSuccess",
    });
    verify(transactionValidatorMock.validate(anything())).twice();
  });
});
