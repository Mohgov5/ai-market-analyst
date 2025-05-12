// src/utils/logger.ts
export interface Logger {
  info: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

export const createLogger = (moduleName: string): Logger => {
  return {
    info: (message: string, ...args: any[]) => {
      console.log(`[INFO] [${moduleName}]: ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {
      console.error(`[ERROR] [${moduleName}]: ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
      console.warn(`[WARN] [${moduleName}]: ${message}`, ...args);
    },
    debug: (message: string, ...args: any[]) => {
      if (import.meta.env.DEV) {
        console.debug(`[DEBUG] [${moduleName}]: ${message}`, ...args);
      }
    }
  };
};

export const logger = createLogger('App');