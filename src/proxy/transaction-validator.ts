import { Transaction } from "../transactions/transaction.js";
import { WebsocketServer } from "../websocket/websocket-server.js";
import { Logger } from "../utils/logger.js";

export abstract class TransactionValidator {
  public abstract validate(tx: Transaction): Promise<true>;
}
// In the future we can implement Non-Interactive Whitelist / Blacklist Validator

export type ServerResponse = {
  result: boolean;
  error?: string;
};

export interface WebsocketTransactionValidatorConfig {
  wssPort: number;
  logger: Logger;
}

class ValidationError extends Error {}

export class WebsocketTransactionValidator extends TransactionValidator {
  private wss: WebsocketServer;
  private logger: Logger;

  constructor(config: WebsocketTransactionValidatorConfig) {
    super();
    this.wss = new WebsocketServer(config);
    this.logger = config.logger;
  }

  public async validate(tx: Transaction): Promise<true> {
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
    const response = await this.wss.send<ServerResponse>(tx.toString());
    if (!response.result) {
      throw new ValidationError(
        `Transaction validation failed. ${response.error}`,
      );
    }
    return true;
  }
}
