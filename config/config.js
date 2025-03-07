// https://medium.com/the-node-js-collection/making-your-node-js-work-everywhere-with-environment-variables-2da8cdf6e786

const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  node_env: process.env.NODE_ENV || 'development',
  server_port: process.env.SERVER_PORT || '8454',
  proxy_port: process.env.PROXY_PORT || '18500',
  wss_port: process.env.WSS_PORT || '18501',
  rpc_endpoint: process.env.RPC_ENDPOINT || 'http://localhost:8545',
  authorized_addr_fn: process.env.AUTHORIZED_ADDR_FN || 'auth_addr',
  known_contracts_fn: process.env.KNOWN_CONTRACTS_FN || 'known_contracts',
  contract_abis_fn: process.env.CONTRACT_ABIS_FN || 'contract_abis',
};

