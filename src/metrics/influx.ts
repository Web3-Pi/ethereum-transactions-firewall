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

interface InfluxQLResponse {
  series?: Array<{
    name: string;
    columns: string[];
    values: Array<Array<string | number | null>>;
  }>;
  error?: string;
}

export class InfluxMetricsCollector extends MetricsCollector {
  private writeApi: WriteApi;
  private influxDb: InfluxDB;

  constructor(
    private config: InfluxConfig,
    private logger: Logger,
  ) {
    super(config);

    const { url, username, password, org, bucket } = config.influx;
    this.influxDb = new InfluxDB({
      url,
      token: `${username}:${password}`,
    });

    this.writeApi = this.influxDb.getWriteApi(org, bucket);
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
    const points = metricsBatch.map((metric) => {
      const point = new Point("tx_firewall_metrics")
        .tag("result", metric.result)
        .tag("jsonRpcMethod", metric.jsonRpcMethod)
        .timestamp(metric.date)
        .stringField("jsonRpcId", metric.jsonRpcId);

      if (metric.tx) {
        point
          .stringField("txId", metric.tx.id)
          .stringField("from", metric.tx.from)
          .stringField("to", metric.tx.to || "")
          .stringField("value", metric.tx.value)
          .stringField("txType", metric.tx.txType)
          .stringField("labelFrom", metric.tx.labelFrom || "")
          .stringField("labelTo", metric.tx.labelTo || "");

        if (metric.tx.gasPrice) {
          point.floatField("gasPrice", parseFloat(metric.tx.gasPrice));
        } else if (metric.tx.maxFeePerGas) {
          point.floatField("maxFeePerGas", parseFloat(metric.tx.maxFeePerGas));
          if (metric.tx.maxPriorityFeePerGas) {
            point.floatField(
              "maxPriorityFeePerGas",
              parseFloat(metric.tx.maxPriorityFeePerGas),
            );
          }
        }
      }

      return point;
    });

    try {
      this.writeApi.writePoints(points);
      await this.writeApi.flush();
    } catch (error) {
      this.logger.error(error, "Error saving metrics to InfluxDB");
    }
  }

  private async executeInfluxQLQuery(
    query: string,
  ): Promise<InfluxQLResponse | null> {
    const { url, username, password } = this.config.influx;
    const database = this.config.influx.bucket;

    const queryUrl = `${url}/query?db=${database}&q=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(queryUrl, {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          `InfluxDB query failed: ${response.status} ${response.statusText}`,
        );
      }

      if (result.error) {
        throw new Error(`InfluxQL error: ${result.error}`);
      }

      return result.results?.[0] || null;
    } catch (error) {
      this.logger.error(error, `InfluxQL query failed: ${query}`);
      return null;
    }
  }

  public async getAvgGasPrice(): Promise<number | null> {
    try {
      const MIN_TXS = 5;

      const query = `SELECT MEAN(gasPrice), COUNT(gasPrice) FROM tx_firewall_metrics WHERE time >= now() - 30d AND gasPrice > 0`;

      const response = await this.executeInfluxQLQuery(query);

      if (!response || !response.series || response.series.length === 0) {
        return null;
      }

      const series = response.series[0];
      if (!series.values || series.values.length === 0) {
        return null;
      }

      const data = series.values[0];
      const avgGasPrice = data[1] as number;
      const count = data[2] as number;

      if (!avgGasPrice || count < MIN_TXS) {
        return null;
      }

      return avgGasPrice;
    } catch (error) {
      this.logger.error(
        error,
        "Error fetching average gas price from InfluxDB",
      );
      return null;
    }
  }

  public async getAvgFeePerGas(): Promise<number | null> {
    try {
      const MIN_TXS = 5;

      const query = `SELECT MEAN(maxFeePerGas), COUNT(maxFeePerGas) FROM tx_firewall_metrics WHERE time >= now() - 30d AND maxFeePerGas > 0`;

      const response = await this.executeInfluxQLQuery(query);

      if (!response || !response.series || response.series.length === 0) {
        return null;
      }

      const series = response.series[0];
      if (!series.values || series.values.length === 0) {
        return null;
      }

      const data = series.values[0];
      const avgFeePerGas = data[1] as number;
      const count = data[2] as number;

      if (!avgFeePerGas || count < MIN_TXS) {
        return null;
      }

      return avgFeePerGas;
    } catch (error) {
      this.logger.error(
        error,
        "Error fetching average fee per gas from InfluxDB",
      );
      return null;
    }
  }

  public close() {
    super.close();
    this.writeApi.close().catch((error: Error) => {
      this.logger.error(error, "Error closing InfluxDB WriteApi");
    });
  }
}
