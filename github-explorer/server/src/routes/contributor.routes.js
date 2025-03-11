/**
 * Contributor Routes
 * 
 * API routes for contributor operations
 */

import express from 'express';
import {
  addContributor,
  getContributor,
  listContributors,
  getTop,
  getByRepository,
  linkToRepository,
  refreshContributor
} from '../controllers/contributor.controller.js';

const router = express.Router();

/**
 * @route   GET /api/contributors
 * @desc    Get all contributors with pagination and filtering
 * @access  Public
 */
router.get('/', listContributors);

/**
 * @route   GET /api/contributors/top
 * @desc    Get top contributors by impact score
 * @access  Public
 */
router.get('/top', getTop);

/**
 * @route   GET /api/contributors/repository/:repositoryId
 * @desc    Get contributors for a specific repository
 * @access  Public
 */
router.get('/repository/:repositoryId', getByRepository);

/**
 * @route   GET /api/contributors/:username
 * @desc    Get a specific contributor by username
 * @access  Public
 */
router.get('/:username', getContributor);

/**
 * @route   POST /api/contributors/:username
 * @desc    Add a contributor to the database from GitHub
 * @access  Private (requires authentication)
 */
router.post('/:username', addContributor);

/**
 * @route   PUT /api/contributors/:username
 * @desc    Refresh contributor data from GitHub
 * @access  Private (requires authentication)
 */
router.put('/:username', refreshContributor);

/**
 * @route   POST /api/contributors/:contributorId/repositories/:repositoryId
 * @desc    Link a contributor to a repository
 * @access  Private (requires authentication)
 */
router.post('/:contributorId/repositories/:repositoryId', linkToRepository);

export default router; 