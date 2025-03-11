import { Router } from 'express';
import { getHealthStatus } from '../controllers/health.js';

const router = Router();

// GET /health - Basic health check
router.get('/', (req, res) => {
  return res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// GET /health/detailed - Detailed health check
router.get('/detailed', getHealthStatus);

export default router; 