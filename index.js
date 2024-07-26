const { server_port, proxy_port, rpc_endpoint, wss_port } = require('./config/config');
const { ValidatingProxy } = require("./worker/proxy/validatingproxy");

const express = require('express');
const path = require('path');


function main() {
  const app = express();

  app.use(express.static('public'));
  app.get('/', function (req, res) {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  
  app.listen(server_port, () => {
    console.log(`Transaction Firewall Server listening on port: ${server_port}`)
  });

  const proxy = new ValidatingProxy(rpc_endpoint, wss_port);
  proxy.listen(proxy_port, () => {
    console.log(`ValidatingProxy is running: `);
    console.log(`  proxy address: http://localhost:${proxy_port}`);
    console.log(`  RPC endpoint:  ${rpc_endpoint}`);
  });
}


main();
