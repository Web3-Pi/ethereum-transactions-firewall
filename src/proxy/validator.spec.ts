import { ValidationError, WebsocketTransactionValidator } from "./validator.js";
import { WebSocketRequestSender } from "../websocket/request-sender.js";
import {
  TransactionPayload,
  WrappedTransaction,
} from "../transactions/transaction.js";
import { instance, mock, when } from "ts-mockito";
import { Logger } from "../utils/logger.js";

jest.mock("../websocket/request-sender.js", () => ({
  WebSocketRequestSender: jest.fn().mockImplementation(() => ({
    isBusy: jest.fn(),
    isActive: jest.fn(),
    send: jest.fn(),
  })),
}));

describe("TransactionValidator", () => {
  let validator: WebsocketTransactionValidator;
  let requestSenderMock: jest.Mocked<WebSocketRequestSender>;
  let testTx: WrappedTransaction;

  const configMock = {
    wssPort: 18777,
    logger: instance(mock<Logger>()),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const txMock = mock(WrappedTransaction);
    when(txMock.dto).thenReturn({} as TransactionPayload);
    when(txMock.id).thenReturn("1");
    testTx = instance(txMock);
    validator = new WebsocketTransactionValidator(configMock);
    requestSenderMock = (WebSocketRequestSender as jest.Mock).mock.results[0]
      .value;
  });

  test("should accept transaction if client is busy", async () => {
    requestSenderMock.isBusy.mockReturnValue(true);
    await expect(validator.validate(testTx)).resolves.toBe(true);
  });

  test("should accept transaction if client is not active", async () => {
    requestSenderMock.isBusy.mockReturnValue(false);
    requestSenderMock.isActive.mockReturnValue(true);
    await expect(validator.validate(testTx)).resolves.toBe(true);
  });

  test("should accept transaction if client accept request", async () => {
    requestSenderMock.isBusy.mockReturnValue(false);
    requestSenderMock.isActive.mockReturnValue(true);
    requestSenderMock.send.mockResolvedValue({ result: true, id: "1" });
    await expect(validator.validate(testTx)).resolves.toBe(true);
  });

  test("should accept transaction if client throws error during request", async () => {
    requestSenderMock.isBusy.mockReturnValue(false);
    requestSenderMock.isActive.mockReturnValue(true);
    requestSenderMock.send.mockRejectedValue(
      new Error("Something went wrong during request"),
    );
    await expect(validator.validate(testTx)).resolves.toBe(true);
  });

  test("should reject transaction if client reject request", async () => {
    requestSenderMock.isBusy.mockReturnValue(false);
    requestSenderMock.isActive.mockReturnValue(true);
    requestSenderMock.send.mockResolvedValue({
      id: "1",
      result: false,
      message: "Rejected",
    });
    await expect(validator.validate(testTx)).rejects.toThrow(
      new ValidationError(
        "Transaction validation failed. Rejected",
        testTx.dto,
      ),
    );
  });
});
