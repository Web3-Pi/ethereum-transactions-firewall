import { Logger } from "../utils/logger.js";
import { WebSocketServer as Wss } from "ws";

export interface WebSocketServerConfig {
  wssPort: number;
  logger: Logger;
}

export class WebSocketRequestSender {
  private wss: Wss;
  private logger: Logger;

  constructor(config: WebSocketServerConfig) {
    this.wss = new Wss({ port: config.wssPort });
    this.logger = config.logger;
  }

  public async send<T>(message: string): Promise<T> {
    this.logger.debug(`Sending message to websocket: ${message}`);
    // TODO
    return { result: false, error: "Rejected by user :)" } as T;
  }

  public isBusy() {
    return false;
  }

  public isActive() {
    return true;
  }
}
