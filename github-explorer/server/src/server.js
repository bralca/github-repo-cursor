import 'dotenv/config'; // Load environment variables
import { startServer } from './app.js';
import { logger } from './utils/logger.js';

// Get port from environment or use default
const PORT = process.env.PORT || 3001;

// Start the server
try {
  startServer(PORT);
  logger.info(`Server is running at http://localhost:${PORT}`);
} catch (error) {
  logger.error('Server failed to start', { error });
  process.exit(1);
} 