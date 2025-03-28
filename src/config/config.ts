import dotenv from "dotenv";

dotenv.config();

interface Config {
  serverPort: number;
  proxyPort: number;
  wssPort: number;
  rpcEndpoint: string;
  authorizedAddresses: string;
  knownContracts: string;
  knownContractAbis: string;
}

const config: Config = {
  serverPort: parseInt(process.env.SERVER_PORT || "8454", 10),
  proxyPort: parseInt(process.env.PROXY_PORT || "18500", 10),
  wssPort: parseInt(process.env.WSS_PORT || "18501", 10),
  rpcEndpoint: process.env.RPC_ENDPOINT || "http://localhost:8545",
  authorizedAddresses: process.env.AUTHORIZED_ADDR_FN || "auth_addr.json",
  knownContracts: process.env.KNOWN_CONTRACTS_FN || "known_contracts.json",
  knownContractAbis: process.env.CONTRACT_ABIS_FN || "known_contract_abis.json",
};

export default config;
