import * as pino from "pino";

const baseConfig = {
  level: process.env.LOG_LEVEL || "info",
  timestamp: pino.stdTimeFunctions.isoTime,
};

const devConfig = {
  ...baseConfig,
  transport: {
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

export const logger = pino.pino(config);

export type Logger = pino.Logger;

export function createLogger(module: string) {
  return logger.child({ module });
}
