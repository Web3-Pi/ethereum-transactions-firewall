# Ethereum Transactions Firewall

This simple tool is designed to increase interaction security with Ethereum. It should be used with the [Ethereun On Raspberry Pi](https://github.com/Web3-Pi/Ethereum-On-Raspberry-Pi) suite.


## Setup

Log in to your Raspberry Pi and follow the instructions below.


### Node.js

This is a [Node.js](https://nodejs.org/) project, so if you don't have it installed on your device, follow the steps below:
```bash
sudo apt update
sudo apt install nodejs
sudo apt install npm
```


### Ethereum Transaction Firewall

Clone the repository to your working directory and change the current directory to the working directory. Install dependencies by running the command: 
```bash
npm install
```

Create the environment file _.env_:
```bash
touch .env
```


#### Environment 

Service configuration is read from the _.env_ file, so it has to be edited 
```bash
nano .env
```
and initialized with the required values, e.g.:
```node
node_env=development
server_port=8454
proxy_port=18500
wss_port=18501
rpc_endpoint='http://localhost:8545'
authorized_addr_fn=".auth_addr"
```


#### Authorized addresses

You can optionally assign a corresponding label to each authorized address. To do this, edit a file _.auth_addr_, by calling 
```bash
nano .auth_addr
```

and store the mapping in the file, e.g.:
```node
{
  "0x00000000219ab540356cBB839Cbe05303d7705Fa": "Beacon Deposit Contract",
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": "Wrapped Ether",
  "0x7DD9c5Cba05E151C895FDe1CF355C9A1D5DA6429": "GLM Token Contract"
}
```


## Running


### Overview


The service is configured and ready to run. To start the service, execute the following command from the main project directory:
```bash
node index.js
```

On successful startup, the application will print the following (or similar) output:
```
Websocket server is running on port: 18501
Transaction Firewall Server listening on port: 8454
ValidatingProxy is running:
  proxy address: http://localhost:18500
  RPC endpoint:  http://localhost:8545
```

To start accepting transactions, open the web browser on a machine in a local subnet. The service is hosted on a local subnet, so the device name must be used in the web browser. In the default single-device setup, the device name should be _eop-1_, and the corresponding webpage is:
```
http://eop-1.local:8454
```


### Details

- If the web page is not open, the service automatically forwards all requests to the configured RPC endpoint
- Only one web page instance may be opened at a time
  - Opening an additional webpage instance drops the old connection and redirects all queries to the current page
- This is an asynchronous service, but it serves only one request at a time
  - Requests are not queued
  - New requests sent during acceptance of a previous one are automatically forwarded to the configured RPC endpoint


## Testing

As [Ethereun On Raspberry Pi](https://github.com/Web3-Pi/Ethereum-On-Raspberry-Pi) devices are used with the Ethereum mainnet, the easiest way to interact with them would be through Metamask. It is fine during regular use but not helpful during testing.


### Sandbox Transactions

A simple testing framework is implemented in this project, which can be used to interact with the service without paying gas fees. It allows triggering transactions by pressing keys from 1 to 6. Initially, the following requests are submitted to the RPC endpoint:

```
1 - READ: requestBalance
2 - READ: requestBlockNumber
3 - READ: requestBlock
4 - READ: requestContractRead
5 - WRITE: requestErc20TransferTxn - GLM
6 - WRITE: requestErc20TransferTxn - RandERC20
```


#### Configuration

The testing framework sends transactions to a predefined RPC endpoint (i.e., a running Ethereum Transaction Firewall service). This endpoint can be specified in a file _test/txnemitter.js_, which looks like this:
```node
const process = require('process');
const path = require('path');

process.chdir(path.join(__dirname, '..'));

const { proxy_port } = require('../config/config');
const { DefaultTriggeredRequests } = require('./sandbox/requestgenerator');

const trigger = new DefaultTriggeredRequests(`http://localhost:${proxy_port}`);
```

To change the RPC endpoint, change the line:
```node
const trigger = new DefaultTriggeredRequests(`http://localhost:${proxy_port}`);
```
by adding the address of the correct RPC endpoint.


#### Running

With the correct RPC endpoint provided, run the tester from the main working dir by executing the following command:
```bash
node test/txnemitter.js
```
and send requests by pressing keys from 1 to 6.

## Regular use

This project is a firewall between the wallet and the RPC endpoint (Ethereum mainnet only). To enable it in a wallet of choice, change the RPC endpoint in a wallet to the proxy address.

### Metamask

TODO
