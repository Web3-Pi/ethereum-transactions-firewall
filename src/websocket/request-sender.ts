import { Logger } from "../utils/logger.js";
import { WebSocketServer as Wss, WebSocket } from "ws";

export interface WebSocketServerConfig {
  wssPort: number;
  logger: Logger;
  timeoutMs?: number;
}

export class WebSocketRequestSender {
  private wss: Wss;
  private ws: WebSocket | null = null;
  private logger: Logger;
  private queryOngoing = false;
  private connectionCounter = 0;
  private activeConnectionId: number | null = null;

  constructor(config: WebSocketServerConfig) {
    this.wss = new Wss({ port: config.wssPort });
    this.logger = config.logger;
    this.wss.on("connection", this.handleConnection.bind(this));
    this.wss.on("listening", () =>
      this.logger.info(`WebSocket server listening on port ${config.wssPort}`),
    );
  }

  public close() {
    this.wss.close(() => this.logger.info(`WebSocket server closed`));
  }

  private handleConnection(ws: WebSocket) {
    this.activeConnectionId = this.connectionCounter++;
    this.logger.info(
      `Client app connected to firewall. Connection #: ${this.activeConnectionId}`,
    );

    if (this.ws) {
      this.logger.info(`Replacing connection: ${this.activeConnectionId}`);
      this.ws.close();
    }

    ws.onmessage = (msg) => {
      this.logger.debug(`Received message: ${msg.data}`);
      this.queryOngoing = false;
    };

    ws.onclose = () => {
      this.handleDisconnection("Connection closed");
    };

    ws.onerror = (error) => {
      this.handleDisconnection(error.message);
    };

    this.ws = ws;
    this.queryOngoing = false;
  }

  private handleDisconnection(reason: string) {
    this.logger.warn(
      `Closing connection: ${this.activeConnectionId}. Reason: ${reason}`,
    );
    if (this.activeConnectionId === this.connectionCounter - 1) {
      this.ws = null;
    }
    this.queryOngoing = false;
  }

  public isBusy(): boolean {
    return this.queryOngoing;
  }

  public isActive(): boolean {
    return this.ws !== null;
  }

  public async send<T>(data: string, timeoutMs: number = 60_000): Promise<T> {
    if (!this.ws) {
      throw new Error("WebSocket is not connected");
    }

    this.queryOngoing = true;

    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.queryOngoing = false;
        reject(new Error("WebSocket request timed out"));
      }, timeoutMs);

      this.ws!.send(data, (err) => {
        if (err) {
          clearTimeout(timeout);
          this.queryOngoing = false;
          return reject(err);
        }

        const handleMessage = (msg: string) => {
          clearTimeout(timeout);
          resolve(JSON.parse(msg) as T);
          this.ws!.off("message", handleMessage);
        };

        const handleError = (error: Error) => {
          clearTimeout(timeout);
          reject(error);
          this.ws!.off("error", handleError);
        };

        this.ws!.on("message", handleMessage);
        this.ws!.on("error", handleError);
      });
    }).finally(() => {
      this.queryOngoing = false;
    });
  }
}
