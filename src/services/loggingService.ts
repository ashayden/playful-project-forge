export class LoggingService {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, data?: any) {
    console.log(`[${this.context}] INFO:`, message, data ? data : '');
  }

  error(message: string, error?: any) {
    console.error(`[${this.context}] ERROR:`, message, error ? error : '');
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${this.context}] DEBUG:`, message, data ? data : '');
    }
  }
} 