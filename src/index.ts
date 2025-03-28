import express from "express";
import path from "path";
import { createLogger } from "./utils/logger.js";
import config from "./config/config.js";
import { fileURLToPath } from "node:url";

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
    this.app.listen(config.serverPort, () =>
      this.logger.info(
        `Transaction Firewall HTTP Server started on port: ${config.serverPort}`,
      ),
    );
  }
}

new App();
