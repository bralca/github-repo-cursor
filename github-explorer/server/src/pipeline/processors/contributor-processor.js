import { BaseStage } from '../core/base-stage.js';
import { logger } from '../../utils/logger.js';

/**
 * ContributorProcessorStage - Processes contributor data to compute various statistics and metrics
 * 
 * This processor analyzes contributors to compute statistics like impact score,
 * role classification, language preferences, activity metrics, and repository relationships.
 */
export class ContributorProcessorStage extends BaseStage {
  /**
   * Create a new contributor processor stage
   * @param {Object} options - Processor options
   */
  constructor(options = {}) {
    super({
      name: 'contributor-processor',
      abortOnError: false,
      config: {
        computeImpactScore: true,
        computeRoleClassification: true,
        computeLanguagePreferences: true,
        computeActivityMetrics: true,
        computeRepositoryRelationships: true,
        timeframeInDays: 90, // Default timeframe for historical metrics
        ...options.config
      }
    });
    
    this.githubClient = options.githubClient;
    this.contributorService = options.contributorService;
  }
  
  /**
   * Execute the contributor processing
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} pipelineConfig - Pipeline configuration
   * @returns {Promise<PipelineContext>} Updated pipeline context
   */
  async execute(context, pipelineConfig) {
    this.log('info', 'Starting contributor processing');
    
    // Validate that we have contributors to process
    this.validateContext(context, ['contributors']);
    
    if (context.contributors.length === 0) {
      this.log('info', 'No contributors to process, skipping');
      return context;
    }
    
    const config = { ...this.config, ...pipelineConfig };
    
    try {
      this.log('info', `Processing ${context.contributors.length} contributors`);
      
      // Initialize contributor statistics in context if not exists
      if (!context.contributorStatistics) {
        context.contributorStatistics = {};
      }
      
      // Process each contributor to compute statistics
      for (const contributor of context.contributors) {
        // Skip if contributor is missing an ID
        if (!contributor.id) {
          this.log('warn', 'Skipping contributor without ID');
          continue;
        }
        
        // Create a stats object for this contributor
        const contributorStats = {
          contributor_id: contributor.id,
          contributor_username: contributor.username || contributor.login,
          computed_at: new Date().toISOString(),
        };
        
        // Compute impact score if enabled
        if (config.computeImpactScore) {
          contributorStats.impact_score = await this.computeImpactScore(contributor, context, config);
        }
        
        // Compute role classification if enabled
        if (config.computeRoleClassification) {
          contributorStats.role_classification = await this.computeRoleClassification(contributor, context, config);
        }
        
        // Compute language preferences if enabled
        if (config.computeLanguagePreferences) {
          contributorStats.language_preferences = await this.computeLanguagePreferences(contributor, context, config);
        }
        
        // Compute activity metrics if enabled
        if (config.computeActivityMetrics) {
          contributorStats.activity_metrics = await this.computeActivityMetrics(contributor, context, config);
        }
        
        // Compute repository relationships if enabled
        if (config.computeRepositoryRelationships) {
          contributorStats.repository_relationships = await this.computeRepositoryRelationships(contributor, context, config);
        }
        
        // Store statistics in context
        context.contributorStatistics[contributor.id] = contributorStats;
        
        // Update contributor with impact score
        contributor.impact_score = contributorStats.impact_score?.overall_score || 0;
        contributor.role_classification = contributorStats.role_classification?.primary_role || null;
        contributor.top_languages = contributorStats.language_preferences?.top_languages || [];
      }
      
      return context;
    } catch (error) {
      this.log('error', `Error processing contributors: ${error.message}`, { error });
      context.recordError('contributor-processor', error);
      return context;
    }
  }
  
  /**
   * Validate that required data is present in the context
   * @param {PipelineContext} context - Pipeline context
   * @param {Array<string>} requiredKeys - Keys that must be present in context
   * @throws {Error} If required data is missing
   */
  validateContext(context, requiredKeys) {
    for (const key of requiredKeys) {
      if (!context[key]) {
        throw new Error(`Missing required context data: ${key}`);
      }
    }
  }
  
  /**
   * Compute impact score for a contributor
   * @param {Object} contributor - Contributor to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Promise<Object>} Impact score metrics
   */
  async computeImpactScore(contributor, context, config) {
    this.log('debug', `Computing impact score for contributor ${contributor.username || contributor.id}`);
    
    // In a real implementation, we would calculate a sophisticated impact score
    // based on multiple factors: commit frequency, PR quality, code reviews, etc.
    
    // Find contributor's commits
    const contributorCommits = context.commits?.filter(commit => 
      commit.author_id === contributor.id || commit.author === contributor.username || commit.author === contributor.login
    ) || [];
    
    // Find contributor's merge requests
    const contributorMRs = context.mergeRequests?.filter(mr => 
      mr.author_id === contributor.id || mr.author === contributor.username || mr.author === contributor.login
    ) || [];
    
    // Find contributor-repository relationships
    const repoRelationships = context.repoContributors?.filter(rc => 
      rc.contributor_id === contributor.id
    ) || [];
    
    // Calculate code contribution score based on commits and lines of code
    let codeScore = 0;
    let totalAdditions = 0;
    let totalDeletions = 0;
    
    contributorCommits.forEach(commit => {
      totalAdditions += commit.stats_additions || 0;
      totalDeletions += commit.stats_deletions || 0;
    });
    
    // More lines of code = higher score, but with diminishing returns
    codeScore = Math.min(50, Math.log(totalAdditions + totalDeletions + 1) * 5);
    
    // Calculate collaboration score based on PRs and reviews
    let collaborationScore = Math.min(25, contributorMRs.length * 3);
    
    // Calculate consistency score based on contribution frequency
    let consistencyScore = 0;
    
    if (contributorCommits.length > 0) {
      // Simple calculation based on number of commits relative to timeframe
      consistencyScore = Math.min(25, contributorCommits.length / config.timeframeInDays * 30);
    }
    
    // Calculate overall impact score (0-100)
    const overallScore = Math.round(codeScore + collaborationScore + consistencyScore);
    
    return {
      overall_score: overallScore,
      code_contribution_score: Math.round(codeScore),
      collaboration_score: Math.round(collaborationScore),
      consistency_score: Math.round(consistencyScore),
      total_commits: contributorCommits.length,
      total_pull_requests: contributorMRs.length,
      total_repositories: repoRelationships.length,
      lines_added: totalAdditions,
      lines_deleted: totalDeletions
    };
  }
  
  /**
   * Compute role classification for a contributor
   * @param {Object} contributor - Contributor to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Promise<Object>} Role classification
   */
  async computeRoleClassification(contributor, context, config) {
    this.log('debug', `Computing role classification for contributor ${contributor.username || contributor.id}`);
    
    // In a real implementation, we would analyze:
    // 1. Languages used in commits
    // 2. Files modified (frontend, backend, etc.)
    // 3. Commit message patterns
    // 4. Issue/PR areas of focus
    
    // Get contributor's commits
    const contributorCommits = context.commits?.filter(commit => 
      commit.author_id === contributor.id || commit.author === contributor.username || commit.author === contributor.login
    ) || [];
    
    // Get language preferences (simulated)
    const languagePrefs = await this.computeLanguagePreferences(contributor, context, config);
    const topLanguages = languagePrefs.top_languages || [];
    const totalLanguagesCount = languagePrefs.total_languages || 0;
    
    // Determine primary role based on top languages (simplified approach)
    let primaryRole = 'Unknown';
    let roleConfidence = 0;
    
    const frontendLanguages = ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'React', 'Vue', 'Angular'];
    const backendLanguages = ['Python', 'Java', 'Go', 'Ruby', 'PHP', 'C#', 'C++', 'Rust'];
    const dataLanguages = ['Python', 'R', 'SQL', 'Jupyter Notebook'];
    const devopsLanguages = ['YAML', 'Shell', 'Dockerfile', 'Terraform', 'HCL'];
    
    // Count languages by category
    let frontendCount = 0;
    let backendCount = 0;
    let dataCount = 0;
    let devopsCount = 0;
    
    topLanguages.forEach(lang => {
      if (frontendLanguages.includes(lang)) frontendCount++;
      if (backendLanguages.includes(lang)) backendCount++;
      if (dataLanguages.includes(lang)) dataCount++;
      if (devopsLanguages.includes(lang)) devopsCount++;
    });
    
    // Determine primary role based on language distribution
    const counts = [
      { role: 'Frontend Developer', count: frontendCount },
      { role: 'Backend Developer', count: backendCount },
      { role: 'Data Scientist', count: dataCount },
      { role: 'DevOps Engineer', count: devopsCount }
    ];
    
    // Sort by count in descending order
    counts.sort((a, b) => b.count - a.count);
    
    if (counts[0].count > 0) {
      primaryRole = counts[0].role;
      
      // Calculate confidence based on how dominant the primary role is
      const totalCount = counts.reduce((sum, item) => sum + item.count, 0);
      roleConfidence = totalCount > 0 ? Math.round((counts[0].count / totalCount) * 100) : 0;
      
      // If two top roles have similar counts, classify as full-stack or mixed role
      if (counts[1].count > 0 && counts[0].count - counts[1].count <= 1) {
        if (counts[0].role === 'Frontend Developer' && counts[1].role === 'Backend Developer') {
          primaryRole = 'Full-Stack Developer';
        } else {
          primaryRole = 'Cross-Functional Developer';
        }
      }
    }
    
    // If we don't have enough data, fallback to generic role
    if (totalLanguagesCount === 0 || roleConfidence < 30) {
      primaryRole = 'Software Developer';
      roleConfidence = Math.min(60, contributorCommits.length);
    }
    
    return {
      primary_role: primaryRole,
      confidence: roleConfidence,
      role_distribution: {
        frontend: frontendCount,
        backend: backendCount,
        data: dataCount,
        devops: devopsCount
      },
      secondary_roles: counts.slice(1, 3).map(c => c.role).filter(r => counts.find(c => c.role === r).count > 0)
    };
  }
  
  /**
   * Compute language preferences for a contributor
   * @param {Object} contributor - Contributor to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Promise<Object>} Language preferences
   */
  async computeLanguagePreferences(contributor, context, config) {
    this.log('debug', `Computing language preferences for contributor ${contributor.username || contributor.id}`);
    
    // In a real implementation, we would:
    // 1. Analyze commits by language
    // 2. Weigh languages by lines of code contributed
    // 3. Consider recency of contributions
    
    // Get contributor's commits
    const contributorCommits = context.commits?.filter(commit => 
      commit.author_id === contributor.id || commit.author === contributor.username || commit.author === contributor.login
    ) || [];
    
    // Get repositories the contributor contributed to
    const contributedRepoIds = Array.from(new Set(contributorCommits.map(commit => commit.repository_id)));
    const contributedRepos = context.repositories?.filter(repo => contributedRepoIds.includes(repo.id)) || [];
    
    // This is a simplified approach - in reality we would analyze file extensions in commits
    // Get languages from the repositories they contributed to
    const languageCounts = {};
    
    contributedRepos.forEach(repo => {
      const primaryLanguage = repo.language || repo.primary_language;
      if (primaryLanguage) {
        languageCounts[primaryLanguage] = (languageCounts[primaryLanguage] || 0) + 1;
      }
    });
    
    // Get contributor-repository relationships for more data
    const repoRelationships = context.repoContributors?.filter(rc => 
      rc.contributor_id === contributor.id
    ) || [];
    
    // Calculate total commits across all relationships
    const totalCommits = repoRelationships.reduce((sum, rel) => sum + (rel.commit_count || 0), 0);
    
    // If we have GitHub API access and no data from context, we could fetch it here
    if (this.githubClient && Object.keys(languageCounts).length === 0) {
      // In a real implementation, fetch from GitHub API
      // For now, simulate with mock data
      languageCounts['JavaScript'] = 5;
      languageCounts['TypeScript'] = 3;
      languageCounts['HTML'] = 2;
      languageCounts['CSS'] = 2;
    }
    
    // Sort languages by count (descending)
    const sortedLanguages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([language]) => language);
    
    // Select top languages (maximum 5)
    const topLanguages = sortedLanguages.slice(0, 5);
    
    // Calculate percentages
    const totalCount = Object.values(languageCounts).reduce((sum, count) => sum + count, 0);
    const percentages = {};
    
    if (totalCount > 0) {
      Object.entries(languageCounts).forEach(([language, count]) => {
        percentages[language] = Math.round((count / totalCount) * 100);
      });
    }
    
    return {
      top_languages: topLanguages,
      language_percentages: percentages,
      total_languages: Object.keys(languageCounts).length,
      primary_language: topLanguages[0] || null
    };
  }
  
  /**
   * Compute activity metrics for a contributor
   * @param {Object} contributor - Contributor to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Promise<Object>} Activity metrics
   */
  async computeActivityMetrics(contributor, context, config) {
    this.log('debug', `Computing activity metrics for contributor ${contributor.username || contributor.id}`);
    
    // In a real implementation, we would analyze:
    // 1. Contribution frequency over time
    // 2. Active times of day/week
    // 3. Response times to issues/PRs
    // 4. Consistency of contributions
    
    // Get contributor's commits
    const contributorCommits = context.commits?.filter(commit => 
      commit.author_id === contributor.id || commit.author === contributor.username || commit.author === contributor.login
    ) || [];
    
    // Get contributor's merge requests
    const contributorMRs = context.mergeRequests?.filter(mr => 
      mr.author_id === contributor.id || mr.author === contributor.username || mr.author === contributor.login
    ) || [];
    
    // Find all commit timestamps
    const commitDates = contributorCommits
      .map(commit => commit.committed_at || commit.authored_at || commit.created_at)
      .filter(date => date)
      .map(date => new Date(date));
    
    // Find all PR timestamps
    const prDates = contributorMRs
      .map(mr => mr.created_at)
      .filter(date => date)
      .map(date => new Date(date));
    
    // Combine all activity timestamps
    const allDates = [...commitDates, ...prDates].sort((a, b) => a - b);
    
    // Calculate activity metrics
    const now = new Date();
    const timeframeCutoff = new Date(now);
    timeframeCutoff.setDate(now.getDate() - config.timeframeInDays);
    
    // Filter to only include activity within the timeframe
    const recentDates = allDates.filter(date => date >= timeframeCutoff);
    
    // Calculate first and last contribution dates
    const firstContribution = allDates.length > 0 ? allDates[0] : null;
    const lastContribution = allDates.length > 0 ? allDates[allDates.length - 1] : null;
    
    // Calculate activity streak (consecutive days with contributions)
    let currentStreak = 0;
    let longestStreak = 0;
    
    if (recentDates.length > 0) {
      // Create a map of dates with activity
      const activeDatesMap = new Map();
      
      recentDates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        activeDatesMap.set(dateStr, true);
      });
      
      // Calculate current streak
      let checkDate = new Date(now);
      checkDate.setHours(0, 0, 0, 0);
      
      // Go back one day at a time and count consecutive days with activity
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        
        if (activeDatesMap.has(dateStr)) {
          currentStreak++;
          
          // Move to previous day
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      // Calculate longest streak (simplification - would need more data for accurate calculation)
      longestStreak = Math.max(currentStreak, Math.ceil(recentDates.length / 3)); // Simplified approximation
    }
    
    // Calculate activity by day of week
    const activityByDayOfWeek = {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0
    };
    
    recentDates.forEach(date => {
      const dayOfWeek = date.getDay();
      switch (dayOfWeek) {
        case 0: activityByDayOfWeek.sunday++; break;
        case 1: activityByDayOfWeek.monday++; break;
        case 2: activityByDayOfWeek.tuesday++; break;
        case 3: activityByDayOfWeek.wednesday++; break;
        case 4: activityByDayOfWeek.thursday++; break;
        case 5: activityByDayOfWeek.friday++; break;
        case 6: activityByDayOfWeek.saturday++; break;
      }
    });
    
    // Determine activity trend
    let activityTrend = 'stable';
    
    if (recentDates.length > 0) {
      const halfwayPoint = Math.floor(config.timeframeInDays / 2);
      const halfwayDate = new Date(now);
      halfwayDate.setDate(now.getDate() - halfwayPoint);
      
      const recentHalfCount = recentDates.filter(date => date >= halfwayDate).length;
      const olderHalfCount = recentDates.filter(date => date < halfwayDate).length;
      
      if (recentHalfCount > olderHalfCount * 1.5) {
        activityTrend = 'increasing';
      } else if (olderHalfCount > recentHalfCount * 1.5) {
        activityTrend = 'decreasing';
      }
    }
    
    return {
      total_contributions: allDates.length,
      recent_contributions: recentDates.length,
      first_contribution: firstContribution ? firstContribution.toISOString() : null,
      last_contribution: lastContribution ? lastContribution.toISOString() : null,
      contribution_timespan_days: firstContribution && lastContribution ? 
        Math.ceil((lastContribution - firstContribution) / (1000 * 60 * 60 * 24)) : 0,
      average_weekly_contributions: config.timeframeInDays > 0 ? 
        (recentDates.length / config.timeframeInDays) * 7 : 0,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      activity_by_day_of_week: activityByDayOfWeek,
      activity_trend: activityTrend,
      timeframe_days: config.timeframeInDays
    };
  }
  
  /**
   * Compute repository relationships for a contributor
   * @param {Object} contributor - Contributor to analyze
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Promise<Object>} Repository relationship metrics
   */
  async computeRepositoryRelationships(contributor, context, config) {
    this.log('debug', `Computing repository relationships for contributor ${contributor.username || contributor.id}`);
    
    // Get contributor-repository relationships
    const repoRelationships = context.repoContributors?.filter(rc => 
      rc.contributor_id === contributor.id
    ) || [];
    
    // Get all repositories the contributor has worked on
    const contributedRepoIds = repoRelationships.map(rel => rel.repository_id);
    const contributedRepos = context.repositories?.filter(repo => 
      contributedRepoIds.includes(repo.id)
    ) || [];
    
    // Calculate primary repositories (most contributions)
    const reposByContributions = [...repoRelationships].sort((a, b) => {
      return (b.commit_count || 0) - (a.commit_count || 0);
    });
    
    // Get top repositories (max 5)
    const topRepos = reposByContributions.slice(0, 5);
    
    // Calculate focus repositories (most recent contributions)
    const reposByRecency = [...repoRelationships].sort((a, b) => {
      const dateA = a.last_contribution_at ? new Date(a.last_contribution_at) : new Date(0);
      const dateB = b.last_contribution_at ? new Date(b.last_contribution_at) : new Date(0);
      return dateB - dateA;
    });
    
    // Get most recent repositories (max 3)
    const recentRepos = reposByRecency.slice(0, 3);
    
    // Calculate total contributions across all repositories
    const totalCommits = repoRelationships.reduce((sum, rel) => sum + (rel.commit_count || 0), 0);
    const totalPRs = repoRelationships.reduce((sum, rel) => sum + (rel.pull_request_count || 0), 0);
    
    // Calculate contribution distribution across repositories
    const contributionDistribution = {};
    
    if (totalCommits > 0) {
      repoRelationships.forEach(rel => {
        const repoId = rel.repository_id;
        const repo = contributedRepos.find(r => r.id === repoId);
        const repoName = repo ? repo.full_name || repo.name : `Repository ${repoId}`;
        
        contributionDistribution[repoName] = {
          repository_id: repoId,
          contribution_percentage: Math.round(((rel.commit_count || 0) / totalCommits) * 100),
          commit_count: rel.commit_count || 0,
          pull_request_count: rel.pull_request_count || 0
        };
      });
    }
    
    return {
      total_repositories: repoRelationships.length,
      primary_repository: topRepos.length > 0 ? topRepos[0].repository_id : null,
      primary_repository_name: topRepos.length > 0 && contributedRepos.length > 0 ?
        (contributedRepos.find(r => r.id === topRepos[0].repository_id)?.full_name || 
         contributedRepos.find(r => r.id === topRepos[0].repository_id)?.name) : null,
      recent_repositories: recentRepos.map(rel => rel.repository_id),
      total_commits_across_repos: totalCommits,
      total_pull_requests_across_repos: totalPRs,
      contribution_distribution: contributionDistribution
    };
  }
} 