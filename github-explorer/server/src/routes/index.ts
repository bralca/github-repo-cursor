import express from 'express';
import v1Routes from './v1';
import { apiRateLimit } from '../middleware/rate-limit.middleware';

const router = express.Router();

/**
 * API v1 routes
 * @route /api/v1
 */
router.use('/v1', apiRateLimit, v1Routes);

// Legacy health check endpoint (simplified version without rate limiting)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'github-explorer-pipeline-server',
    timestamp: new Date().toISOString()
  });
});

export default router; 