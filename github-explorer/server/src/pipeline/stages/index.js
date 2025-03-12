/**
 * Pipeline Stages - Index file
 * 
 * This file exports all pipeline stage components.
 */

export { 
  registerWebhookProcessorPipeline, 
  processWebhookPayload,
  processWebhookPayloads
} from './webhook-processor-pipeline.js';

export { registerRepositoryProcessorPipeline } from './repository-processor-pipeline.js';

export { 
  registerContributorRepositoryPipeline,
  processContributorRepositoryRelationships 
} from './contributor-repository-pipeline.js';

export {
  registerMergeRequestProcessorPipeline,
  processMergeRequest,
  processMergeRequests
} from './merge-request-processor-pipeline.js';

export {
  registerCommitProcessorPipeline,
  processCommit,
  processCommits
} from './commit-processor-pipeline.js';

export {
  registerDatabaseWriterPipeline,
  storeData,
  storeRepositories,
  storeContributors,
  storeMergeRequests,
  storeCommits,
  storeCommitStatistics,
  storeContributorRepositoryRelationships
} from './database-writer-pipeline.js'; 