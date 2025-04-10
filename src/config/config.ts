// https://medium.com/the-node-js-collection/making-your-node-js-work-everywhere-with-environment-variables-2da8cdf6e786

import dotenv from 'dotenv'

const result = dotenv.config()

if (result.error) {
  throw result.error
}

interface EnvConfig {
  server_port: number
  proxy_port: number
  rpc_endpoint: string
  wss_port: number
  authorized_addr_fn: string
  known_contracts_fn: string
  contract_abis_fn: string
  [key: string]: string | number
}

// Convert string values to appropriate types
const envs: EnvConfig = {
  ...result.parsed as Record<string, string>,
  server_port: parseInt(result.parsed?.server_port || '3000', 10),
  proxy_port: parseInt(result.parsed?.proxy_port || '8545', 10),
  wss_port: parseInt(result.parsed?.wss_port || '8546', 10)
}

export default envs