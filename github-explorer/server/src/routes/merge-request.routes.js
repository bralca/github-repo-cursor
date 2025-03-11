/**
 * Merge Request Routes
 * 
 * This file defines API routes for accessing and managing GitHub merge request (pull request) data.
 */

import express from 'express';
import mergeRequestController from '../controllers/merge-request.controller.js';
import { validateRequestParams } from '../middleware/validation.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes - no authentication required
// ---------------------------------------------

/**
 * @route GET /api/merge-requests
 * @description Get all merge requests with optional filtering
 * @access Public
 */
router.get('/', mergeRequestController.getAllMergeRequests);

/**
 * @route GET /api/merge-requests/:id
 * @description Get merge request by ID
 * @access Public
 */
router.get('/:id', validateRequestParams(['id']), mergeRequestController.getMergeRequestById);

/**
 * @route GET /api/merge-requests/repository/:repoId
 * @description Get merge requests by repository ID
 * @access Public
 */
router.get(
  '/repository/:repoId',
  validateRequestParams(['repoId']),
  mergeRequestController.getMergeRequestsByRepository
);

/**
 * @route GET /api/merge-requests/author/:author
 * @description Get merge requests by author username
 * @access Public
 */
router.get(
  '/author/:author',
  validateRequestParams(['author']),
  mergeRequestController.getMergeRequestsByAuthor
);

/**
 * @route GET /api/merge-requests/status/:status
 * @description Get recent merge requests by status (open, closed, merged)
 * @access Public
 */
router.get(
  '/status/:status',
  validateRequestParams(['status']),
  mergeRequestController.getRecentMergeRequestsByStatus
);

// Protected routes - authentication required
// -------------------------------------------

/**
 * @route POST /api/merge-requests/fetch/:owner/:repo
 * @description Fetch and store merge requests for a repository from GitHub
 * @access Private
 */
router.post(
  '/fetch/:owner/:repo',
  authenticateToken,
  validateRequestParams(['owner', 'repo']),
  mergeRequestController.fetchAndStoreMergeRequests
);

export default router; 