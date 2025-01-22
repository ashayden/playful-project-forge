/// <reference types="vite/client" />

export class LoggingService {
  private static instance: LoggingService;
  private isDevelopment = process.env.NODE_ENV === 'development';

  private constructor() {}

  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  log(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.log(message, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.info(message, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.error(message, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.warn(message, ...args);
    }
  }
}

export const logger = LoggingService.getInstance(); 