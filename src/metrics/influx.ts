import { MetricsCollector, MetricsConfig, Metrics } from "./metrics.js";
import { InfluxDB, Point, WriteApi } from "@influxdata/influxdb-client";
import { Logger } from "../utils/logger.js";

export interface InfluxConfig extends MetricsConfig {
  influx: {
    url: string;
    username: string;
    password: string;
    org: string;
    bucket: string;
  };
}

export class InfluxMetricsCollector extends MetricsCollector {
  private writeApi: WriteApi;

  constructor(
    private config: InfluxConfig,
    private logger: Logger,
  ) {
    super(config);

    const { url, username, password, org, bucket } = config.influx;

    this.writeApi = new InfluxDB({
      url,
      token: `${username}:${password}`,
    }).getWriteApi(org, bucket);
  }

  public async init(): Promise<void> {
    await super.init();

    try {
      await this.writeApi.flush();
      this.logger.info("Successfully connected to InfluxDB");
    } catch (error) {
      this.logger.error(error, "Unable to connect to InfluxDB");
      throw error;
    }
  }

  protected async save(metricsBatch: Metrics[]): Promise<void> {
    const points = metricsBatch.map((metric) =>
      new Point("tx_firewall_metrics")
        .tag("result", metric.result)
        .timestamp(metric.date)
        .stringField("txId", metric.tx.id)
        .stringField("from", metric.tx.from)
        .stringField("to", metric.tx.to || "")
        .stringField("value", metric.tx.value)
        .stringField("txType", metric.tx.txType)
        .stringField("labelFrom", metric.tx.labelFrom)
        .stringField("labelTo", metric.tx.labelTo),
    );

    try {
      this.writeApi.writePoints(points);
      await this.writeApi.flush();
      this.logger.info(`Saved ${metricsBatch.length} metrics`);
    } catch (error) {
      this.logger.error(error, "Error saving metrics to InfluxDB");
    }
  }

  public close() {
    super.close();
    this.writeApi.close().catch((error: Error) => {
      this.logger.error(error, "Error closing InfluxDB WriteApi");
    });
  }
}
