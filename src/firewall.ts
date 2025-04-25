import express from "express";
import path from "path";
import { createLogger } from "./utils/logger.js";
import { fileURLToPath } from "node:url";
import { ValidatingProxy } from "./proxy/proxy.js";
import { WebsocketTransactionValidator } from "./proxy/validator.js";
import { TransactionBuilder } from "./transactions/builder.js";
import { ContractParser } from "./transactions/parser.js";
import { hostname } from "node:os";
import { Config } from "./config/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Firewall {
  private app = express();
  private logger = createLogger();
  private proxy?: ValidatingProxy;

  constructor(private config: Config) {
    this.setupMiddleware();
    this.setupRoutes();
    this.startServices();
  }

  private setupMiddleware(): void {
    const publicDir = path.join(__dirname, "../frontend/dist");
    this.app.get("/config.js", (req, res) => {
      res.setHeader("Content-Type", "application/javascript");
      res.send(
        `window.__CONFIG = { WS_URL: "ws://${hostname}:${this.config.wssPort}", INTERACTIVE_MODE_TIMEOUT_SEC: ${this.config.interactiveModeTimeoutSec} };`,
      );
    });

    this.app.use(express.static(publicDir));
  }

  private setupRoutes(): void {
    const publicDir = path.join(__dirname, "../frontend/dist");

    this.app.get("/", (req, res) => {
      res.sendFile(path.join(publicDir, "index.html"));
    });

    this.app.post("/api/reload", async (req, res) => {
      if (!this.proxy) {
        res.status(500).send("Proxy not running");
        return;
      }
      await this.proxy.reload();
      res.send("Configuration files reloaded");
    });
  }

  private startServices(): void {
    const contractParser = new ContractParser();
    const transactionBuilder = new TransactionBuilder(
      contractParser,
      {
        authorizedAddressesPath: this.config.authorizedAddressesPath,
        knownContractsPath: this.config.knownContractsPath,
      },
      this.logger,
    );
    const transactionValidator = new WebsocketTransactionValidator({
      wssPort: this.config.wssPort,
      logger: this.logger,
      timeoutMs: this.config.interactiveModeTimeoutSec * 1000,
    });
    this.proxy = new ValidatingProxy(transactionValidator, transactionBuilder, {
      proxyPort: this.config.proxyPort,
      endpointUrl: this.config.rpcEndpoint,
      logger: this.logger,
    });

    this.app.listen(this.config.serverPort, () =>
      this.proxy!.listen().then(() =>
        this.logger.info(
          `Transaction Firewall HTTP Server (to accept/reject transactions): http://${hostname}:${this.config.serverPort}`,
        ),
      ),
    );

    process.on("SIGINT", async () => {
      this.logger.info("Shutting down gracefully...");

      await this.proxy!.close();
      transactionValidator.close();
      this.logger.info("Transaction Firewall closed");

      process.exit(0);
    });
  }
}
