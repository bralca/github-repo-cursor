import express from 'express';
import { getEntityCounts } from '../controllers/api/entity-counts.js';
import { getPipelineStatus } from '../controllers/api/pipeline-status.js';
import { handlePipelineOperations } from '../controllers/api/pipeline-operations.js';
import { getPipelineHistory, clearPipelineHistory } from '../controllers/api/pipeline-history.js';
import { getPipelineSchedules } from '../controllers/api/pipeline-schedules.js';
import { getPipelineItemCount } from '../controllers/api/pipeline-item-count.js';
import { getSitemapStatus, triggerSitemapGeneration, getSitemapContent } from '../controllers/api/sitemap.js';
import { handleContributorRankings } from '../controllers/api/contributor-rankings.js';
import { getRepositories, getRepositoryById, getRepositoryBySlug } from '../controllers/api/repositories.js';
import { getContributors, getContributorById, getContributorByLogin } from '../controllers/api/contributors.js';
import { getMergeRequests, getMergeRequestById, getMergeRequestByNumber } from '../controllers/api/merge-requests.js';
import { getCommits, getCommitById, getCommitBySha } from '../controllers/api/commits.js';

const router = express.Router();

// Entity counts
router.get('/entity-counts', getEntityCounts);

// Pipeline endpoints
router.get('/pipeline-status', getPipelineStatus);
router.get('/pipeline-history', getPipelineHistory);
router.get('/pipeline-schedules', getPipelineSchedules);
router.get('/pipeline-item-count', getPipelineItemCount);
router.post('/pipeline-operations', handlePipelineOperations);
router.post('/pipeline-history-clear', clearPipelineHistory);

// Repository endpoints
router.get('/repositories', getRepositories);
router.get('/repositories/id/:id', getRepositoryById);
router.get('/repositories/:slug', getRepositoryBySlug);

// Contributor endpoints
router.get('/contributors', getContributors);
router.get('/contributors/id/:id', getContributorById);
router.get('/contributors/:login', getContributorByLogin);

// Merge request endpoints
router.get('/merge-requests', getMergeRequests);
router.get('/merge-requests/id/:id', getMergeRequestById);
router.get('/merge-requests/repository/:repository_id/number/:number', getMergeRequestByNumber);

// Commit endpoints
router.get('/commits', getCommits);
router.get('/commits/id/:id', getCommitById);
router.get('/commits/repository/:repository_id/sha/:sha', getCommitBySha);

// Sitemap endpoints
router.get('/sitemap-status', getSitemapStatus);
router.post('/generate-sitemap', triggerSitemapGeneration);
router.get('/sitemap.xml', getSitemapContent);

// Ranking endpoints
router.post('/contributor-rankings', handleContributorRankings);

// The following endpoints will be implemented in future tasks:
// - /bot-detection

export default router; 