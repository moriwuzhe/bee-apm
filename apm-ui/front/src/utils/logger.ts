// 统一日志工具

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogOptions {
  level: LogLevel;
  tag?: string;
  enable?: boolean;
}

const isDev = import.meta.env.DEV;

class Logger {
  private static instance: Logger;
  private enabled: boolean;
  private minLevel: LogLevel;
  
  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };
  
  private constructor() {
    this.enabled = true;
    this.minLevel = isDev ? "debug" : "warn";
  }
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
  
  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    return this.levelPriority[level] >= this.levelPriority[this.minLevel];
  }
  
  private formatMessage(level: LogLevel, tag: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}]${tag ? ` [${tag}]` : ""} ${message}`;
  }
  
  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      console.debug(this.formatMessage("debug", "", message), ...args);
    }
  }
  
  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage("info", "", message), ...args);
    }
  }
  
  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", "", message), ...args);
    }
  }
  
  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", "", message), ...args);
    }
  }
  
  log(level: LogLevel, message: string, ...args: unknown[]): void {
    switch (level) {
      case "debug":
        this.debug(message, ...args);
        break;
      case "info":
        this.info(message, ...args);
        break;
      case "warn":
        this.warn(message, ...args);
        break;
      case "error":
        this.error(message, ...args);
        break;
    }
  }
  
  createLogger(tag: string): Pick<Logger, "debug" | "info" | "warn" | "error"> {
    return {
      debug: (message: string, ...args: unknown[]) => {
        if (this.shouldLog("debug")) {
          console.debug(this.formatMessage("debug", tag, message), ...args);
        }
      },
      info: (message: string, ...args: unknown[]) => {
        if (this.shouldLog("info")) {
          console.info(this.formatMessage("info", tag, message), ...args);
        }
      },
      warn: (message: string, ...args: unknown[]) => {
        if (this.shouldLog("warn")) {
          console.warn(this.formatMessage("warn", tag, message), ...args);
        }
      },
      error: (message: string, ...args: unknown[]) => {
        if (this.shouldLog("error")) {
          console.error(this.formatMessage("error", tag, message), ...args);
        }
      },
    };
  }
}

export const logger = Logger.getInstance();

export function createLogger(tag: string) {
  return logger.createLogger(tag);
}

export default logger;
