const request = require('request-promise');
const { Web3 } = require('web3');
const { RawTransactionFactory } = require('./rawtxnfactory');
const { KeyboardTriggerAsync } = require('./keyboardtrigger'); 


class RequestGenerator {
    
    constructor(url) {
        this.w3 = new Web3(url);
        this.rawTxnFactory = new RawTransactionFactory();
        this.url = url;
    }

    async requestBalance() {
        const res = await this.w3.eth.getBalance('0xaB782bc7D4a2b306825de5a7730034F8F63ee1bC');
        return Web3.utils.fromWei(res, "ether");
    }

    async requestBlockNumber() {
        const res = await this.w3.eth.getBlockNumber();
        return res;
    }

    async requestBlock(blockNum) {
        const res = await this.w3.eth.getBlock(blockNum);
        return res;
    }

    async requestContractRead(address) {
        const abi = 
        [
            {
                "constant":true,
                "inputs":[{"name":"account","type":"address"}],
                "name":"balanceOf",
                "outputs":[{"name":"","type":"uint256"}],
                "payable":false,
                "stateMutability":"view",
                "type":"function"
            },
            {
                "constant":true,
                "inputs":[],
                "name":"totalSupply",
                "outputs":[{"name":"","type":"uint256"}],
                "payable":false,
                "stateMutability":"view",
                "type":"function"
            }
        ];

        const erc20 = new this.w3.eth.Contract(abi, '0x7DD9c5Cba05E151C895FDe1CF355C9A1D5DA6429');
        const res = await erc20.methods.balanceOf(address).call();

        return  Web3.utils.fromWei(res, "ether");
    }

    async requestErc20TransferTxn(token) {
        if (token === 'GLM') {
            return await this.w3.eth.sendSignedTransaction(this.rawTxnFactory.erc20TransferGLM());
        }
        else {
            return await this.w3.eth.sendSignedTransaction(this.rawTxnFactory.erc20TransferRandom());
        }
    }

    async requestErc20TransferTxnHTTP() {
        const rawTxn = this.rawTxnFactory.erc20TransferRandom();
        const resp = request({ 
            url: this.url,
            method: 'POST',
            json: 
            {
                jsonrpc: '2.0',
                id: '95b1a776-d5df-4736-9a2f-efe95953a7ca',
                method: 'eth_sendRawTransaction',
                params: [rawTxn]
            },
        });
        return resp;
    }
}

class DefaultTriggeredRequests {

    constructor(url) {
        console.log(`Launching Request Generator. Requesting endpoint ${url}`);
        this.requestGenerator = new RequestGenerator(url);
        this.keyTrigger = new KeyboardTriggerAsync();
        
        this.keyTrigger.addCallback('1', async () => {
            const res = await this.requestGenerator.requestBalance();
            console.log(`requestBalance() -> ${parseFloat(res).toLocaleString()} ETH`);
        });
        this.keyTrigger.addCallback('2', async () => {
            const res = await this.requestGenerator.requestBlockNumber()
            console.log(`requestBlockNumber() -> ${res.toLocaleString()}`);
        });
        this.keyTrigger.addCallback('3', async () => {
            const res = this.requestGenerator.requestBlock('latest');
            console.log(`requestBlockNumber() -> used gas: ${(await res).gasUsed.toLocaleString()}`);
        });
        this.keyTrigger.addCallback('4', async () => {
            const res = await this.requestGenerator.requestContractRead('0xf35A6bD6E0459A4B53A27862c51A2A7292b383d1')
            console.log(`requestContractRead("0xf35A6bD6E0459A4B53A27862c51A2A7292b383d1") -> ${Number(res).toLocaleString()} GLM`);
        });
        this.keyTrigger.addCallback('5', async () => {
            const res = await this.requestGenerator.requestErc20TransferTxn('GLM');
            console.log(res);
        });
        this.keyTrigger.addCallback('6', async () => {
            const res = await this.requestGenerator.requestErc20TransferTxnHTTP();
            console.log(res);
        });

        console.log("Registered the following keyboard callbacks to generate web3 transactions");
        console.log("1 - requestBalance");
        console.log("2 - requestBlockNumber");
        console.log("3 - requestBlock");
        console.log("4 - requestContractRead");
        console.log("5 - requestErc20TransferTxn - GLM");
        console.log("6 - requestErc20TransferTxn - RandERC20");
    }

}

exports.RequestGenerator = RequestGenerator;
exports.DefaultTriggeredRequests = DefaultTriggeredRequests;
