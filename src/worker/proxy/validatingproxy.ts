import { ValidatingRequestProcessor } from './requestprocessor'
import * as http from 'http'

// FIXME; decide how to present transaction numbers, possible options:
// - increase counter only for transactions that were processed by the frontent (current behavior)
// - increase counter for every submitted transaction (and use in on the frontend)
// - show request id from the original request (this may be number, but also an uuid)

export class ValidatingProxy {
  private endpointUrl: string
  private requestProcessor: ValidatingRequestProcessor
  private server: http.Server

  constructor(endpointUrl: string, wssPort: number) {
    this.endpointUrl = endpointUrl
    this.requestProcessor = new ValidatingRequestProcessor(endpointUrl, wssPort)

    this.server = http.createServer((req, res) => {
      this.requestProcessor.processRequest(req, res)
    })
  }

  listen(port: number, callback: () => void): void {
    this.server.listen(port, () => {
      callback()
    })
  }
}