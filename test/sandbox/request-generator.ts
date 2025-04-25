import { v4 as uuidv4 } from "uuid";
import { Web3 } from "web3";
import { RawTransactionFactory } from "./raw-txn-factory.js";
import { KeyboardTriggerAsync } from "./keyboard-trigger.js";

class RequestGenerator {
  private w3: Web3;
  private rawTxnFactory: RawTransactionFactory;
  private url: string;

  constructor(url: string) {
    this.w3 = new Web3(url);
    this.rawTxnFactory = new RawTransactionFactory();
    this.url = url;
  }

  async requestBalance(): Promise<string> {
    console.log(
      "Requesting balance for 0xaB782bc7D4a2b306825de5a7730034F8F63ee1bC",
    );
    const res = await this.w3.eth.getBalance(
      "0xaB782bc7D4a2b306825de5a7730034F8F63ee1bC",
    );
    return Web3.utils.fromWei(res, "ether");
  }

  async requestBlockNumber() {
    return await this.w3.eth.getBlockNumber();
  }

  async requestBlock(blockNum: string | number) {
    return await this.w3.eth.getBlock(blockNum);
  }

  async requestContractRead(address: string): Promise<string> {
    const abi = [
      {
        constant: true,
        inputs: [{ name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view" as const,
        type: "function" as const,
      },
      {
        constant: true,
        inputs: [],
        name: "totalSupply",
        outputs: [{ name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view" as const,
        type: "function" as const,
      },
    ];

    const erc20 = new this.w3.eth.Contract(
      abi as any, // Casting for compatibility
      "0x7DD9c5Cba05E151C895FDe1CF355C9A1D5DA6429",
    );
    const res = await erc20.methods.balanceOf(address).call();

    return res ? Web3.utils.fromWei(res.toString(), "ether") : "";
  }

  async requestErc20TransferTxn(token: string) {
    if (token !== "GLM") {
      return this.w3.eth.sendSignedTransaction(
        this.rawTxnFactory.erc20TransferRandom(),
      );
    } else {
      return this.w3.eth.sendSignedTransaction(
        this.rawTxnFactory.erc20TransferGLM(),
      );
    }
  }

  async requestErc20TransferTxnHTTP(): Promise<any> {
    const rawTxn = this.rawTxnFactory.erc20TransferRandom();
    const resp = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "95b1a776-d5df-4736-9a2f-efe95953a7ca",
        method: "eth_sendRawTransaction",
        params: [rawTxn],
      }),
    });
    return await resp.json();
  }

  async requestRawTxnHTTP(rawTxn: string): Promise<any> {
    const resp = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: uuidv4(),
        method: "eth_sendRawTransaction",
        params: [rawTxn],
      }),
    });
    return await resp.json();
  }
}

class DefaultTriggeredRequests {
  private requestGenerator: RequestGenerator;
  private keyTrigger: KeyboardTriggerAsync;

  constructor(url: string) {
    console.log(`Launching Request Generator. Requesting endpoint ${url}`);
    this.requestGenerator = new RequestGenerator(url);
    this.keyTrigger = new KeyboardTriggerAsync();

    this.keyTrigger.addCallback("1", async () => {
      const res = await this.requestGenerator.requestBalance();
      console.log(
        `requestBalance() -> ${parseFloat(res).toLocaleString()} ETH`,
      );
    });
    this.keyTrigger.addCallback("2", async () => {
      const res = await this.requestGenerator.requestBlockNumber();
      console.log(`requestBlockNumber() -> ${res.toLocaleString()}`);
    });
    this.keyTrigger.addCallback("3", async () => {
      const res = await this.requestGenerator.requestBlock("latest");
      console.log(
        `requestBlock() -> used gas: ${res.gasUsed.toLocaleString()}`,
      );
    });
    this.keyTrigger.addCallback("4", async () => {
      const res = await this.requestGenerator.requestContractRead(
        "0xf35A6bD6E0459A4B53A27862c51A2A7292b383d1",
      );
      console.log(
        `requestContractRead("0xf35A6bD6E0459A4B53A27862c51A2A7292b383d1") -> ${Number(
          res,
        ).toLocaleString()} GLM`,
      );
    });
    this.keyTrigger.addCallback("5", async () => {
      const res = await this.requestGenerator.requestErc20TransferTxn("GLM");
      console.log(res);
    });

    console.log(
      "Registered the following keyboard callbacks to generate web3 transactions",
    );
    console.log("1 - READ: requestBalance");
    console.log("2 - READ: requestBlockNumber");
    console.log("3 - READ: requestBlock");
    console.log("4 - READ: requestContractRead");
    console.log("5 - WRITE: GLM transfer");
  }
}

export { RequestGenerator, DefaultTriggeredRequests };
