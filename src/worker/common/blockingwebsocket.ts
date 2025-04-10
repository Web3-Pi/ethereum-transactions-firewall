import { currentDateStr } from './util/dateutil'
import WebSocket from 'ws'

interface EnhancedWebSocket extends WebSocket {
  cc: number
  receive: () => Promise<string>
}

export class BlockingWebSocket {
  private ws: EnhancedWebSocket | null = null
  private queryOngoing: boolean
  private counter: number
  private cc?: number

  constructor(ws: WebSocket | null) {
    this.ws = null

    if (ws != null) {
      this.updateWebSocket(ws)
    }

    this.queryOngoing = false
    this.counter = 0
  }

  updateWebSocket(ws: WebSocket): void {
    const enhancedWs = ws as EnhancedWebSocket
    enhancedWs.cc = this.counter++
    console.log(`${currentDateStr()} New websocket connection: ${enhancedWs.cc}`)

    if (this.ws != null) {
      this.ws.close()
    }

    enhancedWs.receive = () => {
      return new Promise((resolve, reject) => {
        enhancedWs.onmessage = (msg) => {
          return resolve((msg.data as Buffer).toString())
        }

        enhancedWs.onerror = (error) => {
          return reject(error)
        }
      })
    }

    enhancedWs.on('close', () => {
      console.log(`${currentDateStr()} Closing connection: ${enhancedWs.cc} - reason: connection closed`)
      
      if (this.cc === enhancedWs.cc) {
        this.ws = null
      }

      this.queryOngoing = false
    })

    enhancedWs.onerror = () => {
      console.log(`${currentDateStr()} Closing connection: ${enhancedWs.cc} - reason: connection error`)
      
      if (this.cc === enhancedWs.cc) {
        this.ws = null
      }

      this.queryOngoing = false
    }

    this.ws = enhancedWs
    this.cc = enhancedWs.cc
    this.queryOngoing = false
  }

  isBusy(): boolean {
    return this.queryOngoing
  }

  isActive(): boolean {
    return this.ws != null
  }

  async send(data: string): Promise<string> {
    if (!this.ws) {
      throw new Error('WebSocket is not connected')
    }
    
    this.queryOngoing = true

    this.ws.send(data)
    const res = await this.ws.receive()

    this.queryOngoing = false

    return res
  }
}