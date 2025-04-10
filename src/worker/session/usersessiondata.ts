import { Web3 } from 'web3'
import config from '../../../config/config'
import { readJSONDict, printElements, printKeys } from '../common/util/jsonutil'
import { ContractDataParser } from '../common/transactions/contracts/contractDataParser'
import { ParsedContractData } from '../common/transactions/transaction'

export class UserSessionData {
  private authAddresses: Record<string, string>
  private contractDataParser: ContractDataParser

  constructor(endpointUrl: string) {
    this.authAddresses = readJSONDict<string>(
      config.authorized_addr_fn, 
      Web3.utils.toChecksumAddress
    )
    
    const knownContracts = readJSONDict<string>(
      config.known_contracts_fn, 
      Web3.utils.toChecksumAddress
    )
    
    const knownABIs = readJSONDict<any>(config.contract_abis_fn)

    printElements('Authorized addresses:', this.authAddresses)
    printElements('\nKnown contracts:', knownContracts)
    printKeys('\nContracts with ABIs', knownABIs)

    this.contractDataParser = new ContractDataParser(
      endpointUrl, 
      knownContracts, 
      knownABIs, 
      (addr: string) => this.getLabel(addr)
    )
  }

  getLabel(addr: string): string {
    const csaddr = Web3.utils.toChecksumAddress(addr)
    return csaddr in this.authAddresses ? this.authAddresses[csaddr] : 'unknown'
  }

  parseContractData(addr: string, data: string): ParsedContractData {
    return this.contractDataParser.parseContractData(addr, data)
  }
}