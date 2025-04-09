import { ParsedData, WrappedTransaction } from "./transaction.js";
import assert from "node:assert";
import { TransactionFactory, TypedTransaction } from "web3-eth-accounts";
import { JsonRpcRequest } from "web3";
import { toBuffer } from "ethereumjs-util";
import { ContractParser } from "./parser.js";
import * as fs from "node:fs";
import { getTransactionType } from "../utils/transaction.js";
import { Logger } from "../utils/logger.js";
import { AbiItem } from "web3-utils";

export interface TransactionBuilderConfig {
  authorizedAddressesPath: string;
  knownContractsPath: string;
}

export type ContractItem = {
  name: string;
  abi?: AbiItem;
};

export class TransactionBuilder {
  private isLoaded = false;

  private authorizedAddresses = new Map<string, string>();
  private knownContracts = new Map<string, ContractItem>();

  constructor(
    private contractParser: ContractParser,
    private config: TransactionBuilderConfig,
    private logger: Logger,
  ) {}

  public async loadConfig() {
    try {
      const authorizedAddressesData: [string, string][] = Object.entries(
        JSON.parse(
          await fs.promises.readFile(
            this.config.authorizedAddressesPath,
            "utf-8",
          ),
        ),
      );
      const knownContractsData = JSON.parse(
        await fs.promises.readFile(this.config.knownContractsPath, "utf-8"),
      );

      this.authorizedAddresses = new Map(
        authorizedAddressesData.map(([address, name]) => [
          address.toLowerCase(),
          name,
        ]),
      );
      this.knownContracts = new Map(
        Object.entries(knownContractsData).map(([address, contractData]) => [
          address.toLowerCase(),
          {
            name: (contractData as ContractItem).name,
            abi: (contractData as ContractItem).abi,
          },
        ]),
      );

      this.contractParser.loadConfig(
        this.authorizedAddresses,
        this.knownContracts,
      );
      if (this.isLoaded) {
        this.logger.info("Configuration files reloaded");
      }
      this.isLoaded = true;
    } catch (error) {
      throw new Error(`Failed to load config. ${error}`);
    }
  }

  public fromJsonRpcRequest(req: JsonRpcRequest): WrappedTransaction | null {
    if (req.method !== "eth_sendRawTransaction" || !req.params?.[0]) {
      return null;
    }
    assert(this.isLoaded, "Config not loaded");

    try {
      const txData = toBuffer(req.params[0] as string);
      const baseTransaction = TransactionFactory.fromSerializedData(txData);
      const parsedData = this.getParsedData(baseTransaction);

      return new WrappedTransaction(baseTransaction, parsedData);
    } catch (error) {
      throw new Error(`Failed to decode transaction. ${error}`);
    }
  }

  private getParsedData(transaction: TypedTransaction): ParsedData {
    const txType = getTransactionType(transaction);
    const contractInfo =
      txType !== "transfer"
        ? this.contractParser.getContractInfo(transaction, txType) || undefined
        : undefined;
    return {
      labelFrom:
        this.authorizedAddresses.get(
          transaction.getSenderAddress().toString(),
        ) || "unknown",
      labelTo:
        this.authorizedAddresses.get(transaction.to?.toString() || "") ||
        this.knownContracts.get(transaction.to?.toString() || "")?.name ||
        "unknown",
      txType,
      contractInfo,
    };
  }
}
