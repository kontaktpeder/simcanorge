/**
 * Support Logger - captures console logs, errors, and network failures
 * for debugging purposes when users report problems.
 */

interface ConsoleLog {
  level: 'log' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

interface RuntimeError {
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  timestamp: number;
}

interface NetworkFailure {
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  durationMs: number;
  errorMessage: string;
  timestamp: number;
}

export interface DebugPayload {
  consoleLogs: ConsoleLog[];
  runtimeErrors: RuntimeError[];
  networkFailures: NetworkFailure[];
  unhandledRejections: Array<{ reason: string; stack?: string; timestamp: number }>;
  context: {
    url: string;
    userAgent: string;
    viewport: string;
    language: string;
    timezone: string;
    appVersion: string;
    userId?: string;
  };
}

class SupportLogger {
  private consoleLogs: ConsoleLog[] = [];
  private runtimeErrors: RuntimeError[] = [];
  private networkFailures: NetworkFailure[] = [];
  private unhandledRejections: Array<{ reason: string; stack?: string; timestamp: number }> = [];
  private originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
  };
  private maxLogs = 50;
  private maxErrors = 20;
  private maxNetworkFailures = 20;
  private maxRejections = 20;
  private initialized = false;

  constructor() {
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
    };
  }

  public init() {
    if (this.initialized) return;
    this.initialized = true;

    this.setupConsoleInterception();
    this.setupErrorHandlers();
    this.setupNetworkInterception();
  }

  private setupConsoleInterception() {
    console.log = (...args: unknown[]) => {
      this.originalConsole.log(...args);
      this.addConsoleLog('log', args);
    };

    console.warn = (...args: unknown[]) => {
      this.originalConsole.warn(...args);
      this.addConsoleLog('warn', args);
    };

    console.error = (...args: unknown[]) => {
      this.originalConsole.error(...args);
      this.addConsoleLog('error', args);
    };
  }

  private addConsoleLog(level: 'log' | 'warn' | 'error', args: unknown[]) {
    try {
      const message = args
        .map(arg => {
          if (typeof arg === 'string') return arg;
          if (arg instanceof Error) return arg.message + (arg.stack ? '\n' + arg.stack : '');
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        })
        .join(' ');

      const log: ConsoleLog = {
        level,
        message: this.maskSensitiveData(message),
        timestamp: Date.now(),
      };

      this.consoleLogs.push(log);
      if (this.consoleLogs.length > this.maxLogs) {
        this.consoleLogs.shift();
      }
    } catch {
      // Silently fail to prevent breaking the app
    }
  }

  private setupErrorHandlers() {
    window.onerror = (message, source, lineno, colno, error) => {
      try {
        const errorData: RuntimeError = {
          message: this.maskSensitiveData(String(message)),
          source,
          lineno,
          colno,
          stack: error?.stack ? this.maskSensitiveData(error.stack) : undefined,
          timestamp: Date.now(),
        };

        this.runtimeErrors.push(errorData);
        if (this.runtimeErrors.length > this.maxErrors) {
          this.runtimeErrors.shift();
        }
      } catch {
        // Silently fail
      }
      return false;
    };

    window.addEventListener('unhandledrejection', (event) => {
      try {
        const reason = event.reason instanceof Error
          ? event.reason.message
          : String(event.reason);
        const stack = event.reason instanceof Error ? event.reason.stack : undefined;

        this.unhandledRejections.push({
          reason: this.maskSensitiveData(reason),
          stack: stack ? this.maskSensitiveData(stack) : undefined,
          timestamp: Date.now(),
        });

        if (this.unhandledRejections.length > this.maxRejections) {
          this.unhandledRejections.shift();
        }
      } catch {
        // Silently fail
      }
    });
  }

  private setupNetworkInterception() {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function (...args) {
      const startTime = Date.now();
      const [input, init] = args;
      const url = typeof input === 'string' ? input : (input as Request).url;
      const method = init?.method || 'GET';

      try {
        const response = await originalFetch.apply(this, args);
        const durationMs = Date.now() - startTime;

        if (!response.ok) {
          self.addNetworkFailure({
            method,
            url: self.sanitizeUrl(url),
            status: response.status,
            statusText: response.statusText,
            durationMs,
            errorMessage: `HTTP ${response.status}: ${response.statusText}`,
            timestamp: Date.now(),
          });
        }

        return response;
      } catch (error) {
        const durationMs = Date.now() - startTime;
        self.addNetworkFailure({
          method,
          url: self.sanitizeUrl(url),
          durationMs,
          errorMessage: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
        });
        throw error;
      }
    };
  }

  private addNetworkFailure(failure: NetworkFailure) {
    try {
      this.networkFailures.push(failure);
      if (this.networkFailures.length > this.maxNetworkFailures) {
        this.networkFailures.shift();
      }
    } catch {
      // Silently fail
    }
  }

  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin);
      urlObj.search = '';
      return urlObj.toString();
    } catch {
      return url.split('?')[0];
    }
  }

  private maskSensitiveData(text: string): string {
    const patterns = [
      /(token|authorization|apikey|api_key|password|passwd|pwd|secret|bearer)\s*[=:]\s*["']?([^"'\s]{4,})["']?/gi,
    ];

    let masked = text;
    patterns.forEach(pattern => {
      masked = masked.replace(pattern, (_, key) => `${key}=[REDACTED]`);
    });

    return masked;
  }

  public getDebugPayload(userId?: string): DebugPayload {
    return {
      consoleLogs: this.consoleLogs.slice(-this.maxLogs),
      runtimeErrors: this.runtimeErrors.slice(-this.maxErrors),
      networkFailures: this.networkFailures.slice(-this.maxNetworkFailures),
      unhandledRejections: this.unhandledRejections.slice(-this.maxRejections),
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        appVersion: '1.0.0',
        userId: userId || undefined,
      },
    };
  }

  public reset() {
    this.consoleLogs = [];
    this.runtimeErrors = [];
    this.networkFailures = [];
    this.unhandledRejections = [];
  }
}

export const supportLogger = new SupportLogger();
