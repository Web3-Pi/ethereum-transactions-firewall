type LabelReaderFunction = (addr: string) => string

interface FieldData {
  type: string
  name: string
  value: string
  formatted: string
}

export class FieldDataProvider {
  private labelReaderFun: LabelReaderFunction

  constructor(labelReaderFun: LabelReaderFunction) {
    this.labelReaderFun = labelReaderFun
  }

  func(name: string): FieldData {
    return {
      type: 'function',
      name: name,
      value: name,
      formatted: name
    }
  }

  address(name: string, value: string): FieldData {
    return {
      type: 'address',
      name: name,
      value: value,
      formatted: `${value} [${this.labelReaderFun(value)}]`
    }
  }

  tokenValue(name: string, value: string, token: string): FieldData {
    return {
      type: 'tokenValue',
      name: name,
      value: value,
      formatted: `${value} ${token}`
    }
  }

  bytes(name: string, value: string): FieldData {
    return {
      type: 'bytes',
      name: name,
      value: value,
      formatted: value.length > 66 ? `${value.substring(0, 66)}...` : value
    }
  }

  bytes32(name: string, value: string): FieldData {
    return {
      type: 'bytes32',
      name: name,
      value: value,
      formatted: value
    }
  }

  uint256(name: string, value: string): FieldData {
    return {
      type: 'uint256',
      name: name,
      value: value,
      formatted: value
    }
  }
}