import assert from 'assert'
import WebSocket from 'ws'

import { BlockingWebSocket } from '../blockingwebsocket'
import { RawTransactionDecoder } from '../transactions/decoders'
import { UserSessionData } from '../../session/usersessiondata'
import { TransactionPayload } from '../transactions/transaction'
import { currentDateStr } from '../util/dateutil'

interface TransactionResponse {
  id: number
  status: string
}

export class WebSocketTxnQuery {
  private userSessionData: UserSessionData
  private curTxnId: number
  private webSocket: BlockingWebSocket
  private decoder: RawTransactionDecoder
  private wss: WebSocket.Server

  constructor(endpointUrl: string, wssPort: number) {
    console.log(`${currentDateStr()}  Websocket server is running on port: ${wssPort}`)

    this.userSessionData = new UserSessionData(endpointUrl)

    this.curTxnId = 0
    this.webSocket = new BlockingWebSocket(null)

    this.decoder = new RawTransactionDecoder(this.userSessionData)
    this.wss = new WebSocket.Server({ port: wssPort })

    this.wss.on('connection', (ws) => {
      this.webSocket.updateWebSocket(ws)
    })
  }

  private getTxnPayloadString(id: number, rawTxn: string): string {
    const txn = this.decoder.decodeTxn(rawTxn)
    const labelFrom = this.userSessionData.getLabel(txn.from)
    const labelTo = this.userSessionData.getLabel(txn.to)

    return new TransactionPayload(id, labelFrom, labelTo, txn).toString()
  }

  queryAcceptTransaction(
    rawTxn: string, 
    callbackAccepted: () => void, 
    callbackRejected: () => void
  ): void {
    if (!this.webSocket.isActive()) {
      console.log(`${currentDateStr()} Websocket not connected -> ACCEPTING current transaction`)
      callbackAccepted()
    } else if (this.webSocket.isBusy()) {
      console.log(`${currentDateStr()} Websocket is busy processing a query -> ACCEPTING current transaction`)
      callbackAccepted()
    } else {
      const id = this.curTxnId++
      this.webSocket.send(this.getTxnPayloadString(id, rawTxn)).then(
        (result) => {
          const res = JSON.parse(result) as TransactionResponse
          assert(id === res.id)
          res.status === 'accepted' ? callbackAccepted() : callbackRejected()
        }
      ).catch((error) => {
        console.error(`Error sending transaction via WebSocket: ${error}`)
        callbackAccepted() // Default to accepting on error
      })
    }
  }
}