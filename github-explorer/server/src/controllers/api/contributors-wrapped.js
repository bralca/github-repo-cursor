/**
 * Wrapped Contributors Controller
 * 
 * Wraps all contributor controller functions with error handling
 * to ensure database connection issues are properly handled.
 */

import wrapController from './wrap-controller.js';
import * as contributorsController from './contributors.js';

// Wrap each controller function with error handling
export const getContributors = wrapController(contributorsController.getContributors);
export const getContributorById = wrapController(contributorsController.getContributorById);
export const getContributorByLogin = wrapController(contributorsController.getContributorByLogin);
export const getContributorActivity = wrapController(contributorsController.getContributorActivity);
export const getContributorImpact = wrapController(contributorsController.getContributorImpact);
export const getContributorRepositories = wrapController(contributorsController.getContributorRepositories);
export const getContributorMergeRequests = wrapController(contributorsController.getContributorMergeRequests);
export const getContributorRecentActivity = wrapController(contributorsController.getContributorRecentActivity);
export const getContributorRankings = wrapController(contributorsController.getContributorRankings);
export const getContributorProfileMetadata = wrapController(contributorsController.getContributorProfileMetadata);
export const getContributorProfileData = wrapController(contributorsController.getContributorProfileData); 