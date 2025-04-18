import express from "express";
import path from "path";
import { createLogger } from "./utils/logger.js";
import config from "./config/config.js";
import { fileURLToPath } from "node:url";
import { ValidatingProxy } from "./proxy/proxy.js";
import { WebsocketTransactionValidator } from "./proxy/validator.js";
import { TransactionBuilder } from "./transactions/builder.js";
import { ContractParser } from "./transactions/parser.js";
import { hostname } from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class App {
  private app = express();
  private logger = createLogger();
  private proxy?: ValidatingProxy;

  constructor() {
    this.setupMiddleware();
    this.setupRoutes();
    this.startServices();
  }

  private setupMiddleware(): void {
    const publicDir = path.join(__dirname, "../frontend/dist");
    this.app.get("/config.js", (req, res) => {
      res.setHeader("Content-Type", "application/javascript");
      res.send(
        `window.__CONFIG = { WS_URL: "ws://${hostname}:${config.wssPort}", INTERACTIVE_MODE_TIMEOUT_SEC: ${config.interactiveModeTimeoutSec} };`,
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
        authorizedAddressesPath: config.authorizedAddressesPath,
        knownContractsPath: config.knownContractsPath,
      },
      this.logger,
    );
    const transactionValidator = new WebsocketTransactionValidator({
      wssPort: config.wssPort,
      logger: this.logger,
      timeoutMs: config.interactiveModeTimeoutSec * 1000,
    });
    this.proxy = new ValidatingProxy(transactionValidator, transactionBuilder, {
      proxyPort: config.proxyPort,
      endpointUrl: config.rpcEndpoint,
      logger: this.logger,
    });

    this.app.listen(config.serverPort, () =>
      this.proxy!.listen().then(() =>
        this.logger.info(
          `Transaction Firewall HTTP Server (to accept/reject transactions): http://${hostname}:${config.serverPort}`,
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

new App();
