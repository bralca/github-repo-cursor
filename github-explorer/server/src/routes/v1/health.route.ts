import express from 'express';
import { HealthController } from '../../controllers/v1/health.controller';

const router = express.Router();
const controller = new HealthController();

/**
 * @route   GET /api/v1/health
 * @desc    Basic health check endpoint
 * @access  Public
 */
router.get('/', controller.getHealth);

/**
 * @route   GET /api/v1/health/detailed
 * @desc    Detailed health check with component status
 * @access  Public
 */
router.get('/detailed', controller.getDetailedHealth);

export default router; 