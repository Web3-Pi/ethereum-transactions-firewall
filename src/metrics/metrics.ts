import { TransactionPayload } from "../transactions/transaction.js";
import { Logger } from "../utils/logger.js";

export interface Metrics {
  jsonRpcId?: string;
  jsonRpcMethod: string;
  tx?: TransactionPayload;
  date: Date;
  result: "forwarded" | "accepted" | "rejected" | "error" | "unknown";
}

export type MetricsConfig = {
  savingIntervalMs?: number;
  batchSize?: number;
};

export abstract class MetricsCollector {
  protected queue: Metrics[] = [];
  private savingIntervalMs: number;
  private batchSize: number;
  private saveIntervalId?: NodeJS.Timeout;

  constructor(config: MetricsConfig) {
    this.savingIntervalMs = config.savingIntervalMs || 10_000;
    this.batchSize = config.batchSize || 100;
  }

  public async init() {
    this.initPeriodicSave();
  }

  public close() {
    clearInterval(this.saveIntervalId);
  }

  public collect(metrics: Metrics) {
    this.queue.push(metrics);
  }

  protected abstract save(metricsBatch: Metrics[]): Promise<void>;
  public abstract getAvgGasPrice(): Promise<number | null>;
  public abstract getAvgFeePerGas(): Promise<number | null>;

  private initPeriodicSave() {
    this.saveIntervalId = setInterval(() => {
      if (this.queue.length > 0) {
        const batch = this.queue.splice(0, this.batchSize);
        this.save(batch);
      }
    }, this.savingIntervalMs);
  }
}

export interface InMemoryMetricsConfig extends MetricsConfig {
  printingIntervalMs?: number;
}

export class InMemoryMetricsCollector extends MetricsCollector {
  private printingIntervalMs: number;
  private printingIntervalId?: NodeJS.Timeout;

  constructor(
    config: InMemoryMetricsConfig,
    private logger: Logger,
  ) {
    super(config);
    this.printingIntervalMs = config.printingIntervalMs || 60_000;
  }
  private metrics: Metrics[] = [];

  public async init(): Promise<void> {
    await super.init();
    this.printingIntervalId = setInterval(
      () => this.printSummary(),
      this.printingIntervalMs,
    );
  }

  public close() {
    super.close();
    clearInterval(this.printingIntervalId);
  }

  protected async save(metricsBatch: Metrics[]): Promise<void> {
    this.metrics.push(...metricsBatch);
    this.queue = [];
    this.logger.debug(`Saved ${metricsBatch.length} metrics`);
  }

  public async getAvgGasPrice(): Promise<number | null> {
    const MIN_TXS_WITH_GAS_PRICE = 5;
    const MAX_TXS_WITH_GAS_PRICE = 30;

    const filteredTxs = this.getLegacyTransactions(MAX_TXS_WITH_GAS_PRICE);

    if (filteredTxs.length < MIN_TXS_WITH_GAS_PRICE) {
      return null;
    }

    const sum = filteredTxs.reduce((acc, m) => {
      return acc + Number(m.tx!.gasPrice!);
    }, 0);

    return Promise.resolve(sum / filteredTxs.length);
  }

  public async getAvgFeePerGas(): Promise<number | null> {
    const MIN_TXS_WITH_GAS_PRICE = 5;
    const MAX_TXS_WITH_GAS_PRICE = 30;

    const filteredTxs = this.getEip1559Transactions(MAX_TXS_WITH_GAS_PRICE);

    if (filteredTxs.length < MIN_TXS_WITH_GAS_PRICE) {
      return null;
    }

    const sum = filteredTxs.reduce((acc, m) => {
      return acc + Number(m.tx!.maxFeePerGas!);
    }, 0);

    return Promise.resolve(sum / filteredTxs.length);
  }

  private getLegacyTransactions(maxCount: number) {
    return this.metrics
      .filter((m) => m.tx?.gasPrice !== undefined)
      .slice(-maxCount);
  }

  private getEip1559Transactions(maxCount: number) {
    return this.metrics
      .filter(
        (m) => m.tx?.maxFeePerGas !== undefined && m.tx?.gasPrice === undefined,
      )
      .slice(-maxCount);
  }

  private printSummary() {
    const today = new Date().toISOString().split("T")[0];
    const accepted = this.metrics.filter(
      (m) => m.result === "accepted" && m.date.toISOString().startsWith(today),
    ).length;
    const rejected = this.metrics.filter(
      (m) => m.result === "rejected" && m.date.toISOString().startsWith(today),
    ).length;
    const forwarded = this.metrics.filter(
      (m) => m.result === "forwarded" && m.date.toISOString().startsWith(today),
    ).length;
    this.logger.info(
      {
        accepted,
        rejected,
        forwarded,
        all: this.metrics.length,
        avgGasPrice: this.getAvgGasPrice(),
        avgFeePerGas: this.getAvgFeePerGas(),
      },
      `Transaction processing daily summary`,
    );
  }
}
