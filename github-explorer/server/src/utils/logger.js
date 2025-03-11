/**
 * Logger Utility
 * 
 * This module provides a consistent logging interface for the application.
 * It uses Pino for structured logging with appropriate formatting.
 */

import pino from 'pino';

// Configure logger based on environment
const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname'
    }
  },
  base: {
    env: process.env.NODE_ENV || 'development'
  }
};

// Create and export logger instance
export const logger = pino(loggerConfig); 