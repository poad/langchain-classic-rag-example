import log4js from 'log4js';

export interface Logger {
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  trace(message: any, ...args: any[]): void;

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  debug(message: any, ...args: any[]): void;

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  info(message: any, ...args: any[]): void;

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  warn(message: any, ...args: any[]): void;

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  error(message: any, ...args: any[]): void;

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  fatal(message: any, ...args: any[]): void;
}

const createLogger = async (): Promise<Logger> => {
  const logger = log4js.getLogger();

  return logger;
}

export { createLogger };
