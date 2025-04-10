import { toBuffer } from 'ethereumjs-util'
import Web3 from 'web3'
import { StubTransaction } from './transaction'
import { UserSessionData } from '../../session/usersessiondata'

// Create a web3 instance for accessing static methods
const web3 = new Web3()

// Define transaction interface based on web3 types
interface DecodedTransaction {
  from: string
  to?: string
  value?: string
  input?: string
  hash?: string
}

// https://github.com/dethcrypto/dethtools/blob/main/README.md
// https://github.com/ethereumjs/ethereumjs-monorepo

export class RawTransactionDecoder {
  private userSessionData: UserSessionData

  constructor(userSessionData: UserSessionData) {
    this.userSessionData = userSessionData
  }

  decodeTxn(rawTxn: string): StubTransaction {
    try {
      // Use web3 instance to recover the transaction
      const txn = web3.eth.accounts.recoverTransaction(rawTxn) as unknown as DecodedTransaction

      const sender = web3.utils.toChecksumAddress(txn.from)
      const recipient = web3.utils.toChecksumAddress(txn.to || '')
      const value = txn.value || '0'
      const data = !txn.input || txn.input === '0x' ? '' : txn.input
      const parsedContractData = this.userSessionData.parseContractData(recipient, data)

      return new StubTransaction(sender, recipient, value, data, parsedContractData)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to decode transaction: ${error.message}`)
      } else {
        throw new Error('Failed to decode transaction: Unknown error')
      }
    }
  }
}