import { Logger } from "../utils/logger.js";
import { Server, IncomingMessage, ServerResponse, createServer } from "http";
import { TransactionValidator, ValidationError } from "./validator.js";
import { TransactionBuilder } from "../transactions/builder.js";
import { JsonRpcRequest } from "web3";
import fetch from "node-fetch";
import { normalizeHeaders } from "../utils/http.js";
import { hostname } from "node:os";
import { WrappedTransaction } from "../transactions/transaction.js";
import { Metrics, MetricsCollector } from "../metrics/metrics.js";

export interface ProxyConfig {
  proxyPort: number;
  endpointUrl: string;
  logger: Logger;
  mode: "interactive" | "non-interactive";
}

export class ValidatingProxy {
  private logger: Logger;
  private server: Server;
  private readonly proxyPort: number;
  private readonly endpointUrl: string;

  constructor(
    private config: ProxyConfig,
    private transactionValidator: TransactionValidator,
    private transactionBuilder: TransactionBuilder,
    private metricsCollector?: MetricsCollector,
  ) {
    this.logger = config.logger;
    this.proxyPort = config.proxyPort;
    this.endpointUrl = config.endpointUrl;

    this.server = createServer(this.processRequest.bind(this));
  }

  public async listen(): Promise<void> {
    await this.transactionBuilder.loadConfig();
    await this.transactionValidator.init();
    await this.metricsCollector?.init();
    this.server.listen(this.proxyPort, () => {
      this.logger.info(
        {
          "Proxy address (endpoint to be used in a wallet)": `http://${hostname}:${this.proxyPort}`,
          "Ethereum RPC endpoint used by the firewall": this.endpointUrl,
        },
        `Validating Proxy is running in ${this.config.mode} mode.`,
      );
    });
  }

  public async reload() {
    await this.transactionBuilder.loadConfig();
  }

  public async close(): Promise<void> {
    this.metricsCollector?.close();
    this.server.close(() => this.logger.info(`Validating Proxy closed`));
  }

  private async processRequest(req: IncomingMessage, res: ServerResponse) {
    if (req.method === "OPTIONS") {
      this.acceptRequest(null, req, res).then();
      return;
    }

    let body: string = "";

    req.on("data", (chunk) => (body += chunk));

    req.on("end", async () => {
      try {
        const parsedData = JSON.parse(body) as
          | JsonRpcRequest[]
          | JsonRpcRequest;
        const transactions: WrappedTransaction[] = [];

        if (Array.isArray(parsedData)) {
          this.logger.debug(
            { batchSize: parsedData.length },
            `Batch RPC requests received`,
          );
          parsedData.forEach((rpcReq) => {
            const transaction =
              this.transactionBuilder.fromJsonRpcRequest(rpcReq);
            if (transaction) {
              transactions.push(transaction);
            }
          });
        } else {
          this.logger.debug({ rpcReq: parsedData }, `RPC request received`);
          const transaction =
            this.transactionBuilder.fromJsonRpcRequest(parsedData);
          if (transaction) {
            transactions.push(transaction);
          }
        }
        if (!transactions.length) {
          const metrics = Array.isArray(parsedData)
            ? parsedData.map((d) => ({
                jsonRpcId: d.id?.toString(),
                jsonRpcMethod: d.method,
                date: new Date(),
                result: "forwarded",
              }))
            : [
                {
                  jsonRpcId: parsedData.id?.toString(),
                  jsonRpcMethod: parsedData.method,
                  date: new Date(),
                  result: "forwarded",
                },
              ];
          metrics.forEach((m) => this.metricsCollector?.collect(m as Metrics));
          return this.acceptRequest(parsedData, req, res);
        }

        for (const transaction of transactions) {
          await this.transactionValidator.validate(transaction);
          this.logger.info(
            { transaction: transaction.dto },
            `Transaction accepted`,
          );
          this.metricsCollector?.collect({
            jsonRpcId: transaction.jsonRpcId,
            jsonRpcMethod: "eth_sendRawTransaction",
            tx: transaction.dto,
            date: new Date(),
            result: "accepted",
          });
        }
        await this.acceptRequest(parsedData, req, res);
      } catch (error) {
        this.rejectRequest(res, error as Error);
        if (error instanceof ValidationError) {
          this.logger.warn(
            { transaction: error.tx, reason: error?.message },
            `Transaction rejected`,
          );
          this.metricsCollector?.collect({
            jsonRpcId: error.jsonRpcId,
            jsonRpcMethod: "eth_sendRawTransaction",
            tx: error.tx,
            date: new Date(),
            result: "rejected",
          });
        } else {
          this.logger.error(
            error,
            `Something went wrong. Transaction rejected.`,
          );
        }
      }
    });
  }

  private async acceptRequest(
    data: JsonRpcRequest | JsonRpcRequest[] | null,
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
