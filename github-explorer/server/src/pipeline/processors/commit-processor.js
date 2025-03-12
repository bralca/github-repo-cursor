import { BaseStage } from '../core/base-stage.js';
import { logger } from '../../utils/logger.js';

/**
 * CommitProcessorStage - Processes commit data to compute various statistics and metrics
 * 
 * This processor analyzes commits to compute statistics like code impact,
 * complexity, commit classification, and language distribution.
 */
export class CommitProcessorStage extends BaseStage {
  /**
   * Create a new commit processor stage
   * @param {Object} options - Processor options
   */
  constructor(options = {}) {
    super({
      name: 'commit-processor',
      abortOnError: false,
      config: {
        computeCodeImpact: true,
        computeComplexity: true,
        computeCommitClassification: true,
        computeLanguageDistribution: true,
        computeFileChanges: true,
        timeframeInDays: 90, // Default timeframe for historical metrics
        ...options.config
      }
    });
    
    this.githubClient = options.githubClient;
    this.commitService = options.commitService;
  }
  
  /**
   * Execute the commit processing
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} pipelineConfig - Pipeline configuration
   * @returns {Promise<PipelineContext>} Updated pipeline context
   */
  async execute(context, pipelineConfig) {
    this.log('info', 'Starting commit processing');
    
    // Validate that we have commits to process
    this.validateContext(context, ['commits']);
    
    if (context.commits.length === 0) {
      this.log('info', 'No commits to process, skipping');
      return context;
    }
    
    const config = { ...this.config, ...pipelineConfig };
    
    try {
      this.log('info', `Processing ${context.commits.length} commits`);
      
      // Initialize commit statistics in context if not exists
      if (!context.commitStatistics) {
        context.commitStatistics = {};
      }
      
      // Process each commit to compute statistics
      for (const commit of context.commits) {
        // Skip if commit is missing a hash
        if (!commit.hash) {
          this.log('warn', 'Skipping commit without hash');
          continue;
        }
        
        // Create a stats object for this commit
        const commitStats = {
          hash: commit.hash,
          repository_id: commit.repository_id,
          title: commit.title,
          computed_at: new Date().toISOString(),
        };
        
        // Compute code impact if enabled
        if (config.computeCodeImpact) {
          commitStats.code_impact = this.computeCodeImpact(commit, context, config);
        }
        
        // Compute complexity if enabled
        if (config.computeComplexity) {
          commitStats.complexity = this.computeComplexity(commit, context, config);
        }
        
        // Compute commit classification if enabled
        if (config.computeCommitClassification) {
          commitStats.classification = this.computeCommitClassification(commit, context, config);
        }
        
        // Compute language distribution if enabled
        if (config.computeLanguageDistribution) {
          commitStats.language_distribution = await this.computeLanguageDistribution(commit, context, config);
        }
        
        // Compute file changes if enabled
        if (config.computeFileChanges) {
          commitStats.file_changes = this.computeFileChanges(commit, context, config);
        }
        
        // Store statistics in context
        context.commitStatistics[commit.hash] = commitStats;
        
        // Update commit with computed metrics
        commit.code_impact_score = commitStats.code_impact?.score || commit.code_impact_score;
        commit.complexity_score = commitStats.complexity?.score || commit.complexity_score;
        commit.commit_type = commitStats.classification?.type || commit.commit_type;
      }
      
      this.log('info', 'Commit processing completed');
      
      return context;
    } catch (error) {
      this.log('error', 'Commit processing failed', { error });
      context.recordError('commit-processor', error);
      if (this.config.abortOnError) {
        throw error;
      }
      return context;
    }
  }
  
  /**
   * Compute code impact for a commit
   * @param {Object} commit - Commit to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Object} Code impact metrics
   */
  computeCodeImpact(commit, context, config) {
    this.log('debug', `Computing code impact for commit ${commit.hash} (${commit.title})`);
    
    // Skip if we don't have the necessary data
    if (!commit.stats_additions && !commit.stats_deletions) {
      return {
        score: 0,
        level: 'unknown',
        factors: ['Insufficient data to calculate impact']
      };
    }
    
    // Get the stats
    const additions = commit.stats_additions || 0;
    const deletions = commit.stats_deletions || 0;
    const totalChanges = additions + deletions;
    const filesChanged = commit.files_changed || 0;
    
    // Base score calculation
    let score = 0;
    const reasons = [];
    
    // Factor 1: Total lines changed
    if (totalChanges > 1000) {
      score += 40;
      reasons.push(`Large change (${totalChanges} lines)`);
    } else if (totalChanges > 500) {
      score += 30;
      reasons.push(`Significant change (${totalChanges} lines)`);
    } else if (totalChanges > 200) {
      score += 20;
      reasons.push(`Moderate change (${totalChanges} lines)`);
    } else if (totalChanges > 50) {
      score += 10;
      reasons.push(`Small change (${totalChanges} lines)`);
    } else {
      score += 5;
      reasons.push(`Minimal change (${totalChanges} lines)`);
    }
    
    // Factor 2: Number of files changed
    if (filesChanged > 50) {
      score += 30;
      reasons.push(`Very high file count (${filesChanged} files)`);
    } else if (filesChanged > 20) {
      score += 20;
      reasons.push(`High file count (${filesChanged} files)`);
    } else if (filesChanged > 10) {
      score += 10;
      reasons.push(`Moderate file count (${filesChanged} files)`);
    } else if (filesChanged > 5) {
      score += 5;
      reasons.push(`Low file count (${filesChanged} files)`);
    } else {
      score += 1;
      reasons.push(`Very low file count (${filesChanged} files)`);
    }
    
    // Factor 3: Ratio of additions to deletions
    const ratio = additions / (deletions || 1);
    if (ratio > 10) {
      score += 15;
      reasons.push(`Mostly new code (${ratio.toFixed(1)}:1 ratio)`);
    } else if (ratio < 0.1) {
      score += 15;
      reasons.push(`Mostly code removal (${(1/ratio).toFixed(1)}:1 ratio)`);
    } else if (ratio > 3) {
      score += 10;
      reasons.push(`More additions than deletions (${ratio.toFixed(1)}:1 ratio)`);
    } else if (ratio < 0.3) {
      score += 10;
      reasons.push(`More deletions than additions (${(1/ratio).toFixed(1)}:1 ratio)`);
    } else {
      score += 5;
      reasons.push(`Balanced additions and deletions (${ratio.toFixed(1)}:1 ratio)`);
    }
    
    // Cap score at 100
    score = Math.min(score, 100);
    
    // Determine impact level
    let level = 'minor';
    if (score > 75) {
      level = 'massive';
    } else if (score > 50) {
      level = 'major';
    } else if (score > 25) {
      level = 'moderate';
    }
    
    return {
      score,
      level,
      factors: reasons,
      stats: {
        additions,
        deletions,
        total_changes: totalChanges,
        files_changed: filesChanged,
        ratio: parseFloat(ratio.toFixed(2))
      }
    };
  }
  
  /**
   * Compute complexity for a commit
   * @param {Object} commit - Commit to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Object} Complexity metrics
   */
  computeComplexity(commit, context, config) {
    this.log('debug', `Computing complexity for commit ${commit.hash} (${commit.title})`);
    
    // In a real implementation, you'd analyze the diff content to calculate complexity
    // Here we'll use a simplified approach based on available metadata
    
    // Extract the message and other metadata
    const message = commit.title + (commit.message_body ? '\n' + commit.message_body : '');
    const totalChanges = (commit.stats_additions || 0) + (commit.stats_deletions || 0);
    const filesChanged = commit.files_changed || 0;
    
    // Base score
    let score = 10;
    const reasons = [];
    
    // Factor 1: Number of files changed
    if (filesChanged > 30) {
      score += 30;
      reasons.push(`Many files modified (${filesChanged})`);
    } else if (filesChanged > 15) {
      score += 20;
      reasons.push(`Several files modified (${filesChanged})`);
    } else if (filesChanged > 5) {
      score += 10;
      reasons.push(`Multiple files modified (${filesChanged})`);
    }
    
    // Factor 2: Total changes
    if (totalChanges > 500) {
      score += 30;
      reasons.push(`Large change volume (${totalChanges} lines)`);
    } else if (totalChanges > 200) {
      score += 20;
      reasons.push(`Significant change volume (${totalChanges} lines)`);
    } else if (totalChanges > 100) {
      score += 10;
      reasons.push(`Moderate change volume (${totalChanges} lines)`);
    }
    
    // Factor 3: Message complexity (simple heuristic)
    if (message && message.length > 1000) {
      score += 15;
      reasons.push('Very detailed commit message');
    } else if (message && message.length > 500) {
      score += 10;
      reasons.push('Detailed commit message');
    } else if (message && message.length > 200) {
      score += 5;
      reasons.push('Descriptive commit message');
    }
    
    // Factor 4: Commit has parent commits (merge complexity)
    if (commit.parents && commit.parents.length > 1) {
      score += 25;
      reasons.push(`Merge commit with ${commit.parents.length} parents`);
    }
    
    // Cap score at 100
    score = Math.min(score, 100);
    
    // Determine complexity level
    let level = 'simple';
    if (score > 75) {
      level = 'very complex';
    } else if (score > 50) {
      level = 'complex';
    } else if (score > 25) {
      level = 'moderate';
    }
    
    return {
      score,
      level,
      factors: reasons
    };
  }
  
  /**
   * Compute classification for a commit
   * @param {Object} commit - Commit to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Object} Classification metrics
   */
  computeCommitClassification(commit, context, config) {
    this.log('debug', `Computing classification for commit ${commit.hash} (${commit.title})`);
    
    // Extract the message
    const message = (commit.title || '') + (commit.message_body ? '\n' + commit.message_body : '');
    const lowerMessage = message.toLowerCase();
    
    // Basic commit type detection based on message content
    let type = 'unknown';
    let confidence = 0.5;
    let subtype = null;
    
    // Check for common commit message prefixes
    if (commit.title.match(/^feat(\(.*\))?:/i)) {
      type = 'feature';
      confidence = 0.9;
      subtype = commit.title.match(/^feat\((.*)\):/i)?.[1] || null;
    } else if (commit.title.match(/^fix(\(.*\))?:/i)) {
      type = 'bugfix';
      confidence = 0.9;
      subtype = commit.title.match(/^fix\((.*)\):/i)?.[1] || null;
    } else if (commit.title.match(/^docs(\(.*\))?:/i)) {
      type = 'documentation';
      confidence = 0.9;
      subtype = commit.title.match(/^docs\((.*)\):/i)?.[1] || null;
    } else if (commit.title.match(/^style(\(.*\))?:/i)) {
      type = 'style';
      confidence = 0.9;
      subtype = commit.title.match(/^style\((.*)\):/i)?.[1] || null;
    } else if (commit.title.match(/^refactor(\(.*\))?:/i)) {
      type = 'refactor';
      confidence = 0.9;
      subtype = commit.title.match(/^refactor\((.*)\):/i)?.[1] || null;
    } else if (commit.title.match(/^perf(\(.*\))?:/i)) {
      type = 'performance';
      confidence = 0.9;
      subtype = commit.title.match(/^perf\((.*)\):/i)?.[1] || null;
    } else if (commit.title.match(/^test(\(.*\))?:/i)) {
      type = 'test';
      confidence = 0.9;
      subtype = commit.title.match(/^test\((.*)\):/i)?.[1] || null;
    } else if (commit.title.match(/^build(\(.*\))?:/i)) {
      type = 'build';
      confidence = 0.9;
      subtype = commit.title.match(/^build\((.*)\):/i)?.[1] || null;
    } else if (commit.title.match(/^chore(\(.*\))?:/i)) {
      type = 'chore';
      confidence = 0.9;
      subtype = commit.title.match(/^chore\((.*)\):/i)?.[1] || null;
    } else if (commit.title.match(/^ci(\(.*\))?:/i)) {
      type = 'ci';
      confidence = 0.9;
      subtype = commit.title.match(/^ci\((.*)\):/i)?.[1] || null;
    } else if (commit.title.match(/^revert(\(.*\))?:/i)) {
      type = 'revert';
      confidence = 0.9;
      subtype = commit.title.match(/^revert\((.*)\):/i)?.[1] || null;
    } else if (lowerMessage.includes('fix') || lowerMessage.includes('bug') || lowerMessage.includes('issue')) {
      type = 'bugfix';
      confidence = 0.7;
    } else if (lowerMessage.includes('feature') || lowerMessage.includes('add ') || lowerMessage.includes('new ')) {
      type = 'feature';
      confidence = 0.6;
    } else if (lowerMessage.includes('refactor') || lowerMessage.includes('restructure') || lowerMessage.includes('reorganize')) {
      type = 'refactor';
      confidence = 0.7;
    } else if (lowerMessage.includes('doc') || lowerMessage.includes('readme') || lowerMessage.includes('comment')) {
      type = 'documentation';
      confidence = 0.7;
    } else if (lowerMessage.includes('test') || lowerMessage.includes('spec')) {
      type = 'test';
      confidence = 0.7;
    } else if (lowerMessage.includes('style') || lowerMessage.includes('format') || lowerMessage.includes('lint')) {
      type = 'style';
      confidence = 0.7;
    } else if (lowerMessage.includes('merge')) {
      type = 'merge';
      confidence = 0.8;
    } else if (commit.parents && commit.parents.length > 1) {
      type = 'merge';
      confidence = 0.9;
    }
    
    return {
      type,
      subtype,
      confidence,
      message: message.split('\n')[0]
    };
  }
  
  /**
   * Compute language distribution for a commit
   * @param {Object} commit - Commit to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Promise<Object>} Language distribution metrics
   */
  async computeLanguageDistribution(commit, context, config) {
    this.log('debug', `Computing language distribution for commit ${commit.hash} (${commit.title})`);
    
    // In a real implementation, you would analyze the file paths and content
    // to determine language distribution. Here we'll use a simplified approach.
    
    // Default empty response when we don't have enough data
    if (!commit.diff) {
      return {
        languages: {},
        primary_language: null
      };
    }
    
    // Parse file paths from the diff (simplified)
    const languages = {};
    const files = [];
    
    // In a real implementation, you would parse the diff to extract file paths
    // and then determine languages based on file extensions
    
    // For now, we'll return a placeholder
    return {
      languages: {},
      primary_language: null,
      files_by_language: {}
    };
  }
  
  /**
   * Compute file changes for a commit
   * @param {Object} commit - Commit to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Object} File changes metrics
   */
  computeFileChanges(commit, context, config) {
    this.log('debug', `Computing file changes for commit ${commit.hash} (${commit.title})`);
    
    // Default values if data is missing
    const additions = commit.stats_additions || 0;
    const deletions = commit.stats_deletions || 0;
    const totalChanges = additions + deletions;
    const filesChanged = commit.files_changed || 0;
    
    // Calculate change density (changes per file)
    const changeDensity = filesChanged > 0 ? totalChanges / filesChanged : 0;
    
    return {
      files_changed: filesChanged,
      additions,
      deletions,
      total_changes: totalChanges,
      change_density: parseFloat(changeDensity.toFixed(2)),
      is_large_change: totalChanges > 500
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