type LabelReaderFunction = (addr: string) => string

export class DummyHelper {
  private endpointUrl: string
  private labelReaderFun: LabelReaderFunction

  constructor(endpointUrl: string, labelReaderFun: LabelReaderFunction) {
    this.endpointUrl = endpointUrl
    this.labelReaderFun = labelReaderFun
  }

  msType0ConfirmedTxnResult(_addr: string, _txnId: string): any | null {
    // Dummy implementation
    return null
  }

  msType1ConfirmedTxnResult(_addr: string, _txnId: string): any | null {
    // Dummy implementation
    return null
  }
}