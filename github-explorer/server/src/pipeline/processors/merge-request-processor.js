import { BaseStage } from '../core/base-stage.js';
import { logger } from '../../utils/logger.js';

/**
 * MergeRequestProcessorStage - Processes merge request data to compute various statistics and metrics
 * 
 * This processor analyzes merge requests to compute statistics like cycle time,
 * review time, complexity score, reviewer relationships, and activity metrics.
 */
export class MergeRequestProcessorStage extends BaseStage {
  /**
   * Create a new merge request processor stage
   * @param {Object} options - Processor options
   */
  constructor(options = {}) {
    super({
      name: 'merge-request-processor',
      abortOnError: false,
      config: {
        computeCycleTime: true,
        computeReviewTime: true,
        computeComplexityScore: true,
        computeReviewerRelationships: true,
        computeActivityMetrics: true,
        timeframeInDays: 90, // Default timeframe for historical metrics
        ...options.config
      }
    });
    
    this.githubClient = options.githubClient;
    this.mergeRequestService = options.mergeRequestService;
  }
  
  /**
   * Execute the merge request processing
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} pipelineConfig - Pipeline configuration
   * @returns {Promise<PipelineContext>} Updated pipeline context
   */
  async execute(context, pipelineConfig) {
    this.log('info', 'Starting merge request processing');
    
    // Validate that we have merge requests to process
    this.validateContext(context, ['mergeRequests']);
    
    if (context.mergeRequests.length === 0) {
      this.log('info', 'No merge requests to process, skipping');
      return context;
    }
    
    const config = { ...this.config, ...pipelineConfig };
    
    try {
      this.log('info', `Processing ${context.mergeRequests.length} merge requests`);
      
      // Initialize merge request statistics in context if not exists
      if (!context.mergeRequestStatistics) {
        context.mergeRequestStatistics = {};
      }
      
      // Process each merge request to compute statistics
      for (const mergeRequest of context.mergeRequests) {
        // Skip if merge request is missing an ID
        if (!mergeRequest.id) {
          this.log('warn', 'Skipping merge request without ID');
          continue;
        }
        
        // Create a stats object for this merge request
        const mrStats = {
          merge_request_id: mergeRequest.id,
          repository_id: mergeRequest.repository_id,
          title: mergeRequest.title,
          computed_at: new Date().toISOString(),
        };
        
        // Compute cycle time if enabled
        if (config.computeCycleTime) {
          mrStats.cycle_time = this.computeCycleTime(mergeRequest, context, config);
        }
        
        // Compute review time if enabled
        if (config.computeReviewTime) {
          mrStats.review_time = this.computeReviewTime(mergeRequest, context, config);
        }
        
        // Compute complexity score if enabled
        if (config.computeComplexityScore) {
          mrStats.complexity_score = this.computeComplexityScore(mergeRequest, context, config);
        }
        
        // Compute reviewer relationships if enabled
        if (config.computeReviewerRelationships) {
          mrStats.reviewer_relationships = await this.computeReviewerRelationships(mergeRequest, context, config);
        }
        
        // Compute activity metrics if enabled
        if (config.computeActivityMetrics) {
          mrStats.activity_metrics = this.computeActivityMetrics(mergeRequest, context, config);
        }
        
        // Store statistics in context
        context.mergeRequestStatistics[mergeRequest.id] = mrStats;
        
        // Update merge request with computed metrics
        mergeRequest.cycle_time_hours = mrStats.cycle_time?.hours || mergeRequest.cycle_time_hours;
        mergeRequest.review_time_hours = mrStats.review_time?.hours || mergeRequest.review_time_hours;
        mergeRequest.complexity_score = mrStats.complexity_score?.value || mergeRequest.complexity_score;
      }
      
      this.log('info', 'Merge request processing completed');
      
      return context;
    } catch (error) {
      this.log('error', 'Merge request processing failed', { error });
      context.recordError('merge-request-processor', error);
      if (this.config.abortOnError) {
        throw error;
      }
      return context;
    }
  }
  
  /**
   * Compute cycle time for a merge request
   * @param {Object} mergeRequest - Merge request to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Object} Cycle time metrics
   */
  computeCycleTime(mergeRequest, context, config) {
    this.log('debug', `Computing cycle time for merge request ${mergeRequest.id} (${mergeRequest.title})`);
    
    // Skip if we don't have created_at or merged_at timestamps
    if (!mergeRequest.created_at || !mergeRequest.merged_at) {
      return {
        hours: 0,
        days: 0,
        is_complete: false
      };
    }
    
    const createdAt = new Date(mergeRequest.created_at);
    const mergedAt = new Date(mergeRequest.merged_at);
    
    // Calculate time difference in milliseconds
    const diffMs = mergedAt.getTime() - createdAt.getTime();
    
    // Convert to hours and days
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;
    
    return {
      hours: parseFloat(diffHours.toFixed(2)),
      days: parseFloat(diffDays.toFixed(2)),
      is_complete: true,
      created_at: createdAt.toISOString(),
      merged_at: mergedAt.toISOString()
    };
  }
  
  /**
   * Compute review time for a merge request
   * @param {Object} mergeRequest - Merge request to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Object} Review time metrics
   */
  computeReviewTime(mergeRequest, context, config) {
    this.log('debug', `Computing review time for merge request ${mergeRequest.id} (${mergeRequest.title})`);
    
    // Skip if we don't have the necessary data
    if (!mergeRequest.created_at || (!mergeRequest.merged_at && !mergeRequest.closed_at)) {
      return {
        hours: 0,
        days: 0,
        is_complete: false
      };
    }
    
    // Use first review timestamp if available, otherwise use an estimated time
    const firstReviewTime = this.getFirstReviewTimestamp(mergeRequest, context);
    
    // If we don't have review information, use a heuristic (e.g., 25% of total time)
    if (!firstReviewTime) {
      const createdAt = new Date(mergeRequest.created_at);
      const endTime = mergeRequest.merged_at 
        ? new Date(mergeRequest.merged_at)
        : new Date(mergeRequest.closed_at);
      
      const totalTimeMs = endTime.getTime() - createdAt.getTime();
      
      // Estimate review time as 25% of total time (this is a heuristic)
      const reviewTimeMs = totalTimeMs * 0.25;
      
      // Convert to hours and days
      const reviewHours = reviewTimeMs / (1000 * 60 * 60);
      const reviewDays = reviewHours / 24;
      
      return {
        hours: parseFloat(reviewHours.toFixed(2)),
        days: parseFloat(reviewDays.toFixed(2)),
        is_complete: false,
        is_estimated: true
      };
    }
    
    // Calculate actual review time
    const createdAt = new Date(mergeRequest.created_at);
    const reviewStartAt = new Date(firstReviewTime);
    const endTime = mergeRequest.merged_at 
      ? new Date(mergeRequest.merged_at)
      : new Date(mergeRequest.closed_at);
    
    // Calculate review time in milliseconds
    const reviewTimeMs = endTime.getTime() - reviewStartAt.getTime();
    
    // Convert to hours and days
    const reviewHours = reviewTimeMs / (1000 * 60 * 60);
    const reviewDays = reviewHours / 24;
    
    return {
      hours: parseFloat(reviewHours.toFixed(2)),
      days: parseFloat(reviewDays.toFixed(2)),
      is_complete: true,
      review_started_at: reviewStartAt.toISOString(),
      completed_at: endTime.toISOString()
    };
  }
  
  /**
   * Get the timestamp of the first review for a merge request
   * @param {Object} mergeRequest - Merge request to analyze
   * @param {PipelineContext} context - Pipeline context
   * @returns {string|null} First review timestamp or null
   */
  getFirstReviewTimestamp(mergeRequest, context) {
    // In this implementation, we're returning null as we don't have review data
    // In a real implementation, we would look for review data in the context
    return null;
  }
  
  /**
   * Compute complexity score for a merge request
   * @param {Object} mergeRequest - Merge request to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Object} Complexity score metrics
   */
  computeComplexityScore(mergeRequest, context, config) {
    this.log('debug', `Computing complexity score for merge request ${mergeRequest.id} (${mergeRequest.title})`);
    
    // Base score starts at 10
    let score = 10;
    let reasons = [];
    
    // Factor 1: Number of files changed
    const filesChanged = mergeRequest.files_changed || 0;
    if (filesChanged > 50) {
      score += 30;
      reasons.push(`Large number of files changed (${filesChanged})`);
    } else if (filesChanged > 20) {
      score += 15;
      reasons.push(`Significant number of files changed (${filesChanged})`);
    } else if (filesChanged > 10) {
      score += 5;
      reasons.push(`Moderate number of files changed (${filesChanged})`);
    }
    
    // Factor 2: Lines of code changed
    const linesChanged = (mergeRequest.lines_added || 0) + (mergeRequest.lines_removed || 0);
    if (linesChanged > 1000) {
      score += 30;
      reasons.push(`Very large code changes (${linesChanged} lines)`);
    } else if (linesChanged > 500) {
      score += 20;
      reasons.push(`Large code changes (${linesChanged} lines)`);
    } else if (linesChanged > 200) {
      score += 10;
      reasons.push(`Moderate code changes (${linesChanged} lines)`);
    }
    
    // Factor 3: Number of commits
    const commitCount = mergeRequest.commits || 0;
    if (commitCount > 20) {
      score += 15;
      reasons.push(`High number of commits (${commitCount})`);
    } else if (commitCount > 10) {
      score += 8;
      reasons.push(`Moderate number of commits (${commitCount})`);
    } else if (commitCount > 5) {
      score += 3;
      reasons.push(`Several commits (${commitCount})`);
    }
    
    // Factor 4: Review comments
    const reviewComments = mergeRequest.review_comments || 0;
    if (reviewComments > 50) {
      score += 25;
      reasons.push(`Extensive review discussion (${reviewComments} comments)`);
    } else if (reviewComments > 20) {
      score += 15;
      reasons.push(`Significant review discussion (${reviewComments} comments)`);
    } else if (reviewComments > 10) {
      score += 5;
      reasons.push(`Moderate review discussion (${reviewComments} comments)`);
    }
    
    // Factor 5: Duration
    if (mergeRequest.created_at && mergeRequest.merged_at) {
      const createdAt = new Date(mergeRequest.created_at);
      const mergedAt = new Date(mergeRequest.merged_at);
      const durationHours = (mergedAt - createdAt) / (1000 * 60 * 60);
      
      if (durationHours > 168) { // > 1 week
        score += 15;
        reasons.push(`Long-lived PR (${Math.floor(durationHours / 24)} days)`);
      } else if (durationHours > 72) { // > 3 days
        score += 8;
        reasons.push(`Multi-day PR (${Math.floor(durationHours / 24)} days)`);
      }
    }
    
    // Normalize final score to 0-100 range
    score = Math.min(Math.max(score, 0), 100);
    
    // Determine complexity level
    let complexityLevel = 'low';
    if (score > 75) {
      complexityLevel = 'very high';
    } else if (score > 50) {
      complexityLevel = 'high';
    } else if (score > 25) {
      complexityLevel = 'medium';
    }
    
    return {
      value: score,
      level: complexityLevel,
      factors: reasons
    };
  }
  
  /**
   * Compute reviewer relationships for a merge request
   * @param {Object} mergeRequest - Merge request to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Promise<Object>} Reviewer relationship metrics
   */
  async computeReviewerRelationships(mergeRequest, context, config) {
    this.log('debug', `Computing reviewer relationships for merge request ${mergeRequest.id} (${mergeRequest.title})`);
    
    // In this implementation, we're returning empty data as we don't have review data
    // In a real implementation, we would gather reviewer information from the context
    
    return {
      count: 0,
      reviewers: []
    };
  }
  
  /**
   * Compute activity metrics for a merge request
   * @param {Object} mergeRequest - Merge request to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Object} Activity metrics
   */
  computeActivityMetrics(mergeRequest, context, config) {
    this.log('debug', `Computing activity metrics for merge request ${mergeRequest.id} (${mergeRequest.title})`);
    
    // Create a timeline of events
    const timeline = [];
    
    // Add creation event
    if (mergeRequest.created_at) {
      timeline.push({
        event: 'created',
        timestamp: mergeRequest.created_at,
        actor: mergeRequest.author || 'unknown'
      });
    }
    
    // Add merge event
    if (mergeRequest.merged_at) {
      timeline.push({
        event: 'merged',
        timestamp: mergeRequest.merged_at,
        actor: mergeRequest.merged_by?.login || 'unknown'
      });
    }
    
    // Add close event if closed without merging
    if (mergeRequest.closed_at && !mergeRequest.merged_at) {
      timeline.push({
        event: 'closed',
        timestamp: mergeRequest.closed_at,
        actor: mergeRequest.closed_by?.login || 'unknown'
      });
    }
    
    // Sort timeline by timestamp
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Calculate activity pattern (how many updates/day)
    const activityRate = this.calculateActivityRate(mergeRequest, timeline);
    
    return {
      timeline,
      activity_rate: activityRate,
      comment_count: mergeRequest.comments || 0,
      review_comment_count: mergeRequest.review_comments || 0,
      commit_count: mergeRequest.commits || 0
    };
  }
  
  /**
   * Calculate activity rate for a merge request
   * @param {Object} mergeRequest - Merge request to analyze
   * @param {Array} timeline - Timeline of events
   * @returns {Object} Activity rate metrics
   */
  calculateActivityRate(mergeRequest, timeline) {
    // If we don't have created and updated timestamps, return zero
    if (!mergeRequest.created_at || !mergeRequest.updated_at) {
      return {
        events_per_day: 0,
        intensity: 'none'
      };
    }
    
    const createdAt = new Date(mergeRequest.created_at);
    const updatedAt = new Date(mergeRequest.updated_at);
    
    // Calculate duration in days
    const durationDays = (updatedAt - createdAt) / (1000 * 60 * 60 * 24);
    
    // If duration is less than a day, set to 1 day to avoid division by zero
    const effectiveDuration = Math.max(durationDays, 1);
    
    // Count total events (commits, comments, timeline events)
    const totalEvents = 
      (mergeRequest.commits || 0) + 
      (mergeRequest.comments || 0) + 
      (mergeRequest.review_comments || 0) + 
      timeline.length;
    
    // Calculate events per day
    const eventsPerDay = totalEvents / effectiveDuration;
    
    // Determine intensity level
    let intensity = 'low';
    if (eventsPerDay > 20) {
      intensity = 'very high';
    } else if (eventsPerDay > 10) {
      intensity = 'high';
    } else if (eventsPerDay > 5) {
      intensity = 'medium';
    }
    
    return {
      events_per_day: parseFloat(eventsPerDay.toFixed(2)),
      total_events: totalEvents,
      duration_days: parseFloat(effectiveDuration.toFixed(2)),
      intensity
    };
  }
  
  /**
   * Validate required context properties
   * @param {PipelineContext} context - Pipeline context
   * @param {Array<string>} requiredProps - Required properties
   * @throws {Error} If required properties are missing
   */
  validateContext(context, requiredProps) {
    for (const prop of requiredProps) {
      if (!context[prop]) {
        context[prop] = [];
        this.log('warn', `Missing ${prop} in context, initializing as empty array`);
      }
    }
  }
  
  /**
   * Helper method for logging with context
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  log(level, message, meta = {}) {
    logger[level](message, {
      stage: this.name,
      ...meta
    });
  }
} 