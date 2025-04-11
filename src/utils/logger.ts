import * as pino from "pino";

const baseConfig = {
  level: process.env.LOG_LEVEL || "info",
  timestamp: pino.stdTimeFunctions.isoTime,
};

const devConfig = {
  ...baseConfig,
  transport:
    process.env.BUNDLED === "true"
      ? undefined
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
};

const prodConfig = {
  ...baseConfig,
};

const isProduction = process.env.NODE_ENV === "production";
const config = isProduction ? prodConfig : devConfig;

export type Logger = pino.Logger;

export function createLogger() {
  return pino.pino(config);
}
