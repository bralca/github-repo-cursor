import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels with custom colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  verbose: 5,
};

// Define custom colors for log levels
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  verbose: 'cyan',
};

// Add colors to winston
winston.addColors(colors);

// Determine log level based on environment
const getLogLevel = (): string => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : process.env.LOG_LEVEL || 'info';
};

// Configure log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Configure console format with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message} ${info.component ? `[${info.component}]` : ''} ${
      info.requestId ? `(${info.requestId})` : ''
    } ${info.stack || ''}`
  )
);

// Create file transports with rotation
const fileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

// Create error file transport for errors only
const errorFileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error',
  format: logFormat,
});

// Create console transport
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
});

// Collect all transports
const transports: winston.transport[] = [consoleTransport];

// Add file transports if not in test environment
if (process.env.NODE_ENV !== 'test') {
  transports.push(fileTransport, errorFileTransport);
}

// Create the logger instance
export const logger = winston.createLogger({
  level: getLogLevel(),
  levels: logLevels,
  format: logFormat,
  defaultMeta: { 
    service: 'github-analytics-server',
    environment: process.env.NODE_ENV || 'development' 
  },
  transports,
  exitOnError: false,
});

// Track whether the system is shutting down
let isShuttingDown = false;

// Export shutdown status check
export const setShutdownStatus = (shuttingDown: boolean): void => {
  isShuttingDown = shuttingDown;
};

export const isSystemShuttingDown = (): boolean => isShuttingDown;

// Store request ID in AsyncLocalStorage for access across the request lifecycle
import { AsyncLocalStorage } from 'async_hooks';

interface LogContext {
  requestId?: string;
  userId?: string;
  [key: string]: any;
}

export const logContextStorage = new AsyncLocalStorage<LogContext>();

// Add request ID to logger context
export const addRequestId = (requestId: string): void => {
  const context = logContextStorage.getStore();
  if (context) {
    context.requestId = requestId;
  } else {
    logContextStorage.enterWith({ requestId });
  }
};

// Add user ID to logger context
export const addUserId = (userId: string): void => {
  const context = logContextStorage.getStore();
  if (context) {
    context.userId = userId;
  }
};

// Get current context for logging
const getLogContext = (): LogContext => {
  return logContextStorage.getStore() || {};
};

// Export a logger factory that includes component name and context
export const createLogger = (component: string) => {
  return {
    error: (message: string, meta = {}) => {
      const context = getLogContext();
      logger.error(message, { component, ...context, ...meta });
    },
    warn: (message: string, meta = {}) => {
      const context = getLogContext();
      logger.warn(message, { component, ...context, ...meta });
    },
    info: (message: string, meta = {}) => {
      const context = getLogContext();
      logger.info(message, { component, ...context, ...meta });
    },
    http: (message: string, meta = {}) => {
      const context = getLogContext();
      logger.http(message, { component, ...context, ...meta });
    },
    debug: (message: string, meta = {}) => {
      const context = getLogContext();
      logger.debug(message, { component, ...context, ...meta });
    },
    verbose: (message: string, meta = {}) => {
      const context = getLogContext();
      logger.verbose(message, { component, ...context, ...meta });
    },
  };
}; 