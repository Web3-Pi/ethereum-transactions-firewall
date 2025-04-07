import { Logger } from "../utils/logger.js";
import { Server, IncomingMessage, ServerResponse, createServer } from "http";
import { TransactionValidator } from "./validator.js";
import { TransactionBuilder } from "../transactions/builder.js";
import { JsonRpcRequest } from "web3";
import fetch from "node-fetch";
import { normalizeHeaders } from "../utils/http.js";

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

  private async processRequest(req: IncomingMessage, res: ServerResponse) {
    if (req.method === "OPTIONS") {
      this.acceptRequest(null, req, res).then();
      return;
    }

    let body: string = "";

    req.on("data", (chunk) => (body += chunk));

    req.on("end", () => {
      let rpcReq: JsonRpcRequest | null = null;
      try {
        rpcReq = JSON.parse(body) as JsonRpcRequest;
        const transaction = this.transactionBuilder.fromJsonRpcRequest(rpcReq);
        if (!transaction) {
          this.acceptRequest(rpcReq, req, res);
          return;
        }
        this.logger.info(
          { transaction: transaction.dto },
          `Transaction received`,
        );
        this.transactionValidator
          .validate(transaction)
          .then(() => {
            this.acceptRequest(rpcReq, req, res);
            this.logger.info(
              { transaction: transaction.dto },
              `Transaction accepted`,
            );
          })
          .catch((error) => {
            this.rejectRequest(res, error);
            this.logger.warn(
              { transaction: transaction.dto, reason: error?.message },
              `Transaction rejected`,
            );
          });
      } catch (error) {
        this.rejectRequest(res, error as Error);
        this.logger.error(error, `Something went wrong. Transaction rejected.`);
      }
    });
  }

  private async acceptRequest(
    data: JsonRpcRequest | null,
    req: IncomingMessage,
    res: ServerResponse,
  ) {
    try {
      const rpcResponse = await fetch(this.endpointUrl, {
        method: req.method,
        headers: normalizeHeaders(req, { host: "" }),
        body: data ? JSON.stringify(data) : undefined,
        compress: false,
      });

      res.statusCode = rpcResponse.status;
      rpcResponse.headers.forEach((value, key) => res.setHeader(key, value));

      if (rpcResponse.body) {
        rpcResponse.body.pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      this.logger.error(
        error,
        `Error occurred during rpc request to endpoint: ${error}`,
      );
      res.statusCode = 500;
      res.end(String(error) || "Unknown Error");
    }
  }

  private rejectRequest(res: ServerResponse, error?: Error) {
    res.writeHead(200, { "content-type": "application/json" });

    const responseBody = {
      error: {
        code: -32000,
        message: `Error: potential phishing attempt detected - reverting transaction. ${error?.message || error}`,
      },
    };

    res.end(JSON.stringify(responseBody));
  }
}
