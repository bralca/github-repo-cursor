import express from 'express';
import { getEntityCounts } from './src/controllers/api/entity-counts.js';

// Create a simple Express app
const app = express();

// Add the test route
app.get('/api/entity-counts', getEntityCounts);

// Start the server
const PORT = 3005;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test the endpoint by opening: http://localhost:${PORT}/api/entity-counts`);
});

console.log('Press Ctrl+C to stop the server'); 