/**
 * Repository Routes
 * 
 * API routes for repository operations
 */

import express from 'express';
import {
  addRepository,
  getRepository,
  listRepositories,
  refreshRepository,
  removeRepository
} from '../controllers/repository.controller.js';

const router = express.Router();

/**
 * @route   GET /api/repositories
 * @desc    Get all repositories with pagination and filtering
 * @access  Public
 */
router.get('/', listRepositories);

/**
 * @route   GET /api/repositories/:owner/:repo
 * @desc    Get a specific repository by owner and name
 * @access  Public
 */
router.get('/:owner/:repo', getRepository);

/**
 * @route   POST /api/repositories/:owner/:repo
 * @desc    Add a repository to the database from GitHub
 * @access  Private (requires authentication)
 */
router.post('/:owner/:repo', addRepository);

/**
 * @route   PUT /api/repositories/:owner/:repo
 * @desc    Refresh repository data from GitHub
 * @access  Private (requires authentication)
 */
router.put('/:owner/:repo', refreshRepository);

/**
 * @route   DELETE /api/repositories/:id
 * @desc    Remove a repository from the database
 * @access  Private (requires authentication)
 */
router.delete('/:id', removeRepository);

export default router; 