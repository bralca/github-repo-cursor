import { Router } from 'express';
import healthRoutes from './health.route';
import githubRoutes from './github.route';
// Import other v1 route modules as they're created

const router = Router();

/**
 * Health routes
 * @route /api/v1/health
 */
router.use('/health', healthRoutes);

// GitHub routes
router.use('/github', githubRoutes);

// Add other route modules here as they're created
// Example: router.use('/users', userRoutes);

export default router; 