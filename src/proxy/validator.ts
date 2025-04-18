import { WrappedTransaction } from "../transactions/transaction.js";
import { WebSocketRequestSender } from "../websocket/request-sender.js";
import { Logger } from "../utils/logger.js";

export abstract class TransactionValidator {
  public abstract validate(tx: WrappedTransaction): Promise<true>;
}
// In the future we can implement Non-Interactive Whitelist / Blacklist Validator

export type WebsocketResponse = {
  id: string;
  timestamp: number;
  result: boolean;
  message?: string;
};

export interface WebsocketTransactionValidatorConfig {
  wssPort: number;
  logger: Logger;
  timeoutMs?: number;
}

export class ValidationError extends Error {}

export class WebsocketTransactionValidator extends TransactionValidator {
  private wss: WebSocketRequestSender;
  private logger: Logger;

  constructor(config: WebsocketTransactionValidatorConfig) {
    super();
    this.wss = new WebSocketRequestSender(config);
    this.logger = config.logger;
  }

  public close() {
    this.wss.close();
  }

  public async validate(tx: WrappedTransaction): Promise<true> {
    if (this.wss.isBusy()) {
      this.logger.warn(
        "Websocket is busy processing a query -> ACCEPTING current transaction",
      );
      return true;
    }
    if (!this.wss.isActive()) {
      this.logger.warn(
        "Websocket not connected -> ACCEPTING current transaction",
      );
      return true;
    }
    let response: WebsocketResponse | undefined;
    try {
      response = await this.wss.send<WebsocketResponse>(JSON.stringify(tx.dto));
    } catch (error) {
      this.logger.error(
        error,
        `Unable to validate transaction by user -> ACCEPTING`,
      );
    }
    if (response && response.id !== tx.id) {
      throw new Error(
        "Invalid transaction response from websocket. Tx id mismatch.",
      );
    }
    if (response?.result === false) {
      throw new ValidationError(
        `Transaction validation failed. ${response?.message || ""}`,
      );
    }

    return true;
  }
}
