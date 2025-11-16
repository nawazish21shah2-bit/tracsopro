// Logger utility for React Native
interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

class Logger {
  private logLevel: keyof LogLevel = 'INFO';
  private isDevelopment = __DEV__;

  setLogLevel(level: keyof LogLevel): void {
    this.logLevel = level;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('DEBUG')) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('INFO')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('WARN')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('ERROR')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  private shouldLog(level: keyof LogLevel): boolean {
    if (!this.isDevelopment && level === 'DEBUG') {
      return false;
    }

    const levels: Record<keyof LogLevel, number> = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
    };

    return levels[level] >= levels[this.logLevel];
  }
}

export const logger = new Logger();
