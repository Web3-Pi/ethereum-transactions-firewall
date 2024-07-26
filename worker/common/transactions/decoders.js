const toBufffer = require('ethereumjs-util').toBuffer;
const Web3 = require('web3');

const StubTransaction = require('./transaction.js').StubTransaction;

// https://github.com/dethcrypto/dethtools/blob/main/README.md
// https://github.com/ethereumjs/ethereumjs-monorepo

class RawTransactionDecoder {
    constructor() {
    }

    decodeTxn(rawTxn) {
        try {
            const rxDataBuffer = toBufffer(rawTxn);
            const txn = Web3.eth.accounts.TransactionFactory.fromSerializedData(rxDataBuffer);

            const sender = Web3.utils.toChecksumAddress(txn.getSenderAddress().toString());
            const recipient = Web3.utils.toChecksumAddress(txn.to.toString());
            const value = txn.value.toString();            
            const data = txn.data.length == 0 ? '' : Web3.utils.toHex(txn.data);

            return new StubTransaction(sender, recipient, value, data);
            
        } catch (error) {
            throw new Error(`Failed to decode transaction: ${error.message}`,);
        }
    }
    
}

exports.RawTransactionDecoder = RawTransactionDecoder;
