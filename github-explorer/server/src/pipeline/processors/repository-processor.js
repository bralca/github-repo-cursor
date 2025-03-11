import { BaseStage } from '../core/base-stage.js';
import { logger } from '../../utils/logger.js';

/**
 * RepositoryProcessorStage - Processes repository data to compute various statistics like commit frequency, star history, fork statistics, etc.
 * 
 * This processor analyzes repositories to compute statistics like commit frequency,
 * star history, fork statistics, contributor count, and language breakdown.
 */
export class RepositoryProcessorStage extends BaseStage {
  /**
   * Create a new repository processor stage
   * @param {Object} options - Processor options
   */
  constructor(options = {}) {
    super({
      name: 'repository-processor',
      abortOnError: false,
      config: {
        computeCommitFrequency: true,
        computeStarHistory: true,
        computeForkStatistics: true,
        computeContributorCounts: true,
        computeLanguageBreakdown: true,
        timeframeInDays: 30, // Default timeframe for historical metrics
        ...options.config
      }
    });
    
    this.githubClient = options.githubClient;
    this.repositoryService = options.repositoryService;
  }
  
  /**
   * Execute the repository processing
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} pipelineConfig - Pipeline configuration
   * @returns {Promise<PipelineContext>} Updated pipeline context
   */
  async execute(context, pipelineConfig) {
    this.log('info', 'Starting repository processing');
    
    // Validate that we have repositories to process
    this.validateContext(context, ['repositories']);
    
    if (context.repositories.length === 0) {
      this.log('info', 'No repositories to process, skipping');
      return context;
    }
    
    const config = { ...this.config, ...pipelineConfig };
    
    try {
      this.log('info', `Processing ${context.repositories.length} repositories`);
      
      // Initialize repository statistics in context if not exists
      if (!context.repositoryStatistics) {
        context.repositoryStatistics = {};
      }
      
      // Process each repository to compute statistics
      for (const repository of context.repositories) {
        // Skip if repository is missing an ID
        if (!repository.id) {
          this.log('warn', 'Skipping repository without ID');
          continue;
        }
        
        // Create a stats object for this repository
        const repoStats = {
          repository_id: repository.id,
          repository_name: repository.full_name,
          computed_at: new Date().toISOString(),
        };
        
        // Compute commit frequency if enabled
        if (config.computeCommitFrequency) {
          repoStats.commit_frequency = await this.computeCommitFrequency(repository, context, config);
        }
        
        // Compute star history if enabled
        if (config.computeStarHistory) {
          repoStats.star_history = await this.computeStarHistory(repository, context, config);
        }
        
        // Compute fork statistics if enabled
        if (config.computeForkStatistics) {
          repoStats.fork_statistics = await this.computeForkStatistics(repository, context, config);
        }
        
        // Compute contributor counts if enabled
        if (config.computeContributorCounts) {
          repoStats.contributor_counts = await this.computeContributorCounts(repository, context, config);
        }
        
        // Compute language breakdown if enabled
        if (config.computeLanguageBreakdown) {
          repoStats.language_breakdown = await this.computeLanguageBreakdown(repository, context, config);
        }
        
        // Calculate overall health score
        repoStats.health_score = this.calculateHealthScore(repoStats);
        
        // Store statistics in context
        context.repositoryStatistics[repository.id] = repoStats;
        
        // Update repository with health score
        repository.health_score = repoStats.health_score;
      }
      
      this.log('info', 'Repository processing completed');
      
      return context;
    } catch (error) {
      this.log('error', 'Repository processing failed', { error });
      context.recordError('repository-processor', error);
      if (this.config.abortOnError) {
        throw error;
      }
      return context;
    }
  }
  
  /**
   * Compute commit frequency for a repository
   * @param {Object} repository - Repository to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Promise<Object>} Commit frequency statistics
   */
  async computeCommitFrequency(repository, context, config) {
    this.log('debug', `Computing commit frequency for repository ${repository.full_name}`);
    
    // Get all commits for this repository from context
    const repoCommits = context.commits?.filter(commit => 
      commit.repository_id === repository.id
    ) || [];
    
    if (repoCommits.length === 0 && this.githubClient) {
      // If no commits in context and GitHub client available, fetch from API
      try {
        // In a real implementation, this would fetch commits from GitHub API
        // For now, we'll just simulate the data
        this.log('debug', `No commits in context, would fetch from GitHub API`);
        
        // Return simulated commit frequency data
        return {
          daily_average: 3.2,
          weekly_average: 22.5,
          monthly_average: 97.3,
          by_weekday: {
            monday: 25,
            tuesday: 32,
            wednesday: 28,
            thursday: 35,
            friday: 22,
            saturday: 10,
            sunday: 8
          },
          by_hour: {
            // Distribution of commits by hour (0-23)
            // This would be populated with real data in production
            // Here we're just simulating some data
            '9': 18,
            '10': 22,
            '11': 25,
            '12': 15,
            '13': 10,
            '14': 28,
            '15': 32,
            '16': 30,
            '17': 20,
            '18': 15,
            '19': 10,
            '20': 5
          },
          trend: 'increasing' // could be 'increasing', 'decreasing', or 'stable'
        };
      } catch (error) {
        this.log('warn', `Failed to fetch commits for ${repository.full_name}`, { error });
        return null;
      }
    }
    
    // Group commits by date
    const commitsByDate = {};
    const now = new Date();
    const timeframeCutoff = new Date(now);
    timeframeCutoff.setDate(now.getDate() - config.timeframeInDays);
    
    // Only analyze commits within the configured timeframe
    const timeframeCommits = repoCommits.filter(commit => {
      const commitDate = new Date(commit.committed_at || commit.authored_at);
      return commitDate >= timeframeCutoff;
    });
    
    // Process commit data to generate frequency metrics
    // This would actually analyze the commits by date, weekday, hour, etc.
    // For now, we'll return simulated data based on the commit count
    
    return {
      daily_average: timeframeCommits.length / config.timeframeInDays,
      weekly_average: (timeframeCommits.length / config.timeframeInDays) * 7,
      monthly_average: (timeframeCommits.length / config.timeframeInDays) * 30,
      total_commits: timeframeCommits.length,
      timeframe_days: config.timeframeInDays,
      // In a real implementation, these would be calculated from the actual commits
      by_weekday: {
        monday: Math.floor(timeframeCommits.length * 0.18),
        tuesday: Math.floor(timeframeCommits.length * 0.2),
        wednesday: Math.floor(timeframeCommits.length * 0.22),
        thursday: Math.floor(timeframeCommits.length * 0.19),
        friday: Math.floor(timeframeCommits.length * 0.15),
        saturday: Math.floor(timeframeCommits.length * 0.03),
        sunday: Math.floor(timeframeCommits.length * 0.03)
      }
    };
  }
  
  /**
   * Compute star history for a repository
   * @param {Object} repository - Repository to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Promise<Object>} Star history statistics
   */
  async computeStarHistory(repository, context, config) {
    this.log('debug', `Computing star history for repository ${repository.full_name}`);
    
    // In a real implementation, this would fetch star history from GitHub API
    // or from database if previously stored
    
    // For now, we'll simulate star history data
    const starCount = repository.stargazers_count || 0;
    const now = new Date();
    const timeframeStartDate = new Date(now);
    timeframeStartDate.setDate(now.getDate() - config.timeframeInDays);
    
    // Generate simulated star history data
    const starHistory = [];
    let currentStars = starCount;
    
    // Create a simulated history going backwards from current count
    for (let i = 0; i < config.timeframeInDays; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      
      // Randomly decrease stars as we go back in time (simple simulation)
      const decrease = Math.floor(Math.random() * 3); // 0-2 stars per day
      currentStars = Math.max(0, currentStars - decrease);
      
      starHistory.unshift({
        date: date.toISOString().split('T')[0],
        stars: currentStars
      });
    }
    
    return {
      current_stars: starCount,
      star_growth_rate: (starCount - starHistory[0].stars) / config.timeframeInDays,
      daily_average_new_stars: (starCount - starHistory[0].stars) / config.timeframeInDays,
      history: starHistory,
      timeframe_days: config.timeframeInDays
    };
  }
  
  /**
   * Compute fork statistics for a repository
   * @param {Object} repository - Repository to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Promise<Object>} Fork statistics
   */
  async computeForkStatistics(repository, context, config) {
    this.log('debug', `Computing fork statistics for repository ${repository.full_name}`);
    
    // In a real implementation, this would fetch fork data from GitHub API
    // For now, we'll simulate fork statistics
    
    const forkCount = repository.forks_count || 0;
    
    return {
      total_forks: forkCount,
      active_forks: Math.floor(forkCount * 0.7), // Simulated: 70% of forks active
      fork_to_star_ratio: repository.stargazers_count > 0 ? 
        forkCount / repository.stargazers_count : 0,
      // Simulated distribution of fork activity
      fork_activity: {
        high_activity: Math.floor(forkCount * 0.3),  // 30% high activity
        medium_activity: Math.floor(forkCount * 0.4), // 40% medium activity
        low_activity: Math.floor(forkCount * 0.3)     // 30% low activity
      }
    };
  }
  
  /**
   * Compute contributor counts for a repository
   * @param {Object} repository - Repository to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Promise<Object>} Contributor statistics
   */
  async computeContributorCounts(repository, context, config) {
    this.log('debug', `Computing contributor counts for repository ${repository.full_name}`);
    
    // Find contributor-repository relationships for this repository
    const repoContributors = context.repoContributors?.filter(rc => 
      rc.repository_id === repository.id
    ) || [];
    
    // Find all contributors for this repository
    const contributorIds = repoContributors.map(rc => rc.contributor_id);
    const contributors = context.contributors?.filter(c => 
      contributorIds.includes(c.id)
    ) || [];
    
    if (contributors.length === 0 && this.githubClient) {
      // If no contributors in context and GitHub client available, would fetch from API
      this.log('debug', `No contributors in context, would fetch from GitHub API`);
      
      // Return simulated contributor data
      return {
        total_contributors: 12,
        active_last_month: 8,
        core_contributors: 5,
        occasional_contributors: 7,
        new_contributors_last_month: 2,
        contributor_growth_trend: 'stable'
      };
    }
    
    // In a full implementation, we would analyze the contributors in detail
    // For now, return basic counts with some simulated data
    return {
      total_contributors: contributors.length,
      active_last_month: Math.floor(contributors.length * 0.7), // Simulated: 70% active
      core_contributors: Math.floor(contributors.length * 0.4), // Simulated: 40% core
      occasional_contributors: Math.floor(contributors.length * 0.6), // Simulated: 60% occasional
      new_contributors_last_month: Math.floor(contributors.length * 0.1) // Simulated: 10% new
    };
  }
  
  /**
   * Compute language breakdown for a repository
   * @param {Object} repository - Repository to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Promise<Object>} Language breakdown statistics
   */
  async computeLanguageBreakdown(repository, context, config) {
    this.log('debug', `Computing language breakdown for repository ${repository.full_name}`);
    
    // In a real implementation, this would fetch language data from GitHub API
    // For now, we'll simulate language breakdown based on the repository's primary language
    
    const primaryLanguage = repository.language || 'JavaScript';
    
    // Generate simulated language breakdown
    const languageBreakdown = {};
    
    // Set the primary language to a high percentage
    languageBreakdown[primaryLanguage] = 65;
    
    // Add some common secondary languages
    if (primaryLanguage === 'JavaScript') {
      languageBreakdown['HTML'] = 15;
      languageBreakdown['CSS'] = 12;
      languageBreakdown['TypeScript'] = 8;
    } else if (primaryLanguage === 'TypeScript') {
      languageBreakdown['JavaScript'] = 10;
      languageBreakdown['HTML'] = 12;
      languageBreakdown['CSS'] = 10;
      languageBreakdown['JSON'] = 3;
    } else if (primaryLanguage === 'Python') {
      languageBreakdown['JavaScript'] = 10;
      languageBreakdown['HTML'] = 8;
      languageBreakdown['CSS'] = 6;
      languageBreakdown['Jupyter Notebook'] = 11;
    } else {
      // Generic fallback for other languages
      languageBreakdown['HTML'] = 12;
      languageBreakdown['CSS'] = 8;
      languageBreakdown['JavaScript'] = 15;
    }
    
    return {
      primary_language: primaryLanguage,
      language_percentages: languageBreakdown,
      total_languages: Object.keys(languageBreakdown).length
    };
  }
  
  /**
   * Calculate an overall health score for the repository
   * @param {Object} repoStats - Repository statistics
   * @returns {number} Health score (0-100)
   */
  calculateHealthScore(repoStats) {
    // In a real implementation, this would use a weighted algorithm
    // that considers various metrics like:
    // - Commit frequency (regular commits indicate active development)
    // - Star growth (increasing interest from the community)
    // - Fork activity (engagement from developers)
    // - Contributor diversity (healthy community)
    // - Issue response time (maintenance)
    // - PR merge velocity (openness to contributions)
    
    // For now, implement a simple scoring system
    let score = 50; // Start with a neutral score
    
    // Add points for commit frequency
    if (repoStats.commit_frequency) {
      // More regular commits = better score
      if (repoStats.commit_frequency.daily_average > 3) score += 15;
      else if (repoStats.commit_frequency.daily_average > 1) score += 10;
      else if (repoStats.commit_frequency.daily_average > 0.5) score += 5;
    }
    
    // Add points for star activity
    if (repoStats.star_history) {
      // Growing stars = better score
      if (repoStats.star_history.daily_average_new_stars > 5) score += 15;
      else if (repoStats.star_history.daily_average_new_stars > 1) score += 10;
      else if (repoStats.star_history.daily_average_new_stars > 0.1) score += 5;
    }
    
    // Add points for contributor diversity
    if (repoStats.contributor_counts) {
      // More contributors = better score
      if (repoStats.contributor_counts.total_contributors > 20) score += 15;
      else if (repoStats.contributor_counts.total_contributors > 10) score += 10;
      else if (repoStats.contributor_counts.total_contributors > 5) score += 5;
    }
    
    // Add points for language diversity
    if (repoStats.language_breakdown) {
      // More languages can indicate a more complex/complete project
      if (repoStats.language_breakdown.total_languages > 5) score += 5;
      else if (repoStats.language_breakdown.total_languages > 3) score += 3;
    }
    
    // Ensure the score is within 0-100 range
    return Math.min(100, Math.max(0, score));
  }
} 