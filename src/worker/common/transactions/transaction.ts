export type ParsedContractData = {
  method?: string
  args?: Record<string, any>
  description?: string
} | null

export class StubTransaction {
  from: string
  to: string
  value: string
  data: string
  parsedData: ParsedContractData
  
  constructor(from: string, to: string, value: string, data: string, parsedData: ParsedContractData) {
    this.from = from
    this.to = to
    this.value = value
    this.data = data
    this.parsedData = parsedData
  }

  toString(): string {
    return JSON.stringify(this)
  }
}

export class TransactionPayload {
  id: number
  labelFrom: string
  labelTo: string
  txn: StubTransaction

  constructor(id: number, labelFrom: string, labelTo: string, txn: StubTransaction) {
    this.id = id
    this.labelFrom = labelFrom
    this.labelTo = labelTo
    this.txn = txn
  }

  toString(): string {
    return JSON.stringify(this)
  }
}