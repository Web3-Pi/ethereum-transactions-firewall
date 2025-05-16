import { WrappedTransaction } from "../transactions/transaction.js";
import { TransactionValidator, ValidationError } from "./validator.js";
import { Logger } from "../utils/logger.js";
import * as fs from "node:fs";

interface RulesTransactionValidatorConfig {
  addressRulesPath: string;
  valueRulesPath: string;
  contractRulesPath: string;
}

export interface AddressRule {
  action: "allow" | "deny";
  to: string;
  from: string;
  comment?: string;
}

export interface ValueRule {
  maxValue: number | null;
  minValue: number | null;
  maxGasPrice: number;
  minGasPrice: number;
  comment?: string;
}

export interface ContractRule {
  action: "allow" | "deny";
  functionName: string;
  args: Map<string, string>;
  comment?: string;
}

export class RulesValidator extends TransactionValidator {
  private addressRules: AddressRule[] = [];
  private valueRules: ValueRule[] = [];
  private contractRules: ContractRule[] = [];

  constructor(
    private config: RulesTransactionValidatorConfig,
    private logger: Logger,
  ) {
    super();
  }

  public async init() {
    try {
      this.addressRules = JSON.parse(
        await fs.promises.readFile(this.config.addressRulesPath, "utf-8"),
      );
      this.valueRules = JSON.parse(
        await fs.promises.readFile(this.config.valueRulesPath, "utf-8"),
      );
      this.contractRules = JSON.parse(
        await fs.promises.readFile(this.config.contractRulesPath, "utf-8"),
      );

      this.logger.info("Rules configuration loaded successfully");
    } catch (error) {
      this.logger.error("Failed to load rules configuration");
      throw new Error(`Failed to load rules configuration: ${error}`);
    }
  }

  public async validate(tx: WrappedTransaction): Promise<true> {
    let addressRuleMatch = false;
    let valueRuleMatch = false;
    let contractRuleMatch = false;

    addressRuleMatch = this.validateAddressRules(tx);
    valueRuleMatch = this.validateValueRules(tx);
    contractRuleMatch = this.validateContractRules(tx);

    if (!addressRuleMatch) {
      throw new ValidationError(
        "Transaction denied: No matching address rule found",
        tx.dto,
        tx.jsonRpcId,
      );
    }
    if (!valueRuleMatch) {
      throw new ValidationError(
        "Transaction denied: No matching value rule found",
        tx.dto,
        tx.jsonRpcId,
      );
    }
    if (!contractRuleMatch) {
      throw new ValidationError(
        "Transaction denied: No matching contract rule found",
        tx.dto,
        tx.jsonRpcId,
      );
    }

    return true;
  }

  private validateAddressRules(tx: WrappedTransaction): boolean {
    for (const rule of this.addressRules) {
      const fromMatch = rule.from === "*" || rule.from === tx.dto.from;
      const toMatch = rule.to === "*" || rule.to === tx.dto.to;

      if (fromMatch && toMatch) {
        if (rule.action === "deny") {
          throw new Error(
            `Transaction denied by address rule: ${rule.comment || "no comment"}`,
          );
        }
        return true;
      }
    }
    return false;
  }

  private validateValueRules(tx: WrappedTransaction): boolean {
    for (const rule of this.valueRules) {
      const txValue = BigInt(tx.dto.value);
      const minValue = rule.minValue === null ? txValue : BigInt(rule.minValue);
      const maxValue = rule.maxValue === null ? txValue : BigInt(rule.maxValue);

      let txGasPrice: bigint;
      if ("gasPrice" in tx.baseTransaction) {
        txGasPrice = BigInt(tx.baseTransaction.gasPrice.toString());
      } else if ("maxFeePerGas" in tx.baseTransaction) {
        txGasPrice = BigInt(tx.baseTransaction.maxFeePerGas.toString());
      } else {
        this.logger?.warn(
          "Transaction does not contain gasPrice or maxFeePerGas",
        );
        return false;
      }

      const minGasPrice =
        rule.minGasPrice === null ? txGasPrice : BigInt(rule.minGasPrice);
      const maxGasPrice =
        rule.maxGasPrice === null ? txGasPrice : BigInt(rule.maxGasPrice);

      if (
        txValue >= minValue &&
        txValue <= maxValue &&
        txGasPrice >= minGasPrice &&
        txGasPrice <= maxGasPrice
      ) {
        return true;
      }
    }
    return false;
  }

  private validateContractRules(tx: WrappedTransaction): boolean {
    if (!tx.dto.contractInfo) {
      return true;
    }

    for (const rule of this.contractRules) {
      if (rule.functionName === tx.dto.contractInfo.functionName) {
        if (rule.action === "deny") {
          throw new ValidationError(
            `Transaction denied by contract rule: ${rule.comment || "no comment"}`,
            tx.dto,
            tx.jsonRpcId,
          );
        }
        return true;
      }
    }
    return false;
  }
}
