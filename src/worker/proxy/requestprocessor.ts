import { WebSocketTransactionValidator } from './transactionvalidator'
import { currentDateStr } from '../common/util/dateutil'
import { IncomingMessage, ServerResponse } from 'http'
import axios from 'axios'

interface JsonRpcRequest {
  jsonrpc: string
  id: string | number
  method: string
  params: any[]
}

interface JsonRpcErrorResponse {
  jsonrpc: string
  id: string | number
  error: {
    code: number
    message: string
  }
}

export class ValidatingRequestProcessor {
  private endpointUrl: string
  private txnValidator: WebSocketTransactionValidator

  constructor(endpointUrl: string, wssPort: number) {
    this.endpointUrl = endpointUrl
    this.txnValidator = new WebSocketTransactionValidator(endpointUrl, wssPort)
  }

  private logNewRequest(reqData: JsonRpcRequest): void {
    let paramsStr = JSON.stringify(reqData.params || []);

    if (paramsStr.length > 150 - 19) {
      paramsStr = paramsStr.substring(0, 150 - 19) + ' ..."]'
    }

    console.log(`${currentDateStr()} New request: ${reqData.method} -> params : ${paramsStr}`)
  }

  defaultReponseSetter(res: ServerResponse, response: any): void {
    res.statusCode = response.status
    
    for (const [header, value] of Object.entries(response.headers)) {
      if (header.toLowerCase() !== 'content-length') {
        res.setHeader(header, value as string)
      }
    }

    res.end(JSON.stringify(response.data))
  }

  async optionsReponseHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const response = await axios.options(this.endpointUrl, {
        headers: req.headers as Record<string, string>
      })
      
      res.statusCode = response.status
      
      for (const [header, value] of Object.entries(response.headers)) {
        if (header.toLowerCase() !== 'content-length') {
          res.setHeader(header, value as string)
        }
      }
      
      res.end()
    } catch (error) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: 'Internal Server Error' }))
    }
  }

  // FIXME: correct error code and error message should be returned here
  invalidResponseSetter(res: ServerResponse, reqData: JsonRpcRequest): void {
    res.writeHead(200, {'content-type': 'application/json'})
    const responseBody: JsonRpcErrorResponse = {
      jsonrpc: '2.0',
      id: reqData.id,
      error: {
        code: -32000,
        message: 'err: potential phishing attempt detected - reverting transaction'
      }
    }

    res.end(JSON.stringify(responseBody))
  }

  validatingResponseHandler(data: string, req: IncomingMessage, res: ServerResponse): void {
    const reqData: JsonRpcRequest = JSON.parse(data)

    this.logNewRequest(reqData)

    const headers: Record<string, string> = {}
    if (req.headers['origin'] !== undefined) {
      headers['origin'] = req.headers['origin'] as string
    }

    this.txnValidator.validateTransactionOnce(
      reqData,
      async () => {
        try {
          const response = await axios.post(
            this.endpointUrl,
            reqData,
            { headers }
          )
          this.defaultReponseSetter(res, response)
        } catch (error) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Error forwarding request' }))
        }
      },
      () => {
        this.invalidResponseSetter(res, reqData)
      }
    )
  }

  processRequest(req: IncomingMessage, res: ServerResponse): void {
    let data = ''
    req.on('data', chunk => {
      data += chunk
    })
    
    req.on('end', () => {
      if (req.method === 'OPTIONS') {
        this.optionsReponseHandler(req, res)
      } else {
        this.validatingResponseHandler(data, req, res)
      }
    })
  }
}