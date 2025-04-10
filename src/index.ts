import * as os from 'os'
import config from './config/config'
import { ValidatingProxy } from './worker/proxy/validatingproxy'
import express from 'express'
import * as path from 'path'
import { currentDateStr } from './worker/common/util/dateutil'

function main(): void {
  const app = express()

  app.use(express.static('public'))
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
  })
  
  app.listen(config.server_port, () => {
    console.log()
    console.log(`${currentDateStr()} Transaction Firewall HTTP Server (to accept/reject transactions) is listening on port: ${config.server_port}`)
  })

  const proxy = new ValidatingProxy(config.rpc_endpoint, config.wss_port)
  proxy.listen(config.proxy_port, () => {
    console.log(`${currentDateStr()} ValidatingProxy is running: `)
    console.log(`${currentDateStr()}   proxy address (endpoint to be used in a wallet): http://${os.hostname()}.local:${config.proxy_port}`)
    console.log(`${currentDateStr()}   Ethereum RPC endpoint used by the firewall:      ${config.rpc_endpoint}`)
  })
}

main()