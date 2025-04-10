import { toBuffer } from 'ethereumjs-util'
import { Web3 } from 'web3'
import { StubTransaction } from './transaction'
import { UserSessionData } from '../../session/usersessiondata'

// https://github.com/dethcrypto/dethtools/blob/main/README.md
// https://github.com/ethereumjs/ethereumjs-monorepo

export class RawTransactionDecoder {
  private userSessionData: UserSessionData

  constructor(userSessionData: UserSessionData) {
    this.userSessionData = userSessionData
  }

  decodeTxn(rawTxn: string): StubTransaction {
    try {
      const rxDataBuffer = toBuffer(rawTxn)
      const txn = Web3.eth.accounts.TransactionFactory.fromSerializedData(rxDataBuffer)

      const sender = Web3.utils.toChecksumAddress(txn.getSenderAddress().toString())
      const recipient = Web3.utils.toChecksumAddress(txn.to.toString())
      const value = txn.value.toString()
      const data = txn.data.length == 0 ? '' : Web3.utils.toHex(txn.data)
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