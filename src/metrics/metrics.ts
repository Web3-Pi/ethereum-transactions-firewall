import { TransactionPayload } from "../transactions/transaction.js";
import { Logger } from "../utils/logger.js";

export interface Metrics {
  tx: TransactionPayload;
  date: Date;
  result: "accepted" | "rejected" | "error" | "unknown";
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

  private printSummary() {
    const today = new Date().toISOString().split("T")[0];
    const accepted = this.metrics.filter(
      (m) => m.result === "accepted" && m.date.toISOString().startsWith(today),
    ).length;
    const rejected = this.metrics.filter(
      (m) => m.result === "rejected" && m.date.toISOString().startsWith(today),
    ).length;
    this.logger.info(
      { accepted, rejected, all: this.metrics.length },
      `Transaction processing daily summary`,
    );
  }
}
