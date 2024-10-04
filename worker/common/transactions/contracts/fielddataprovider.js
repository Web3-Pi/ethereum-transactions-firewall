const { Web3 } = require('web3');


class FieldDataProvider {

    constructor(labelReaderFun) {
        this.labelReaderFun = labelReaderFun;
    }

    func(funcName, _details='') {
        return {
            name: funcName,
            details: _details
        }
    }

    address(_argName, _addr) {
        return {
            argName: _argName,
            typeName: 'address',
            address: Web3.utils.toChecksumAddress(_addr),
            label: this.labelReaderFun(_addr)
        }
    }

    tokenValue(_argName, _val, _token) {
        return {
            argName: _argName,
            typeName: "uint256",
            value: _val.toString(),
            toolTip: `${parseFloat(Web3.utils.fromWei(_val, "ether")).toLocaleString('en-US', { useGrouping: true })} ${_token}`
    
        }
    }

    uint256(_argName, _val) {
        return {
            argName: _argName,
            typeName: "uint256",
            value: _val.toString(),
            toolTip: ""
        }
    }

    bytes(_argName, _data) {
        return {
            argName: _argName,
            typeName: "bytes",
            value: _data == null ? "" : _data
        }
    }

    bytes32(_argName, _data) {
        return {
            argName: _argName,
            typeName: "bytes32",
            value: _data
        }
    }
}

exports.FieldDataProvider = FieldDataProvider;
