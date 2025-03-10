import express from 'express';
import healthRoutes from './health.route';
// Import other v1 route modules as they're created

const router = express.Router();

/**
 * Health routes
 * @route /api/v1/health
 */
router.use('/health', healthRoutes);

// Add other route modules here as they're created
// Example: router.use('/users', userRoutes);

export default router; 