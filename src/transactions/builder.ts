import {
  TransactionType,
  ParsedData,
  WrappedTransaction,
} from "./transaction.js";
import assert from "node:assert";
import { TransactionFactory, TypedTransaction } from "web3-eth-accounts";
import { JsonRpcRequest } from "web3";
import { bufferToHex, isZeroAddress, toBuffer } from "ethereumjs-util";
import { ContractParser } from "./parser.js";
import * as fs from "node:fs";

export interface TransactionBuilderConfig {
  authorizedAddressesPath: string;
  knownContractsPath: string;
  knownContractAbisPath: string;
}

export class TransactionBuilder {
  private isLoaded = false;

  private authorizedAddresses = new Map<string, string>();
  private knownContracts = new Map<string, string>();

  constructor(
    private contractParser: ContractParser,
    private config: TransactionBuilderConfig,
  ) {}

  public async loadConfig() {
    try {
      const authorizedAddresses: [string, string][] = Object.entries(
        JSON.parse(
          await fs.promises.readFile(
            this.config.authorizedAddressesPath,
            "utf-8",
          ),
        ),
      );
      const knownContracts: [string, string][] = Object.entries(
        JSON.parse(
          await fs.promises.readFile(this.config.knownContractsPath, "utf-8"),
        ),
      );
      const knownContractAbis: [string, string][] = Object.entries(
        JSON.parse(
          await fs.promises.readFile(
            this.config.knownContractAbisPath,
            "utf-8",
          ),
        ),
      );
      this.authorizedAddresses = new Map(
        authorizedAddresses.map(([address, name]) => [
          address.toLowerCase(),
          name,
        ]),
      );
      this.knownContracts = new Map(
        knownContracts.map(([address, name]) => [address.toLowerCase(), name]),
      );
      this.isLoaded = true;
      this.contractParser.loadConfig(
        this.authorizedAddresses,
        this.knownContracts,
        new Map(
          knownContractAbis.map(([address, abi]) => [
            address.toLowerCase(),
            JSON.parse(abi),
          ]),
        ),
      );
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
      const userData = this.getUserData(baseTransaction);

      return new WrappedTransaction(baseTransaction, userData);
    } catch (error) {
      throw new Error(`Failed to decode transaction. ${error}`);
    }
  }

  private getUserData(transaction: TypedTransaction): ParsedData {
    const txType = this.getTransactionType(transaction);
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
        this.knownContracts.get(transaction.to?.toString() || "") ||
        "unknown",
      txType,
      contractInfo,
    };
  }

  private getTransactionType(transaction: TypedTransaction): TransactionType {
    if (
      (!transaction.to || isZeroAddress(transaction.to.toString())) &&
      transaction.data &&
      !isZeroAddress(transaction.data.toString())
    ) {
      return "contract-creation";
    }
    if (
      transaction.to &&
      !isZeroAddress(transaction.to.toString()) &&
      (!transaction.data ||
        transaction.data.toString() === "0x" ||
        bufferToHex(Buffer.from(transaction.data)) === "0x")
    ) {
      return "transfer";
    }
    if (
      transaction.to &&
      !isZeroAddress(transaction.to.toString()) &&
      transaction.data &&
      !isZeroAddress(transaction.data.toString())
    ) {
      return "contract-call";
    }

    return "unknown";
  }
}
