import { WebSocketTxnQuery } from '../common/connection/websocketxnquery'

interface JsonRpcRequest {
  jsonrpc: string
  id: string | number
  method: string
  params: any[]
}

export class WebSocketTransactionValidator {
  private wsc: WebSocketTxnQuery

  constructor(endpointUrl: string, wssPort: number) {
    this.wsc = new WebSocketTxnQuery(endpointUrl, wssPort)
  }

  validateTransactionOnce(
    reqData: JsonRpcRequest, 
    callbackAccepted: () => void, 
    callbackRejected: () => void
  ): void {
    if (reqData.method !== 'eth_sendRawTransaction') {
      callbackAccepted()
    } else {
      this.wsc.queryAcceptTransaction(reqData.params[0], callbackAccepted, callbackRejected)
    }
  }
}