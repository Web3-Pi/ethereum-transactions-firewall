import { Logger } from "../utils/logger.js";
import {
  Server,
  IncomingMessage,
  ServerResponse,
  createServer,
  request,
} from "http";
import { TransactionValidator } from "./validator.js";
import { TransactionBuilder } from "../transactions/builder.js";
import { JsonRpcRequest } from "web3";

export interface ProxyConfig {
  proxyPort: number;
  endpointUrl: string;
  logger: Logger;
}

export class ValidatingProxy {
  private logger: Logger;
  private server: Server;
  private readonly proxyPort: number;
  private readonly endpointUrl: string;

  constructor(
    private transactionValidator: TransactionValidator,
    private transactionBuilder: TransactionBuilder,
    config: ProxyConfig,
  ) {
    this.logger = config.logger;
    this.proxyPort = config.proxyPort;
    this.endpointUrl = config.endpointUrl;

    this.server = createServer(this.processRequest.bind(this));
  }

  public async listen(): Promise<void> {
    await this.transactionBuilder.loadConfig();
    this.server.listen(this.proxyPort, () => {
      this.logger.info(`Validating Proxy started on port: ${this.proxyPort}`);
    });
  }

  public async close(): Promise<void> {
    this.server.close(() => this.logger.info(`Proxy closed`));
  }

  private processRequest(req: IncomingMessage, res: ServerResponse) {
    if (req.method === "OPTIONS") {
      this.acceptRequest(null, req, res);
      return;
    }

    let body: string = "";

    req.on("data", (chunk) => (body += chunk));

    req.on("end", () => {
      const data: JsonRpcRequest | null = null;
      try {
        const jsonRpcReq = JSON.parse(body) as JsonRpcRequest;
        const transaction =
          this.transactionBuilder.fromJsonRpcRequest(jsonRpcReq);
        if (!transaction) {
          this.acceptRequest(jsonRpcReq, req, res);
          return;
        }
        this.logger.info(
          { transaction: transaction.dto },
          `Transaction received`,
        );
        this.transactionValidator
          .validate(transaction)
          .then(() => {
            this.acceptRequest(data, req, res);
            this.logger.info(
              { transaction: transaction.dto },
              `Transaction accepted`,
            );
          })
          .catch((error) => {
            this.rejectRequest(data, req, res, error);
            this.logger.warn(
              { transaction: transaction.dto, reason: error?.message },
              `Transaction rejected`,
            );
          });
      } catch (error) {
        this.rejectRequest(data, req, res, error as Error);
        this.logger.error(error, `Something went wrong. Transaction rejected.`);
      }
    });
  }

  private acceptRequest(
    data: JsonRpcRequest | null,
    req: IncomingMessage,
    res: ServerResponse,
  ) {
    const requestOptions = {
      method: req.method,
      headers: {
        ...req.headers,
        "Content-Type": "application/json",
        "Content-Length": data ? JSON.stringify(data).length : 0,
      },
      timeout: 30000,
    };

    const endpointReq = request(
      this.endpointUrl,
      requestOptions,
      (endpointRes) => {
        res.statusCode = endpointRes.statusCode || 500;
        Object.entries(endpointRes.headers).forEach(([header, value]) => {
          if (header.toLowerCase() !== "content-length") {
            res.setHeader(header, value as string);
          }
        });
        endpointRes.on("data", (chunk) => res.write(chunk));
        endpointRes.on("end", () => res.end());
      },
    );

    if (data) {
      endpointReq.write(JSON.stringify(data));
    }

    endpointReq.on("timeout", () => {
      this.logger.error(`Request to ${this.endpointUrl} timed out`);
      endpointReq.destroy();
      res.statusCode = 504;
      res.end("Request timed out");
    });

    endpointReq.on("error", (error) => {
      this.logger.error(
        error,
        `Error occurred during request to endpoint: ${error}`,
      );
      res.statusCode = 500;
      res.end(error);
    });

    endpointReq.end();
  }

  private rejectRequest(
    data: JsonRpcRequest | null,
    req: IncomingMessage,
    res: ServerResponse,
    error?: Error,
  ) {
    res.writeHead(200, { "content-type": "application/json" });

    const responseBody = {
      ...data,
      error: {
        code: -32000,
        message: `Error: potential phishing attempt detected - reverting transaction. ${error?.message || error}`,
      },
    };

    res.end(JSON.stringify(responseBody));
  }
}
