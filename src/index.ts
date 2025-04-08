import express from "express";
import path from "path";
import { createLogger } from "./utils/logger.js";
import config from "./config/config.js";
import { fileURLToPath } from "node:url";
import { ValidatingProxy } from "./proxy/proxy.js";
import { WebsocketTransactionValidator } from "./proxy/validator.js";
import { TransactionBuilder } from "./transactions/builder.js";
import { ContractParser } from "./transactions/parser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class App {
  private app = express();
  private logger = createLogger();

  constructor() {
    this.setupMiddleware();
    this.setupRoutes();
    this.startServices();
  }

  private setupMiddleware(): void {
    const publicDir = path.join(__dirname, "../frontend/dist");
    this.app.use(express.static(publicDir));
  }

  private setupRoutes(): void {
    const publicDir = path.join(__dirname, "../frontend/dist");

    this.app.get("/", (req, res) => {
      res.sendFile(path.join(publicDir, "index.html"));
    });
  }

  private startServices(): void {
    const contractParser = new ContractParser();
    const transactionBuilder = new TransactionBuilder(contractParser, {
      authorizedAddressesPath: config.authorizedAddressesPath,
      knownContractsPath: config.knownContractsPath,
      knownContractAbisPath: config.knownContractAbisPath,
    });
    const transactionValidator = new WebsocketTransactionValidator({
      wssPort: config.wssPort,
      logger: this.logger,
    });
    const proxy = new ValidatingProxy(
      transactionValidator,
      transactionBuilder,
      {
        proxyPort: config.proxyPort,
        endpointUrl: config.rpcEndpoint,
        logger: this.logger,
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
