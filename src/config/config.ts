import dotenv from "dotenv";

dotenv.config();

export interface Config {
  mode: "interactive" | "non-interactive";
  serverPort: number;
  proxyPort: number;
  wssPort: number;
  rpcEndpoint: string;
  authorizedAddressesPath: string;
  knownContractsPath: string;
  interactiveModeTimeoutSec: number;
  addressRulesPath: string;
  valueRulesPath: string;
  contractRulesPath: string;
  metrics: {
    mode: string;
    batchSize: number;
    savingIntervalMs: number;
    printingIntervalMs: number;
    influx: {
      url: string;
      username: string;
      password: string;
      org: string;
      bucket: string;
    };
  };
}

const config: Config = {
  mode:
    (process.env.FIREWALL_MODE as "interactive" | "non-interactive") ||
    "interactive",
  serverPort: parseInt(process.env.SERVER_PORT || "8454", 10),
  proxyPort: parseInt(process.env.PROXY_PORT || "18500", 10),
  wssPort: parseInt(process.env.WSS_PORT || "18501", 10),
  rpcEndpoint: process.env.RPC_ENDPOINT || "http://eop-1.local:8545",
  authorizedAddressesPath: process.env.AUTHORIZED_ADDR_PATH || "auth_addr.json",
  knownContractsPath:
    process.env.KNOWN_CONTRACTS_PATH || "known_contracts.json",
  interactiveModeTimeoutSec: parseInt(
    process.env.INTERACTIVE_MODE_TIMEOUT_SEC || "30",
    10,
  ),
  addressRulesPath: process.env.ADDRESS_RULES_PATH || "address_rules.json",
  valueRulesPath: process.env.VALUE_RULES_PATH || "value_rules.json",
  contractRulesPath: process.env.CONTRACT_RULES_PATH || "contract_rules.json",
  metrics: {
    mode: process.env.METRICS_MODE || "stdout",
    batchSize: parseInt(process.env.METRICS_BATCH_SIZE || "100"),
    savingIntervalMs: parseInt(
      process.env.METRICS_SAVING_INTERVAL_MS || "10000",
    ),
    printingIntervalMs: parseInt(
      process.env.METRICS_PRINTING_INTERVAL_MS || "60000",
    ),
    influx: {
      url: process.env.METRICS_INFLUX_URL || "http://localhost:8086",
      username: process.env.METRICS_INFLUX_USERNAME || "admin",
      password: process.env.METRICS_INFLUX_PASSWORD || "web3-pi-password",
      org: process.env.METRICS_INFLUX_ORG || "web3-pi",
      bucket: process.env.METRICS_INFLUX_BUCKET || "web3-pi",
    },
  },
};

export default config;
