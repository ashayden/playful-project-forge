/// <reference types="vite/client" />

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

class LoggingService {
  private isDevelopment = import.meta.env.DEV;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 1000;

  private createLogEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  private log(level: LogLevel, message: string, data?: unknown) {
    const entry = this.createLogEntry(level, message, data);
    
    // Store in history
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // Console output in development
    if (this.isDevelopment) {
      const consoleMethod = console[level] || console.log;
      if (data !== undefined) {
        consoleMethod(`[${level.toUpperCase()}] ${message}`, data);
      } else {
        consoleMethod(`[${level.toUpperCase()}] ${message}`);
      }
    }

    // In production, you might want to send logs to a service
    if (!this.isDevelopment) {
      // TODO: Implement production logging
    }
  }

  debug(message: string, data?: unknown) {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown) {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown) {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown) {
    this.log('error', message, data);
  }

  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  clearHistory() {
    this.logHistory = [];
  }
}

export const logger = new LoggingService(); 