import 'dotenv/config'; // Load environment variables
import { startServer } from './app.js';
import { logger } from './utils/logger.js';
import path from 'path';
import fs from 'fs';

// Log server environment
console.log(`[SERVER] Node version: ${process.version}`);
console.log(`[SERVER] Working directory: ${process.cwd()}`);
console.log(`[SERVER] .env file exists: ${fs.existsSync(path.resolve(process.cwd(), '.env'))}`);
console.log(`[SERVER] Database path: ${process.env.DB_PATH}`);

// Check if DB_PATH environment variable is set
if (!process.env.DB_PATH) {
  console.log(`[SERVER] ERROR: DB_PATH environment variable is not set. This will cause database connection issues.`);
  // Set a default value to help recover
  process.env.DB_PATH = path.resolve(process.cwd(), 'db/github_explorer.db');
  console.log(`[SERVER] Setting default DB_PATH to: ${process.env.DB_PATH}`);
}

// Set the port for the server to listen on
const PORT = process.env.PORT || 3002;

// Log the port we're trying to use
console.log(`Attempting to start server on port ${PORT}`);
logger.info(`Using database path: ${process.env.DB_PATH}`);

// Start the server
(async () => {
  try {
    await startServer(PORT);
    logger.info(`Server is running at http://localhost:${PORT}`);
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
})(); 