const { Octokit } = require('octokit');
const githubRawDataRepo = require('../repositories/github-raw-data-repository');

/**
 * Class for fetching and storing GitHub data in the raw data table
 */
class GitHubDataFetcher {
  /**
   * Constructor
   * 
   * @param {Object} options - Options for the fetcher
   * @param {string} options.token - GitHub API token
   * @param {number} options.maxRetries - Maximum number of retries for failed requests
   * @param {number} options.retryDelay - Delay between retries in milliseconds
   */
  constructor(options = {}) {
    this.octokit = new Octokit({
      auth: options.token || process.env.GITHUB_TOKEN,
      request: {
        retries: options.maxRetries || 3,
        retryAfter: options.retryDelay || 1000
      }
    });
    
    this.options = {
      useEtags: options.useEtags !== undefined ? options.useEtags : true,
      logResponses: options.logResponses !== undefined ? options.logResponses : false,
      ...options
    };
  }
  
  /**
   * Fetch and store repository data
   * 
   * @param {string} owner - Repository owner username
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} The fetched repository data
   */
  async fetchAndStoreRepository(owner, repo) {
    try {
      console.log(`Fetching repository data for ${owner}/${repo}`);
      
      // Check if we have existing data with an ETag
      let requestOptions = {};
      if (this.options.useEtags) {
        const existingData = await githubRawDataRepo.findByEntityAndId('repository', `${owner}/${repo}`);
        if (existingData?.etag) {
          requestOptions.headers = {
            'If-None-Match': existingData.etag
          };
        }
      }
      
      // Fetch repository data from GitHub
      const response = await this.octokit.request('GET /repos/{owner}/{repo}', {
        owner,
        repo,
        ...requestOptions
      });
      
      // If we get here, we have new data (304 Not Modified would throw an error that we catch)
      const { data, headers } = response;
      
      // Store in raw data table
      await githubRawDataRepo.save({
        entity_type: 'repository',
        github_id: `${owner}/${repo}`, // Store as owner/repo for easier lookup
        data: data,
        fetched_at: new Date(),
        api_endpoint: `/repos/${owner}/${repo}`,
        etag: headers.etag
      });
      
      console.log(`Successfully stored repository data for ${owner}/${repo}`);
      return data;
    } catch (error) {
      // Check if this is a 304 Not Modified response
      if (error.status === 304) {
        console.log(`Repository ${owner}/${repo} data not modified, using cached version`);
        const existingData = await githubRawDataRepo.findByEntityAndId('repository', `${owner}/${repo}`);
        return existingData.data;
      }
      
      console.error(`Error fetching repository ${owner}/${repo}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Fetch and store contributor data
   * 
   * @param {string} username - GitHub username
   * @returns {Promise<Object>} The fetched contributor data
   */
  async fetchAndStoreContributor(username) {
    try {
      console.log(`Fetching contributor data for ${username}`);
      
      // Check if we have existing data with an ETag
      let requestOptions = {};
      if (this.options.useEtags) {
        const existingData = await githubRawDataRepo.findByEntityAndId('contributor', username);
        if (existingData?.etag) {
          requestOptions.headers = {
            'If-None-Match': existingData.etag
          };
        }
      }
      
      // Fetch user data from GitHub
      const response = await this.octokit.request('GET /users/{username}', {
        username,
        ...requestOptions
      });
      
      const { data, headers } = response;
      
      // Store in raw data table
      await githubRawDataRepo.save({
        entity_type: 'contributor',
        github_id: username, // Store username as ID for easier lookup
        data: data,
        fetched_at: new Date(),
        api_endpoint: `/users/${username}`,
        etag: headers.etag
      });
      
      console.log(`Successfully stored contributor data for ${username}`);
      return data;
    } catch (error) {
      // Check if this is a 304 Not Modified response
      if (error.status === 304) {
        console.log(`Contributor ${username} data not modified, using cached version`);
        const existingData = await githubRawDataRepo.findByEntityAndId('contributor', username);
        return existingData.data;
      }
      
      console.error(`Error fetching contributor ${username}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Fetch and store commit data
   * 
   * @param {string} owner - Repository owner username
   * @param {string} repo - Repository name
   * @param {string} sha - Commit SHA
   * @returns {Promise<Object>} The fetched commit data
   */
  async fetchAndStoreCommit(owner, repo, sha) {
    try {
      console.log(`Fetching commit data for ${owner}/${repo}/${sha}`);
      
      // Check if we have existing data with an ETag
      let requestOptions = {};
      if (this.options.useEtags) {
        const existingData = await githubRawDataRepo.findByEntityAndId('commit', sha);
        if (existingData?.etag) {
          requestOptions.headers = {
            'If-None-Match': existingData.etag
          };
        }
      }
      
      // Fetch commit data from GitHub
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
        owner,
        repo,
        ref: sha,
        ...requestOptions
      });
      
      const { data, headers } = response;
      
      // Store in raw data table
      await githubRawDataRepo.save({
        entity_type: 'commit',
        github_id: sha, // Store SHA as ID
        data: data,
        fetched_at: new Date(),
        api_endpoint: `/repos/${owner}/${repo}/commits/${sha}`,
        etag: headers.etag
      });
      
      console.log(`Successfully stored commit data for ${sha}`);
      return data;
    } catch (error) {
      // Check if this is a 304 Not Modified response
      if (error.status === 304) {
        console.log(`Commit ${sha} data not modified, using cached version`);
        const existingData = await githubRawDataRepo.findByEntityAndId('commit', sha);
        return existingData.data;
      }
      
      console.error(`Error fetching commit ${sha}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Fetch and store pull request data
   * 
   * @param {string} owner - Repository owner username
   * @param {string} repo - Repository name
   * @param {number} prNumber - Pull request number
   * @returns {Promise<Object>} The fetched pull request data
   */
  async fetchAndStorePullRequest(owner, repo, prNumber) {
    try {
      console.log(`Fetching pull request data for ${owner}/${repo}#${prNumber}`);
      
      // Check if we have existing data with an ETag
      let requestOptions = {};
      if (this.options.useEtags) {
        const existingData = await githubRawDataRepo.findByEntityAndId('pull_request', `${owner}/${repo}/${prNumber}`);
        if (existingData?.etag) {
          requestOptions.headers = {
            'If-None-Match': existingData.etag
          };
        }
      }
      
      // Fetch pull request data from GitHub
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
        owner,
        repo,
        pull_number: prNumber,
        ...requestOptions
      });
      
      const { data, headers } = response;
      
      // Store in raw data table
      await githubRawDataRepo.save({
        entity_type: 'pull_request',
        github_id: `${owner}/${repo}/${prNumber}`, // Store as owner/repo/number for easier lookup
        data: data,
        fetched_at: new Date(),
        api_endpoint: `/repos/${owner}/${repo}/pulls/${prNumber}`,
        etag: headers.etag
      });
      
      console.log(`Successfully stored pull request data for ${owner}/${repo}#${prNumber}`);
      return data;
    } catch (error) {
      // Check if this is a 304 Not Modified response
      if (error.status === 304) {
        console.log(`Pull request ${owner}/${repo}#${prNumber} data not modified, using cached version`);
        const existingData = await githubRawDataRepo.findByEntityAndId('pull_request', `${owner}/${repo}/${prNumber}`);
        return existingData.data;
      }
      
      console.error(`Error fetching pull request ${owner}/${repo}#${prNumber}:`, error.message);
      throw error;
    }
  }
}

// Export a class for creating instances with different configurations
module.exports = GitHubDataFetcher; 