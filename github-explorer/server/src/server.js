import 'dotenv/config'; // Load environment variables
import { startServer } from './app.js';
import { logger } from './utils/logger.js';

// Set the port for the server to listen on
const PORT = process.env.PORT || 3002;

// Log the port we're trying to use
console.log(`Attempting to start server on port ${PORT}`);
logger.info(`Using database path: ${process.env.DB_PATH}`);

// Start the server
try {
  startServer(PORT);
  logger.info(`Server is running at http://localhost:${PORT}`);
} catch (error) {
  logger.error('Failed to start server', { error });
  process.exit(1);
} 