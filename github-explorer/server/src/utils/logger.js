/**
 * Logger Utility
 * 
 * Provides consistent logging throughout the application.
 * In a production environment, this would be replaced with a more robust logging solution.
 */

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Current log level (can be set via environment variable)
const currentLogLevel = process.env.LOG_LEVEL 
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO
  : LOG_LEVELS.INFO;

// Format log message
function formatLogMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaString = Object.keys(meta).length > 0 
    ? ` ${JSON.stringify(meta)}`
    : '';
  
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
}

/**
 * Creates a logger instance for a specific component
 * @param {string} componentName - Name of the component using the logger
 * @returns {object} Logger instance with component context
 */
export function setupLogger(componentName) {
  return {
    debug: (message, meta = {}) => {
      if (currentLogLevel <= LOG_LEVELS.DEBUG) {
        console.debug(formatLogMessage('debug', `[${componentName}] ${message}`, meta));
      }
    },
    
    info: (message, meta = {}) => {
      if (currentLogLevel <= LOG_LEVELS.INFO) {
        console.info(formatLogMessage('info', `[${componentName}] ${message}`, meta));
      }
    },
    
    warn: (message, meta = {}) => {
      if (currentLogLevel <= LOG_LEVELS.WARN) {
        console.warn(formatLogMessage('warn', `[${componentName}] ${message}`, meta));
      }
    },
    
    error: (message, meta = {}) => {
      if (currentLogLevel <= LOG_LEVELS.ERROR) {
        // If meta contains an error object, extract message and stack
        if (meta.error instanceof Error) {
          const { error, ...restMeta } = meta;
          meta = {
            ...restMeta,
            errorMessage: error.message,
            errorStack: error.stack
          };
        }
        console.error(formatLogMessage('error', `[${componentName}] ${message}`, meta));
      }
    }
  };
}

// Logger implementation
export const logger = {
  debug: (message, meta = {}) => {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
      console.debug(formatLogMessage('debug', message, meta));
    }
  },
  
  info: (message, meta = {}) => {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      console.info(formatLogMessage('info', message, meta));
    }
  },
  
  warn: (message, meta = {}) => {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
      console.warn(formatLogMessage('warn', message, meta));
    }
  },
  
  error: (message, meta = {}) => {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
      // If meta contains an error object, extract message and stack
      if (meta.error instanceof Error) {
        const { error, ...restMeta } = meta;
        meta = {
          ...restMeta,
          errorMessage: error.message,
          errorStack: error.stack
        };
      }
      console.error(formatLogMessage('error', message, meta));
    }
  }
}; 