import abiDecoder from 'abi-decoder'
import { DummyHelper } from './dummyhelper'
import { FieldDataProvider } from './fielddataprovider'
import { ParsedContractData } from '../transaction'

type ContractMethod = {
  name: string
  params: Array<{
    name: string
    value: string
    type: string
  }>
}

type LabelReaderFunction = (addr: string) => string

export class ContractDataParser {
  private contracts: Record<string, string>
  private abis: Record<string, any[]>
  private dummyHelper: DummyHelper
  private fields: FieldDataProvider

  constructor(
    endpointUrl: string, 
    knownContracts: Record<string, string>, 
    knownABIs: Record<string, any[]>, 
    labelReaderFun: LabelReaderFunction
  ) {
    this.contracts = knownContracts
    this.abis = knownABIs
    this.dummyHelper = new DummyHelper(endpointUrl, labelReaderFun)
    this.fields = new FieldDataProvider(labelReaderFun)
  }

  private getABI(addr: string): any[] | null {
    if (addr in this.contracts) {
      const contract = this.contracts[addr]

      if (contract in this.abis) {
        return this.abis[contract]
      }
    }

    return null
  }

  private getContractType(addr: string): string | undefined {
    return this.contracts[addr]
  }

  private parseGLM(method: ContractMethod): ParsedContractData {
    let res: ParsedContractData = {}

    if (method.name === 'transfer') {
      res = {
        method: 'transfer',
        args: {
          to: method.params[0].value,
          value: method.params[1].value
        },
        description: `Transfer GLM to ${method.params[0].value}`
      }
    }

    return res
  }

  parseContractData(address: string, data: string): ParsedContractData {
    const abi = this.getABI(address)

    if (data.length == 0 || abi == null) {
      return {}
    }

    abiDecoder.addABI(abi)

    let res: ParsedContractData = {}
    const method = abiDecoder.decodeMethod(data) as ContractMethod | null

    if (!method) {
      abiDecoder.removeABI(abi)
      return {}
    }

    const contractType = this.getContractType(address)
    switch (contractType) {
      case 'glm':
        res = this.parseGLM(method)
        break
      // Add other contract parsers as needed
      default:
        // No specialized parsing
        res = {
          method: method.name,
          args: method.params.reduce((acc, param) => {
            acc[param.name] = param.value
            return acc
          }, {} as Record<string, any>)
        }
    }

    abiDecoder.removeABI(abi)

    return res
  }
}