import { Logger } from "../utils/logger.js";
import {
  Server,
  IncomingMessage,
  ServerResponse,
  createServer,
  request,
} from "http";
import { TransactionValidator } from "./transaction-validator.js";
import { TransactionBuilder } from "../transactions/transaction-builder.js";
import { JsonRpcRequest } from "web3";
import { recoverTransaction, TxData } from "web3-eth-accounts";

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
      this.logger.info(`Proxy listening on port ${this.proxyPort}`);
    });
  }

  private processRequest(req: IncomingMessage, res: ServerResponse) {
    if (req.method === "OPTIONS") {
      this.acceptRequest(null, req, res);
      return;
    }

    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      const data: JsonRpcRequest | null = null;
      try {
        const jsonRpcReq = JSON.parse(body) as JsonRpcRequest;
        const txData = this.getTxDataFromRequest(jsonRpcReq);
        if (!txData) {
          this.acceptRequest(jsonRpcReq, req, res);
          return;
        }
        const transaction = this.transactionBuilder.fromTxData(txData);
        this.logger.info(`Transaction received: ${transaction.toString()}`);
        this.transactionValidator.validate(transaction).then(() => {
          this.acceptRequest(data, req, res);
          this.logger.info(`Transaction accepted. ${transaction.toString()}`);
        });
      } catch (error) {
        this.rejectRequest(data, req, res);
        this.logger.warn(error, `Transaction rejected.`);
      }
    });
  }

  private acceptRequest(
    data: JsonRpcRequest | null,
    req: IncomingMessage,
    res: ServerResponse,
  ) {
    const endpointReq = request(
      this.endpointUrl,
      { method: req.method, headers: req.headers },
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
      const requestData = JSON.stringify(data);
      endpointReq.write(Buffer.from(requestData));
    }

    endpointReq.on("error", (error) => {
      this.logger.error(
        error,
        `Error occurred during request to endpoint: ${error}`,
      );
      res.statusCode = 500;
      res.end();
    });

    endpointReq.end();
  }

  private rejectRequest(
    data: JsonRpcRequest | null,
    req: IncomingMessage,
    res: ServerResponse,
  ) {
    res.writeHead(200, { "content-type": "application/json" });

    const responseBody = {
      ...data,
      error: {
        code: -32000,
        message:
          "err: potential phishing attempt detected - reverting transaction",
      },
    };

    res.end(JSON.stringify(responseBody));
  }

  private getTxDataFromRequest(req: JsonRpcRequest): TxData | null {
    if (req.method === "eth_sendTransaction") {
      return (req.params?.[0] as TxData) ?? null;
    } else if (req.method === "eth_sendRawTransaction") {
      const rawTx = req.params?.[0]
        ? recoverTransaction(req.params[0] as string)
        : null;
      return rawTx ? ({ data: rawTx } as TxData) : null;
    }
    return null;
  }
}
