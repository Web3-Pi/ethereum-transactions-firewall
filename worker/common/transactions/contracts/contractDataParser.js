const abiDecoder = require('abi-decoder');
const { DummyHelper } = require('./dummyhelper');
const { FieldDataProvider } = require('./fielddataprovider');


class ContractDataParser {

    constructor(endpointUrl, knownContracts, knownABIs, labelReaderFun) {
        this.contracts = knownContracts;
        this.abis = knownABIs;
        this.dummyHelper = new DummyHelper(endpointUrl, labelReaderFun);
        this.fields = new FieldDataProvider(labelReaderFun);
    }

    #getABI(addr) {
        if (addr in this.contracts) {
            const contract = this.contracts[addr];

            if (contract in this.abis) {
                return this.abis[contract];
            }
        }

        return null;
    }

    #getContractType(addr) {
        return this.contracts[addr];
    }

    #parseGLM(method) {
        let res = {};

        if (method.name === "transfer") {
            res = {
                contract: "glm",
                fun: this.fields.func('transfer'),
                args: {
                    address: this.fields.address('_to', method.params[0].value),
                    value: this.fields.tokenValue('_value', method.params[1].value, 'GLM')
                }
            }
        }

        return res;
    }

    #parseMSType0(method, addr, abi) {
        let res = {};

        if (method.name === "submitTransaction") {
            res = {
                contract: "ms0",
                fun: this.fields.func('submitTransaction'),
                args: {
                    destination: this.fields.address('destination', method.params[0].value),
                    value: this.fields.tokenValue('value', method.params[1].value, 'ETH'),
                    data: this.fields.bytes('data', method.params[2].value),
                    nonce: this.fields.uint256('nonce', method.params[3].value)
                }
            }
        }

        if (method.name == "confirmTransaction") {
            res = {
                contract: "ms0",
                fun: this.fields.func('confirmTransaction'),
                args: {
                    txnId: this.fields.bytes32('txnHash', method.params[0].value)
                }
            }

            const txnDetails = this.dummyHelper.msType0ConfirmedTxnResult(addr, method.params[0].value);

            if (txnDetails != null) {
                res.confirmedTxn = txnDetails;
            }
        }

        return res;
    }

    #parseMSType1(method, addr, abi) {
        let res = {};

        if (method.name === "submitTransaction") {
            res = {
                contract: "ms1",
                fun: this.fields.func('submitTransaction'),
                args: {
                    destination: this.fields.address('destination', method.params[0].value),
                    value: this.fields.tokenValue('value', method.params[1].value, 'ETH'),
                    data: this.fields.bytes('data', method.params[2].value),
                }
            }
        }

        if (method.name == "confirmTransaction") {
            if (method.name == "confirmTransaction") {
                res = {
                    contract: "ms1",
                    fun: this.fields.func('confirmTransaction'),
                    args: {
                        txnId: this.fields.uint256('txnId', method.params[0].value)
                    }
                }

                const txnDetails = this.dummyHelper.msType1ConfirmedTxnResult(addr, method.params[0].value);
    
                if (txnDetails != null) {
                    res.confirmedTxn = txnDetails;
                }
            }
        }

        return res;
    }

    #parseBeaconDeposit(method, addr, abi) {
        let res = {};

        if (method.name === "deposit") {
            res = {
                contract: "bdc",
                fun: this.fields.func('deposit'),
                args: {
                    pubkey: this.fields.bytes('pubkey', method.params[0].value),
                    withdrawal_credentials: this.fields.bytes('withdrawal_credentials', method.params[1].value),
                    signature: this.fields.bytes('signature', method.params[2].value),
                    deposit_data_root: this.fields.bytes32('deposit_data_root', method.params[3].value)
                }
            }
        }

        return res;
    }

    parseContractData(address, data) {
        const abi = this.#getABI(address);

        if (data.length == 0 || abi == null){
            return {};
        }

        abiDecoder.addABI(abi);

        let res = {};
        const method = abiDecoder.decodeMethod(data);

        switch (this.#getContractType(address)) {
            case 'glm':
                res = this.#parseGLM(method);
                break;
            case 'ms0':
                res = this.#parseMSType0(method, address, abi);
                break;
            case 'ms1':
                res = this.#parseMSType1(method, address, abi);
                break;
            case 'bdc':
                res = this.#parseBeaconDeposit(method, address, abi);
                break;
            default:
        }

        abiDecoder.removeABI(abi);

        return res;
    }

    async tester(addr, data) {
        const abi = this.#getABI(addr);

        const contract = new this.w3.eth.Contract(abi, addr);
        
        contract.methods.transactions(data).call().then(value => console.log(value));

        return 0;
    }
}

exports.ContractDataParser = ContractDataParser;
