import dotenv from "dotenv";

dotenv.config();

interface Config {
  serverPort: number;
  proxyPort: number;
  wssPort: number;
  rpcEndpoint: string;
  authorizedAddressesPath: string;
  knownContractsPath: string;
}

const config: Config = {
  serverPort: parseInt(process.env.SERVER_PORT || "8454", 10),
  proxyPort: parseInt(process.env.PROXY_PORT || "18500", 10),
  wssPort: parseInt(process.env.WSS_PORT || "18501", 10),
  rpcEndpoint: process.env.RPC_ENDPOINT || "http://eop-1.local:8545",
  authorizedAddressesPath: process.env.AUTHORIZED_ADDR_PATH || "auth_addr.json",
  knownContractsPath:
    process.env.KNOWN_CONTRACTS_PATH || "known_contracts.json",
};

export default config;
