/**
 * Application logger utility
 * Provides environment-aware logging with future extensibility for error tracking services
 */

type LogLevel = 'log' | 'error' | 'warn' | 'info';

interface LoggerOptions {
  context?: string;
  metadata?: Record<string, unknown>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, options?: LoggerOptions): string {
    const timestamp = new Date().toISOString();
    const context = options?.context ? `[${options.context}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${context} ${message}`;
  }

  /**
   * Log informational messages (development only)
   */
  log(message: string, options?: LoggerOptions): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('log', message, options), options?.metadata || '');
    }
  }

  /**
   * Log informational messages (development only)
   */
  info(message: string, options?: LoggerOptions): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, options), options?.metadata || '');
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, options?: LoggerOptions): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('warn', message, options), options?.metadata || '');
    }
    // TODO: Send to error tracking service in production (Sentry, LogRocket, etc.)
  }

  /**
   * Log error messages and exceptions
   */
  error(message: string, error?: unknown, options?: LoggerOptions): void {
    const errorDetails = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;

    if (this.isDevelopment) {
      console.error(this.formatMessage('error', message, options), errorDetails, options?.metadata || '');
    }
    
    // TODO: Send to error tracking service in production
    // Example: Sentry.captureException(error, { contexts: { ...options } });
  }

  /**
   * Log API errors with request context
   */
  apiError(endpoint: string, error: unknown, options?: LoggerOptions): void {
    this.error(`API Error: ${endpoint}`, error, {
      ...options,
      context: 'API',
      metadata: { endpoint, ...options?.metadata }
    });
  }

  /**
   * Log database errors
   */
  dbError(operation: string, error: unknown, options?: LoggerOptions): void {
    this.error(`Database Error: ${operation}`, error, {
      ...options,
      context: 'Database',
      metadata: { operation, ...options?.metadata }
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for use in other files
export type { LoggerOptions };
