import { BaseStage } from '../core/base-stage.js';
import { logger } from '../../utils/logger.js';

/**
 * ContributorRepositoryProcessor - Processes and updates relationships between contributors and repositories
 * 
 * This processor analyzes contributor and repository data to:
 * 1. Establish and update relationships between contributors and repositories
 * 2. Calculate contribution statistics like commit counts, additions, deletions
 * 3. Track historical contribution data
 */
export class ContributorRepositoryProcessor extends BaseStage {
  /**
   * Create a new contributor-repository processor
   * @param {Object} options - Processor options
   */
  constructor(options = {}) {
    super({
      name: 'contributor-repository-processor',
      abortOnError: false,
      config: {
        updateExistingRelationships: true,
        calculateCommitStats: true,
        calculateMergeRequestStats: true,
        calculateCodeStats: true,
        batchSize: 50,
        ...options.config
      }
    });
    
    this.contributorService = options.contributorService;
    this.repositoryService = options.repositoryService;
  }
  
  /**
   * Execute the contributor-repository relationship processing
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} pipelineConfig - Pipeline configuration
   * @returns {Promise<PipelineContext>} Updated pipeline context
   */
  async execute(context, pipelineConfig) {
    this.log('info', 'Starting contributor-repository relationship processing');
    
    // Validate that we have the required data
    this.validateContext(context, ['contributors', 'repositories']);
    
    if (context.contributors.length === 0 || context.repositories.length === 0) {
      this.log('info', 'No contributors or repositories to process, skipping');
      return context;
    }
    
    // Initialize relationships in context if not exists
    if (!context.relationships) {
      context.relationships = {
        contributorRepository: []
      };
    }
    
    const config = { ...this.config, ...pipelineConfig };
    
    try {
      this.log('info', `Processing relationships for ${context.contributors.length} contributors and ${context.repositories.length} repositories`);
      
      // Extract existing relationships if available
      const existingRelationships = context.repoContributors || [];
      
      // Process commits to identify contributor-repository relationships
      if (context.commits && context.commits.length > 0) {
        await this.processCommitsForRelationships(
          context.commits, 
          existingRelationships,
          context,
          config
        );
      }
      
      // Process merge requests to identify contributor-repository relationships
      if (context.mergeRequests && context.mergeRequests.length > 0) {
        await this.processMergeRequestsForRelationships(
          context.mergeRequests,
          existingRelationships,
          context,
          config
        );
      }
      
      // Deduplicate relationships
      if (context.relationships.contributorRepository.length > 0) {
        context.relationships.contributorRepository = this.deduplicateRelationships(
          context.relationships.contributorRepository
        );
        
        this.log('info', `Created/updated ${context.relationships.contributorRepository.length} contributor-repository relationships`);
      }
      
      this.log('info', 'Contributor-repository relationship processing completed');
      
      return context;
    } catch (error) {
      this.log('error', 'Contributor-repository relationship processing failed', { error });
      context.recordError('contributor-repository-processor', error);
      if (this.config.abortOnError) {
        throw error;
      }
      return context;
    }
  }
  
  /**
   * Process commits to identify and update contributor-repository relationships
   * @param {Array<Object>} commits - Commit data
   * @param {Array<Object>} existingRelationships - Existing relationship data
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Promise<void>}
   */
  async processCommitsForRelationships(commits, existingRelationships, context, config) {
    this.log('debug', `Processing ${commits.length} commits for contributor-repository relationships`);
    
    // Group commits by repository and contributor
    const groupedCommits = this.groupCommitsByRepoAndContributor(commits);
    
    // Process each group to create/update relationships
    for (const [repoId, contributors] of Object.entries(groupedCommits)) {
      const repository = context.repositories.find(r => r.id === parseInt(repoId, 10) || r.id === repoId);
      
      if (!repository) {
        this.log('warn', `Repository with ID ${repoId} not found in context, skipping`);
        continue;
      }
      
      for (const [contributorId, commitData] of Object.entries(contributors)) {
        const contributor = context.contributors.find(c => c.id === parseInt(contributorId, 10) || c.id === contributorId);
        
        if (!contributor) {
          this.log('warn', `Contributor with ID ${contributorId} not found in context, skipping`);
          continue;
        }
        
        // Find existing relationship or create new one
        let relationship = existingRelationships.find(
          rel => rel.repository_id === repository.id && rel.contributor_id === contributor.id
        );
        
        if (!relationship) {
          relationship = {
            repository_id: repository.id,
            contributor_id: contributor.id,
            commit_count: 0,
            pull_request_count: 0,
            additions: 0,
            deletions: 0,
            contributions_count: 0,
            first_contribution_at: null,
            last_contribution_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        
        // Update commit statistics
        relationship.commit_count = (relationship.commit_count || 0) + commitData.count;
        
        // Update code statistics if enabled
        if (config.calculateCodeStats) {
          relationship.additions = (relationship.additions || 0) + commitData.additions;
          relationship.deletions = (relationship.deletions || 0) + commitData.deletions;
        }
        
        // Update overall contribution count
        relationship.contributions_count = (relationship.contributions_count || 0) + commitData.count;
        
        // Update contribution timestamps
        const commitDates = commitData.commits.map(c => new Date(c.created_at || c.committed_at || c.authored_at));
        if (commitDates.length > 0) {
          const latestCommitDate = new Date(Math.max(...commitDates)).toISOString();
          const earliestCommitDate = new Date(Math.min(...commitDates)).toISOString();
          
          if (!relationship.first_contribution_at || relationship.first_contribution_at > earliestCommitDate) {
            relationship.first_contribution_at = earliestCommitDate;
          }
          
          if (!relationship.last_contribution_at || relationship.last_contribution_at < latestCommitDate) {
            relationship.last_contribution_at = latestCommitDate;
          }
        }
        
        // Update the relationship in context
        context.relationships.contributorRepository.push(relationship);
      }
    }
  }
  
  /**
   * Process merge requests to identify and update contributor-repository relationships
   * @param {Array<Object>} mergeRequests - Merge request data
   * @param {Array<Object>} existingRelationships - Existing relationship data
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration options
   * @returns {Promise<void>}
   */
  async processMergeRequestsForRelationships(mergeRequests, existingRelationships, context, config) {
    this.log('debug', `Processing ${mergeRequests.length} merge requests for contributor-repository relationships`);
    
    // Group merge requests by repository and contributor
    const groupedMRs = this.groupMergeRequestsByRepoAndContributor(mergeRequests);
    
    // Process each group to create/update relationships
    for (const [repoId, contributors] of Object.entries(groupedMRs)) {
      const repository = context.repositories.find(r => r.id === parseInt(repoId, 10) || r.id === repoId);
      
      if (!repository) {
        this.log('warn', `Repository with ID ${repoId} not found in context, skipping`);
        continue;
      }
      
      for (const [contributorId, mrData] of Object.entries(contributors)) {
        const contributor = context.contributors.find(c => c.id === parseInt(contributorId, 10) || c.id === contributorId);
        
        if (!contributor) {
          this.log('warn', `Contributor with ID ${contributorId} not found in context, skipping`);
          continue;
        }
        
        // Find existing relationship or create new one
        let relationship = existingRelationships.find(
          rel => rel.repository_id === repository.id && rel.contributor_id === contributor.id
        );
        
        // Find relationship in context that may have been created during commit processing
        if (!relationship) {
          relationship = context.relationships.contributorRepository.find(
            rel => rel.repository_id === repository.id && rel.contributor_id === contributor.id
          );
        }
        
        if (!relationship) {
          relationship = {
            repository_id: repository.id,
            contributor_id: contributor.id,
            commit_count: 0,
            pull_request_count: 0,
            additions: 0,
            deletions: 0,
            contributions_count: 0,
            first_contribution_at: null,
            last_contribution_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        
        // Update merge request statistics
        relationship.pull_request_count = (relationship.pull_request_count || 0) + mrData.count;
        
        // Update code statistics if enabled and available in merge request data
        if (config.calculateCodeStats && config.calculateMergeRequestStats) {
          relationship.additions = (relationship.additions || 0) + mrData.additions;
          relationship.deletions = (relationship.deletions || 0) + mrData.deletions;
        }
        
        // Update overall contribution count
        relationship.contributions_count = (relationship.contributions_count || 0) + mrData.count;
        
        // Update contribution timestamps
        const mrDates = mrData.mergeRequests.map(mr => new Date(mr.created_at));
        if (mrDates.length > 0) {
          const latestMRDate = new Date(Math.max(...mrDates)).toISOString();
          const earliestMRDate = new Date(Math.min(...mrDates)).toISOString();
          
          if (!relationship.first_contribution_at || relationship.first_contribution_at > earliestMRDate) {
            relationship.first_contribution_at = earliestMRDate;
          }
          
          if (!relationship.last_contribution_at || relationship.last_contribution_at < latestMRDate) {
            relationship.last_contribution_at = latestMRDate;
          }
        }
        
        // Check if this relationship already exists in the array
        const existingIndex = context.relationships.contributorRepository.findIndex(
          rel => rel.repository_id === repository.id && rel.contributor_id === contributor.id
        );
        
        if (existingIndex >= 0) {
          // Update existing entry
          context.relationships.contributorRepository[existingIndex] = relationship;
        } else {
          // Add new entry
          context.relationships.contributorRepository.push(relationship);
        }
      }
    }
  }
  
  /**
   * Group commits by repository and contributor IDs
   * @param {Array<Object>} commits - Commit data
   * @returns {Object} Grouped commits
   */
  groupCommitsByRepoAndContributor(commits) {
    const grouped = {};
    
    for (const commit of commits) {
      if (!commit.repository_id || !commit.contributor_id) {
        continue;
      }
      
      const repoId = commit.repository_id;
      const contributorId = commit.contributor_id;
      
      if (!grouped[repoId]) {
        grouped[repoId] = {};
      }
      
      if (!grouped[repoId][contributorId]) {
        grouped[repoId][contributorId] = {
          count: 0,
          additions: 0,
          deletions: 0,
          commits: []
        };
      }
      
      grouped[repoId][contributorId].count++;
      grouped[repoId][contributorId].additions += commit.additions || 0;
      grouped[repoId][contributorId].deletions += commit.deletions || 0;
      grouped[repoId][contributorId].commits.push(commit);
    }
    
    return grouped;
  }
  
  /**
   * Group merge requests by repository and contributor IDs
   * @param {Array<Object>} mergeRequests - Merge request data
   * @returns {Object} Grouped merge requests
   */
  groupMergeRequestsByRepoAndContributor(mergeRequests) {
    const grouped = {};
    
    for (const mr of mergeRequests) {
      if (!mr.repository_id || !mr.contributor_id) {
        continue;
      }
      
      const repoId = mr.repository_id;
      const contributorId = mr.contributor_id;
      
      if (!grouped[repoId]) {
        grouped[repoId] = {};
      }
      
      if (!grouped[repoId][contributorId]) {
        grouped[repoId][contributorId] = {
          count: 0,
          additions: 0,
          deletions: 0,
          mergeRequests: []
        };
      }
      
      grouped[repoId][contributorId].count++;
      grouped[repoId][contributorId].additions += mr.additions || 0;
      grouped[repoId][contributorId].deletions += mr.deletions || 0;
      grouped[repoId][contributorId].mergeRequests.push(mr);
    }
    
    return grouped;
  }
  
  /**
   * Deduplicate relationships by combining statistics for the same repository-contributor pairs
   * @param {Array<Object>} relationships - Contributor-repository relationships
   * @returns {Array<Object>} Deduplicated relationships
   */
  deduplicateRelationships(relationships) {
    const uniqueRelationships = {};
    
    for (const rel of relationships) {
      const key = `${rel.repository_id}:${rel.contributor_id}`;
      
      if (!uniqueRelationships[key]) {
        uniqueRelationships[key] = { ...rel };
      } else {
        // Combine statistics
        uniqueRelationships[key].commit_count = (uniqueRelationships[key].commit_count || 0) + (rel.commit_count || 0);
        uniqueRelationships[key].pull_request_count = (uniqueRelationships[key].pull_request_count || 0) + (rel.pull_request_count || 0);
        uniqueRelationships[key].additions = (uniqueRelationships[key].additions || 0) + (rel.additions || 0);
        uniqueRelationships[key].deletions = (uniqueRelationships[key].deletions || 0) + (rel.deletions || 0);
        uniqueRelationships[key].contributions_count = (uniqueRelationships[key].contributions_count || 0) + (rel.contributions_count || 0);
        
        // Update timestamps if needed
        if (rel.first_contribution_at && (!uniqueRelationships[key].first_contribution_at || 
            new Date(rel.first_contribution_at) < new Date(uniqueRelationships[key].first_contribution_at))) {
          uniqueRelationships[key].first_contribution_at = rel.first_contribution_at;
        }
        
        if (rel.last_contribution_at && (!uniqueRelationships[key].last_contribution_at || 
            new Date(rel.last_contribution_at) > new Date(uniqueRelationships[key].last_contribution_at))) {
          uniqueRelationships[key].last_contribution_at = rel.last_contribution_at;
        }
        
        // Update the updated_at timestamp
        uniqueRelationships[key].updated_at = new Date().toISOString();
      }
    }
    
    return Object.values(uniqueRelationships);
  }
} 