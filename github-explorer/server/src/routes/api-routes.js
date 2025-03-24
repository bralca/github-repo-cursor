import express from 'express';
import { getEntityCounts } from '../controllers/api/entity-counts.js';
import { getPipelineStatus } from '../controllers/api/pipeline-status.js';
import { handlePipelineOperations } from '../controllers/api/pipeline-operations.js';
import { getPipelineHistory, clearPipelineHistory } from '../controllers/api/pipeline-history.js';
import { getPipelineSchedules } from '../controllers/api/pipeline-schedules.js';
import { getPipelineItemCount } from '../controllers/api/pipeline-item-count.js';
import { getSitemapStatus, triggerSitemapGeneration } from '../controllers/api/sitemap.js';

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

// Sitemap endpoints
router.get('/sitemap-status', getSitemapStatus);
router.post('/generate-sitemap', triggerSitemapGeneration);

// The following endpoints will be implemented in future tasks:
// - /repositories, /repositories/:id
// - /contributors, /contributors/:id
// - /merge-requests, /merge-requests/:id
// - /commits, /commits/:id
// - /contributor-rankings
// - /bot-detection

export default router; 