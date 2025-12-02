// Logger utility for React Native
interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

class Logger {
  private logLevel: keyof LogLevel = 'INFO';
  private isDevelopment: boolean;

  constructor() {
    // Safely check if __DEV__ is defined
    try {
      this.isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
    } catch (error) {
      this.isDevelopment = false;
    }
  }

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
    // Ensure isDevelopment is a boolean
    const isDev = this.isDevelopment === true;
    
    if (!isDev && level === 'DEBUG') {
      return false;
    }

    const levels: Record<keyof LogLevel, number> = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
    };

    // Safely access levels with fallback
    const currentLevel = levels[level] ?? 0;
    const minLevel = levels[this.logLevel] ?? 1;

    return currentLevel >= minLevel;
  }
}

// Export logger instance with safe initialization
export const logger = new Logger();
