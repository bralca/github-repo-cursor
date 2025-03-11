import { logger } from '../../utils/logger.js';

/**
 * PipelineContext - Shared context for pipeline stages
 * 
 * This class provides a shared context for pipeline stages to store
 * and retrieve data during pipeline execution.
 */
export class PipelineContext {
  /**
   * Create a new pipeline context
   * @param {Object} initialData - Initial data to populate the context
   * @param {string} runId - Unique ID for this pipeline run
   */
  constructor(initialData = {}, runId = null) {
    // Run metadata
    this.runId = runId || this.generateRunId();
    this.startTime = Date.now();
    this.endTime = null;
    this.state = 'pending';
    
    // Entities
    this.rawData = initialData.rawData || [];
    this.repositories = initialData.repositories || [];
    this.contributors = initialData.contributors || [];
    this.mergeRequests = initialData.mergeRequests || [];
    this.commits = initialData.commits || [];
    
    // Statistics
    this.stats = {
      rawDataProcessed: 0,
      repositoriesExtracted: 0,
      contributorsExtracted: 0,
      mergeRequestsExtracted: 0,
      commitsExtracted: 0,
      errors: 0
    };
    
    // Errors
    this.errors = [];
    
    // Checkpoints
    this.checkpoints = {};
    
    logger.info(`Created pipeline context with run ID: ${this.runId}`);
  }
  
  /**
   * Set a checkpoint for a pipeline stage
   * @param {string} stageName - Name of the stage
   * @param {Object} data - Checkpoint data
   */
  setCheckpoint(stageName, data = {}) {
    this.checkpoints[stageName] = {
      timestamp: Date.now(),
      ...data
    };
    logger.debug(`Checkpoint set for stage ${stageName}`, { runId: this.runId, stageName, data });
  }
  
  /**
   * Get a checkpoint for a pipeline stage
   * @param {string} stageName - Name of the stage
   * @returns {Object|null} Checkpoint data or null if not found
   */
  getCheckpoint(stageName) {
    return this.checkpoints[stageName] || null;
  }
  
  /**
   * Get all checkpoints
   * @returns {Object} All checkpoints
   */
  getCheckpoints() {
    return this.checkpoints;
  }
  
  /**
   * Generate a unique run ID
   * @returns {string} Unique run ID
   */
  generateRunId() {
    return `run-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }
  
  /**
   * Mark the pipeline as started
   */
  start() {
    this.startTime = Date.now();
    this.state = 'running';
    logger.info(`Pipeline run ${this.runId} started`);
  }
  
  /**
   * Mark the pipeline as completed
   */
  complete() {
    this.endTime = Date.now();
    this.state = 'completed';
    logger.info(`Pipeline run ${this.runId} completed in ${this.getDuration()}ms`);
  }
  
  /**
   * Mark the pipeline as failed
   * @param {Error} error - Error that caused the failure
   */
  fail(error) {
    this.endTime = Date.now();
    this.state = 'failed';
    this.recordError('pipeline', error);
    logger.error(`Pipeline run ${this.runId} failed after ${this.getDuration()}ms`, { error });
  }
  
  /**
   * Get the duration of the pipeline run
   * @returns {number} Duration in milliseconds
   */
  getDuration() {
    return (this.endTime || Date.now()) - this.startTime;
  }
  
  /**
   * Record an error that occurred during pipeline execution
   * @param {string} stage - Stage where the error occurred
   * @param {Error} error - Error object
   */
  recordError(stage, error) {
    this.errors.push({
      stage,
      message: error.message,
      stack: error.stack,
      timestamp: Date.now()
    });
    
    this.stats.errors += 1;
  }
  
  /**
   * Add repositories to the context
   * @param {Array} repositories - Repositories to add
   */
  addRepositories(repositories) {
    if (Array.isArray(repositories)) {
      this.repositories = [...this.repositories, ...repositories];
    }
  }
  
  /**
   * Add contributors to the context
   * @param {Array} contributors - Contributors to add
   */
  addContributors(contributors) {
    if (Array.isArray(contributors)) {
      this.contributors = [...this.contributors, ...contributors];
    }
  }
  
  /**
   * Add merge requests to the context
   * @param {Array} mergeRequests - Merge requests to add
   */
  addMergeRequests(mergeRequests) {
    if (Array.isArray(mergeRequests)) {
      this.mergeRequests = [...this.mergeRequests, ...mergeRequests];
    }
  }
  
  /**
   * Add commits to the context
   * @param {Array} commits - Commits to add
   */
  addCommits(commits) {
    if (Array.isArray(commits)) {
      this.commits = [...this.commits, ...commits];
    }
  }
  
  /**
   * Get current statistics
   * @returns {Object} Pipeline statistics
   */
  getStats() {
    const stats = {
      rawDataProcessed: this.stats.rawDataProcessed || 0,
      repositoriesExtracted: this.stats.repositoriesExtracted || 0,
      contributorsExtracted: this.stats.contributorsExtracted || 0,
      mergeRequestsExtracted: this.stats.mergeRequestsExtracted || 0,
      commitsExtracted: this.stats.commitsExtracted || 0,
      errors: this.stats.errors || 0,
      repositoriesCount: this.repositories.length,
      contributorsCount: this.contributors.length,
      mergeRequestsCount: this.mergeRequests.length,
      commitsCount: this.commits.length
    };
    
    return stats;
  }
  
  /**
   * Get a summary of the pipeline execution
   * @returns {Object} Pipeline execution summary
   */
  getSummary() {
    const stats = this.getStats();
    
    const summary = {
      runId: this.runId,
      state: this.state,
      duration: this.getDuration(),
      stats: {
        rawDataProcessed: stats.rawDataProcessed,
        repositoriesExtracted: stats.repositoriesExtracted,
        contributorsExtracted: stats.contributorsExtracted,
        mergeRequestsExtracted: stats.mergeRequestsExtracted,
        commitsExtracted: stats.commitsExtracted,
        errors: stats.errors
      },
      repositoriesCount: this.repositories.length,
      contributorsCount: this.contributors.length,
      mergeRequestsCount: this.mergeRequests.length,
      commitsCount: this.commits.length,
      errors: this.errors.length > 0,
      errorCount: this.errors.length
    };
    
    return summary;
  }
} 