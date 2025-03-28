const os = require("os");
const {
  server_port,
  proxy_port,
  rpc_endpoint,
  wss_port,
} = require("../config/config.js");
const { ValidatingProxy } = require("./proxy/validatingproxy.js");

const express = require("express");
const path = require("path");
const { currentDateStr } = require("./common/util/dateutil.js");

function main() {
  const app = express();
  const proxy = new ValidatingProxy(rpc_endpoint, wss_port);

  app.use(express.static(path.join(__dirname, "public")));
  app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });
  app.get("/reload", function (req, res) {
    proxy.reload();
    res.send("reloaded");
  });

  app.listen(server_port, () => {
    console.log();
    console.log(
      `${currentDateStr()} Transaction Firewall HTTP Server (to accept/reject transactions) is listening on port: ${server_port}`,
    );
  });

  proxy.listen(proxy_port, () => {
    console.log(`${currentDateStr()} ValidatingProxy is running: `);
    console.log(
      `${currentDateStr()}   proxy address (endpoint to be used in a wallet): http://${os.hostname()}.local:${proxy_port}`,
    );
    console.log(
      `${currentDateStr()}   Ethereum RPC endpoint used by the firewall:      ${rpc_endpoint}`,
    );
  });
}

main();
