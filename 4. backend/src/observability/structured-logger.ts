import type { LoggerService, LogLevel } from '@nestjs/common';
import { ALL_LOG_LEVELS } from "./structured-logger.constants";
import { LogEntry } from "./structured-logger.types";

export class StructuredLogger implements LoggerService {
  private enabledLevels = new Set<LogLevel>(ALL_LOG_LEVELS);

  log(message: any, ...optionalParams: any[]): void {
    this.write('log', message, optionalParams);
  }

  error(message: any, ...optionalParams: any[]): void {
    this.write('error', message, optionalParams);
  }

  warn(message: any, ...optionalParams: any[]): void {
    this.write('warn', message, optionalParams);
  }

  debug(message: any, ...optionalParams: any[]): void {
    this.write('debug', message, optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]): void {
    this.write('verbose', message, optionalParams);
  }

  fatal(message: any, ...optionalParams: any[]): void {
    this.write('fatal', message, optionalParams);
  }

  setLogLevels(levels: LogLevel[]): void {
    this.enabledLevels = new Set(levels);
  }

  private write(level: LogLevel, message: unknown, optionalParams: unknown[]): void {
    if (!this.enabledLevels.has(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (message instanceof Error) {
      entry.message = message.message;

      if (message.stack) {
        entry.stack = message.stack;
      }
    }

    if (level === 'error') {
      this.addErrorParameters(entry, optionalParams);
    } else {
      this.addStandardParameters(entry, optionalParams);
    }

    const output =
      level === 'warn' || level === 'error' || level === 'fatal'
        ? process.stderr
        : process.stdout;
    output.write(`${JSON.stringify(entry)}\n`);
  }

  private addStandardParameters(entry: LogEntry, optionalParams: unknown[]): void {
    const [firstParam, ...remainingParams] = optionalParams;

    if (typeof firstParam === 'string') {
      entry.context = firstParam;
    } else if (firstParam !== undefined) {
      remainingParams.unshift(firstParam);
    }

    if (remainingParams.length > 0) {
      entry.additionalParams = remainingParams;
    }
  }

  private addErrorParameters(entry: LogEntry, optionalParams: unknown[]): void {
    const [stackOrError, context, ...remainingParams] = optionalParams;

    if (typeof stackOrError === 'string') {
      entry.stack = stackOrError;
    } else if (stackOrError instanceof Error) {
      entry.stack = stackOrError.stack;
    } else if (stackOrError !== undefined) {
      remainingParams.unshift(stackOrError);
    }

    if (typeof context === 'string') {
      entry.context = context;
    } else if (context !== undefined) {
      remainingParams.unshift(context);
    }

    if (remainingParams.length > 0) {
      entry.additionalParams = remainingParams;
    }
  }
}
