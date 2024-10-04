const os = require('os');
const { server_port, proxy_port, rpc_endpoint, wss_port } = require('./config/config');
const { ValidatingProxy } = require("./worker/proxy/validatingproxy");

const express = require('express');
const path = require('path');
const { currentDateStr } = require('./worker/common/util/dateutil');


function main() {
  const app = express();

  app.use(express.static('public'));
  app.get('/', function (req, res) {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  
  app.listen(server_port, () => {
    console.log();
    console.log(`${currentDateStr()} Transaction Firewall HTTP Server (to accept/reject transactions) is listening on port: ${server_port}`)
  });

  const proxy = new ValidatingProxy(rpc_endpoint, wss_port);
  proxy.listen(proxy_port, () => {
    console.log(`${currentDateStr()} ValidatingProxy is running: `);
    console.log(`${currentDateStr()}   proxy address (endpoint to be used in a wallet): http://${os.hostname()}.local:${proxy_port}`);
    console.log(`${currentDateStr()}   Ethereum RPC endpoint used by the firewall:      ${rpc_endpoint}`);
  });
}


main();
