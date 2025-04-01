import express from "express";
import path from "path";
import { createLogger } from "./utils/logger.js";
import config from "./config/config.js";
import { fileURLToPath } from "node:url";
import { ValidatingProxy } from "./proxy/validating-proxy.js";
import { WebsocketTransactionValidator } from "./proxy/transaction-validator.js";
import { TransactionBuilder } from "./transactions/transaction-builder.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class App {
  private app = express();
  private logger = createLogger("w3p-tx-firewall");

  constructor() {
    this.setupMiddleware();
    this.setupRoutes();
    this.startServices();
  }

  private setupMiddleware(): void {
    const publicDir = path.join(__dirname, "public");
    this.app.use(express.static(publicDir));
  }

  private setupRoutes(): void {
    const publicDir = path.join(__dirname, "public");

    this.app.get("/", (req, res) => {
      res.sendFile(path.join(publicDir, "index.html"));
    });
  }

  private startServices(): void {
    const transactionBuilder = new TransactionBuilder({
      authorizedAddressesPath: config.authorizedAddressesPath,
      knownContractsPath: config.knownContractsPath,
      knownContractAbisPath: config.knownContractAbisPath,
    });
    const transactionValidator = new WebsocketTransactionValidator({
      wssPort: config.wssPort,
      logger: this.logger.child({ module: "validator" }),
    });
    const proxy = new ValidatingProxy(
      transactionValidator,
      transactionBuilder,
      {
        proxyPort: config.proxyPort,
        endpointUrl: config.rpcEndpoint,
        logger: this.logger.child({ module: "proxy" }),
      },
    );

    proxy
      .listen()
      .then(() =>
        this.app.listen(config.serverPort, () =>
          this.logger.info(
            `Transaction Firewall HTTP Server started on port: ${config.serverPort}`,
          ),
        ),
      );
  }
}

new App();
