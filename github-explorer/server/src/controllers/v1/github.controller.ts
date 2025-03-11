import { Request, Response } from 'express';
import { z } from 'zod';
import BaseController from '../base.controller';
import githubClient from '../../services/github/github-client.service';
import supabaseService from '../../services/supabase/supabase-client.service';
import logger from '../../utils/logger';

/**
 * Controller for GitHub API operations
 */
class GitHubController extends BaseController {
  /**
   * Get GitHub API rate limit status
   */
  async getRateLimit(req: Request, res: Response) {
    try {
      const rateLimit = await githubClient.checkRateLimit();
      return this.sendSuccess(res, rateLimit, 'GitHub API rate limit retrieved successfully');
    } catch (error) {
      logger.error({ msg: 'Failed to get GitHub API rate limit', error });
      return this.sendError(res, error, 'Failed to get GitHub API rate limit');
    }
  }
  
  /**
   * Get repository details
   */
  async getRepository(req: Request, res: Response) {
    // Validate request parameters
    const schema = z.object({
      owner: z.string().min(1, 'Owner is required'),
      repo: z.string().min(1, 'Repository name is required'),
    });
    
    try {
      const { owner, repo } = schema.parse(req.params);
      
      const repository = await githubClient.getRepository(owner, repo);
      return this.sendSuccess(res, repository, 'Repository details retrieved successfully');
    } catch (error) {
      logger.error({ msg: 'Failed to get repository details', params: req.params, error });
      return this.sendError(res, error, 'Failed to get repository details');
    }
  }
  
  /**
   * Get repository pull requests
   */
  async getPullRequests(req: Request, res: Response) {
    // Validate request parameters
    const paramsSchema = z.object({
      owner: z.string().min(1, 'Owner is required'),
      repo: z.string().min(1, 'Repository name is required'),
    });
    
    // Validate query parameters
    const querySchema = z.object({
      state: z.enum(['open', 'closed', 'all']).optional().default('all'),
      page: z.coerce.number().int().positive().optional().default(1),
      per_page: z.coerce.number().int().positive().optional().default(30),
    });
    
    try {
      const { owner, repo } = paramsSchema.parse(req.params);
      const { state, page, per_page } = querySchema.parse(req.query);
      
      const pullRequests = await githubClient.getPullRequests(owner, repo, {
        state,
        page,
        perPage: per_page,
      });
      
      return this.sendSuccess(res, pullRequests, 'Pull requests retrieved successfully');
    } catch (error) {
      logger.error({ msg: 'Failed to get pull requests', params: req.params, query: req.query, error });
      return this.sendError(res, error, 'Failed to get pull requests');
    }
  }
  
  /**
   * Get repository commits
   */
  async getCommits(req: Request, res: Response) {
    // Validate request parameters
    const paramsSchema = z.object({
      owner: z.string().min(1, 'Owner is required'),
      repo: z.string().min(1, 'Repository name is required'),
    });
    
    // Validate query parameters
    const querySchema = z.object({
      page: z.coerce.number().int().positive().optional().default(1),
      per_page: z.coerce.number().int().positive().optional().default(30),
      since: z.string().optional(),
      until: z.string().optional(),
    });
    
    try {
      const { owner, repo } = paramsSchema.parse(req.params);
      const { page, per_page, since, until } = querySchema.parse(req.query);
      
      const commits = await githubClient.getCommits(owner, repo, {
        page,
        perPage: per_page,
        since,
        until,
      });
      
      return this.sendSuccess(res, commits, 'Commits retrieved successfully');
    } catch (error) {
      logger.error({ msg: 'Failed to get commits', params: req.params, query: req.query, error });
      return this.sendError(res, error, 'Failed to get commits');
    }
  }
  
  /**
   * Get commit details
   */
  async getCommit(req: Request, res: Response) {
    // Validate request parameters
    const schema = z.object({
      owner: z.string().min(1, 'Owner is required'),
      repo: z.string().min(1, 'Repository name is required'),
      ref: z.string().min(1, 'Commit reference is required'),
    });
    
    try {
      const { owner, repo, ref } = schema.parse(req.params);
      
      const commit = await githubClient.getCommit(owner, repo, ref);
      return this.sendSuccess(res, commit, 'Commit details retrieved successfully');
    } catch (error) {
      logger.error({ msg: 'Failed to get commit details', params: req.params, error });
      return this.sendError(res, error, 'Failed to get commit details');
    }
  }
  
  /**
   * Get contributor details
   */
  async getContributor(req: Request, res: Response) {
    // Validate request parameters
    const schema = z.object({
      username: z.string().min(1, 'Username is required'),
    });
    
    try {
      const { username } = schema.parse(req.params);
      
      const contributor = await githubClient.getContributor(username);
      return this.sendSuccess(res, contributor, 'Contributor details retrieved successfully');
    } catch (error) {
      logger.error({ msg: 'Failed to get contributor details', params: req.params, error });
      return this.sendError(res, error, 'Failed to get contributor details');
    }
  }
  
  /**
   * Get repository contributors
   */
  async getRepositoryContributors(req: Request, res: Response) {
    // Validate request parameters
    const paramsSchema = z.object({
      owner: z.string().min(1, 'Owner is required'),
      repo: z.string().min(1, 'Repository name is required'),
    });
    
    // Validate query parameters
    const querySchema = z.object({
      page: z.coerce.number().int().positive().optional().default(1),
      per_page: z.coerce.number().int().positive().optional().default(30),
    });
    
    try {
      const { owner, repo } = paramsSchema.parse(req.params);
      const { page, per_page } = querySchema.parse(req.query);
      
      const contributors = await githubClient.getRepositoryContributors(owner, repo, {
        page,
        perPage: per_page,
      });
      
      return this.sendSuccess(res, contributors, 'Repository contributors retrieved successfully');
    } catch (error) {
      logger.error({ msg: 'Failed to get repository contributors', params: req.params, query: req.query, error });
      return this.sendError(res, error, 'Failed to get repository contributors');
    }
  }
  
  /**
   * Sync GitHub data to database
   */
  async syncGitHubData(req: Request, res: Response) {
    // Validate request body
    const schema = z.object({
      owner: z.string().min(1, 'Owner is required'),
      repo: z.string().min(1, 'Repository name is required'),
      syncPullRequests: z.boolean().optional().default(true),
      syncCommits: z.boolean().optional().default(true),
      syncContributors: z.boolean().optional().default(true),
      maxItems: z.number().int().positive().optional().default(100),
    });
    
    try {
      const { owner, repo, syncPullRequests, syncCommits, syncContributors, maxItems } = schema.parse(req.body);
      
      // Get repository details
      const repository = await githubClient.getRepository(owner, repo);
      
      // Store repository in database
      await supabaseService.upsertRepositories([{
        id: repository.id,
        name: repository.name,
        description: repository.description,
        url: repository.html_url,
        stars: repository.stargazers_count,
        forks: repository.forks_count,
        open_issues_count: repository.open_issues_count,
        watchers_count: repository.watchers_count,
        primary_language: repository.language,
        license: repository.license?.name,
        created_at: repository.created_at,
        last_updated: new Date().toISOString(),
      }]);
      
      const results: any = {
        repository: repository.name,
        pullRequests: 0,
        commits: 0,
        contributors: 0,
      };
      
      // Sync pull requests if requested
      if (syncPullRequests) {
        const pullRequests = await githubClient.getPullRequests(owner, repo, {
          perPage: Math.min(maxItems, 100),
          page: 1,
        });
        
        // Store pull requests in database
        const formattedPRs = pullRequests.map(pr => ({
          id: pr.id,
          title: pr.title,
          description: pr.body,
          status: pr.state,
          author: pr.user?.login,
          author_avatar: pr.user?.avatar_url,
          created_at: pr.created_at,
          updated_at: pr.updated_at,
          closed_at: pr.closed_at,
          merged_at: pr.merged_at,
          base_branch: pr.base?.ref,
          head_branch: pr.head?.ref,
          repository_id: repository.id,
          github_link: pr.html_url,
        }));
        
        await supabaseService.upsertMergeRequests(formattedPRs);
        results.pullRequests = formattedPRs.length;
      }
      
      // Sync commits if requested
      if (syncCommits) {
        const commits = await githubClient.getCommits(owner, repo, {
          perPage: Math.min(maxItems, 100),
          page: 1,
        });
        
        // Store commits in database
        const formattedCommits = commits.map(commit => ({
          hash: commit.sha,
          title: commit.commit.message.split('\n')[0],
          author: commit.author?.login || commit.commit.author.name,
          date: commit.commit.author.date,
          repository_id: repository.id,
          author_email: commit.commit.author.email,
          author_name: commit.commit.author.name,
          committer_name: commit.commit.committer.name,
          committer_email: commit.commit.committer.email,
          message_body: commit.commit.message.split('\n').slice(1).join('\n'),
          authored_date: commit.commit.author.date,
          committed_date: commit.commit.committer.date,
        }));
        
        await supabaseService.upsertCommits(formattedCommits);
        results.commits = formattedCommits.length;
      }
      
      // Sync contributors if requested
      if (syncContributors) {
        const contributors = await githubClient.getRepositoryContributors(owner, repo, {
          perPage: Math.min(maxItems, 100),
          page: 1,
        });
        
        // Store contributors in database
        const formattedContributors = contributors.map(contributor => ({
          id: contributor.login,
          username: contributor.login,
          avatar: contributor.avatar_url,
        }));
        
        await supabaseService.upsertContributors(formattedContributors);
        results.contributors = formattedContributors.length;
      }
      
      return this.sendSuccess(res, results, 'GitHub data synced successfully');
    } catch (error) {
      logger.error({ msg: 'Failed to sync GitHub data', body: req.body, error });
      return this.sendError(res, error, 'Failed to sync GitHub data');
    }
  }
}

export default new GitHubController(); 