import { PostgrestError } from '@supabase/supabase-js';

const isDevelopment = import.meta.env.MODE === 'development';

const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (error instanceof PostgrestError) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return JSON.stringify(error);
};

class Logger {
  private formatMessage(level: string, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.map(arg => formatError(arg)).join(' ');
    return `[${timestamp}] [${level}] ${message} ${formattedArgs}`.trim();
  }

  debug(message: string, ...args: unknown[]) {
    if (isDevelopment) {
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]) {
    console.info(this.formatMessage('INFO', message), ...args);
  }

  warn(message: string, ...args: unknown[]) {
    console.warn(this.formatMessage('WARN', message), ...args);
  }

  error(message: string, ...args: unknown[]) {
    console.error(this.formatMessage('ERROR', message), ...args);
    
    // In production, you might want to send this to an error tracking service
    if (!isDevelopment) {
      // TODO: Add error reporting service integration
      // e.g., Sentry, LogRocket, etc.
    }
  }
}

export const logger = new Logger();