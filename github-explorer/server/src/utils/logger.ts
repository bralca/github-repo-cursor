import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Define format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.splat !== undefined ? `${info.splat}` : ''}${
      info.stack !== undefined ? `\n${info.stack}` : ''
    }`
  )
);

// Define format for file output (JSON)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.json()
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  // Daily rotate file for all logs
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: path.join('logs', 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
    })
  );
  
  // Daily rotate file for error logs
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
      format: fileFormat,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports,
  exitOnError: false,
});

export default logger;

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