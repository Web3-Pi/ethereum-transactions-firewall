import { Logger } from "../utils/logger.js";
import { WebSocketServer as Wss } from "ws";

export interface WebSocketServerConfig {
  wssPort: number;
  logger: Logger;
}

export class WebsocketServer {
  private wss: Wss;
  constructor(config: WebSocketServerConfig) {
    this.wss = new Wss({ port: config.wssPort });
  }

  public async send<T>(message: string): Promise<T> {}

  public isBusy() {
    return false;
  }

  public isActive() {
    return false;
  }
}
