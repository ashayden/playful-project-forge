import { PostgrestError } from '@supabase/supabase-js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

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
  private log(level: LogLevel, message: string, ...args: unknown[]) {
    const formattedArgs = args.map(arg => {
      if (arg instanceof Error || arg instanceof PostgrestError) {
        return formatError(arg);
      }
      return arg;
    });
    
    console[level](message, ...formattedArgs);
  }

  debug(message: string, ...args: unknown[]) {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]) {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]) {
    this.log('error', message, ...args);
  }
}

export const logger = new Logger();