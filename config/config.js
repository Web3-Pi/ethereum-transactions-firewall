// https://medium.com/the-node-js-collection/making-your-node-js-work-everywhere-with-environment-variables-2da8cdf6e786

const dotenv = require('dotenv');
dotenv.config();

module.exports  = {
  node_env: process.env.node_env || 'development',
  server_port: process.env.server_port || '8454',
  proxy_port: process.env.proxy_port || '18500',
  wss_port: process.env.wss_port || '18501',
  rpc_endpoint: process.env.rpc_endpoint || 'http://localhost:8545',
  authorized_addr_fn: process.env.authorized_addr_fn || 'auth_addr',
  known_contracts_fn: process.env.known_contracts_fn || 'known_contracts',
  contract_abis_fn: process.env.contract_abis_fn || 'contract_abis',
};

