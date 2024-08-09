const { Web3 } = require('web3');
const { v4: uuidv4 } = require("uuid");
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const { FieldDataProvider } = require('./fielddataprovider');


class DummyHelper {

    constructor(endpointUrl, labelReaderFun) {
        this.w3 = new Web3(endpointUrl);
        this.endpointUrl = endpointUrl;
        this.fields = new FieldDataProvider(labelReaderFun);
    }

    #msType0HackishCall(methodHash, addr, data) {
        return JSON.stringify({
            jsonrpc: "2.0",
            id: uuidv4(),
            method:"eth_call", params:[
                {
                    to: addr,
                    data: `${methodHash}${data.replace('0x', '')}`
                },
                "latest"]
        });
    }

    #makeRequest(jsonData) {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${this.endpointUrl}/`, false);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(jsonData);

        if (xhr.status === 200) {
            return xhr.responseText;
        } else {
            return null;
        }
    }

    #parseResponse(abi, responseText) {
        if (responseText != null) {
            return this.w3.eth.abi.decodeParameters(abi, JSON.parse(responseText).result);
        }

        return null;
    }

    #msType0Transactions(addr, txnHash) {
        let res = this.#makeRequest(this.#msType0HackishCall('0x642f2eaf', addr, txnHash));
        res = this.#parseResponse(['address', 'uint256', 'bytes', 'uint256', 'bool'], res);

        return res;
    }

    #msType0confirmationCount(addr, txnHash) {
        let res = this.#makeRequest(this.#msType0HackishCall('0x59bf77df', addr, txnHash));
        res = this.#parseResponse(['uint256'], res);

        return res != null ? parseInt(res['0']) : null;
    }

    #msType0Required(addr) {
        let res = this.#makeRequest(this.#msType0HackishCall('0xdc8452cd', addr, ''))
        res = this.#parseResponse(['uint256'], res);

        return res != null ? parseInt(res['0']) : null;
    }

    #msType1Required(addr) {
        return this.#msType0Required(addr);
    }

    #msType1getConfirmationCount(addr, txnNum) {
        let res = this.#makeRequest(this.#msType0HackishCall('0x8b51d13f', addr, this.w3.eth.abi.encodeParameter('uint256', txnNum)));
        res = this.#parseResponse(['uint256'], res);

        return res != null ? parseInt(res['0']) : null;
    }

    #msType1Transactions(addr, txnNum) {
        let res = this.#makeRequest(this.#msType0HackishCall('0x9ace38c2', addr, this.w3.eth.abi.encodeParameter('uint256', txnNum)));
        res = this.#parseResponse(['address', 'uint256', 'bytes', 'bool'], res);

        return res;
    }

    #getSubmitDetails(count, required) {
        const cnf = count == 1 ? 'confirmation' : 'confirmations';
        const details = count < required ? ` [${count} ${cnf} of ${required}]` : ` [already confirmed]`;

        return details;
    }

    msType0ConfirmedTxnResult(addr, txnHash) {
        const required = this.#msType0Required(addr);
        const count = this.#msType0confirmationCount(addr, txnHash);
        const submittedTxn = this.#msType0Transactions(addr, txnHash);

        if (required != null && count != null && submittedTxn != null) {
            return {
                fun: this.fields.func('submitTransaction', this.#getSubmitDetails(count, required)),
                args: {
                    destination: this.fields.address('destination', submittedTxn['0']),
                    value: this.fields.tokenValue('value', submittedTxn['1'], 'ETH'),
                    data: this.fields.bytes('data', submittedTxn['2']),
                    nonce: this.fields.uint256('nonce', parseInt(submittedTxn['3']))
                }
            }
        }

        return null;
    }

    msType1ConfirmedTxnResult(addr, txnNum) {
        const required = this.#msType1Required(addr);
        const count = this.#msType1getConfirmationCount(addr, txnNum);
        const submittedTxn = this.#msType1Transactions(addr, txnNum);

        if (required != null && count != null && submittedTxn != null) {
            return {
                fun: this.fields.func('submitTransaction', this.#getSubmitDetails(count, required)),
                args: {
                    destination: this.fields.address('destination', submittedTxn['0']),
                    value: this.fields.tokenValue('value', submittedTxn['1'], 'ETH'),
                    data: this.fields.bytes('data', submittedTxn['2'])
                }
            }
        }

        return null;
    }

} 

exports.DummyHelper = DummyHelper;
