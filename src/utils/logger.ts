import * as pino from "pino";
import pretty from "pino-pretty";

const prettyStream = pretty({
  colorize: true,
  translateTime: "SYS:standard",
  ignore: "pid,hostname",
});

const baseConfig = {
  level: process.env.LOG_LEVEL || "info",
  timestamp: pino.stdTimeFunctions.isoTime,
};

const isProduction = process.env.NODE_ENV === "production";
const config = isProduction ? baseConfig : { ...baseConfig };

export type Logger = pino.Logger;

export function createLogger() {
  return isProduction ? pino.pino(config) : pino.pino(config, prettyStream);
}
