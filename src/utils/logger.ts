import chalk from 'chalk';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;
  private quiet: boolean = false;

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Set quiet mode
   */
  setQuiet(quiet: boolean): void {
    this.quiet = quiet;
  }

  /**
   * Log error message
   */
  error(message: string, ...args: unknown[]): void {
    if (this.quiet || this.level < LogLevel.ERROR) return;
    console.error(chalk.red('✗'), message, ...args);
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.quiet || this.level < LogLevel.WARN) return;
    console.warn(chalk.yellow('⚠'), message, ...args);
  }

  /**
   * Log info message
   */
  info(message: string, ...args: unknown[]): void {
    if (this.quiet || this.level < LogLevel.INFO) return;
    console.log(chalk.cyan('ℹ'), message, ...args);
  }

  /**
   * Log success message
   */
  success(message: string, ...args: unknown[]): void {
    if (this.quiet || this.level < LogLevel.INFO) return;
    console.log(chalk.green('✓'), message, ...args);
  }

  /**
   * Log debug message
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.quiet || this.level < LogLevel.DEBUG) return;
    console.log(chalk.gray('🐛'), message, ...args);
  }

  /**
   * Log raw message (no formatting)
   */
  raw(message: string, ...args: unknown[]): void {
    if (this.quiet) return;
    console.log(message, ...args);
  }
}

export const logger = new Logger();
