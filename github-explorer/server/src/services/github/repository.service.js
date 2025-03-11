/**
 * Repository Data Service
 * 
 * This service is responsible for processing repository data from GitHub API
 * and preparing it for storage in the database.
 * 
 * It handles data transformation, enrichment, and normalization based on
 * the database schema requirements.
 */

import { Octokit } from 'octokit';
import { createAppAuth } from '@octokit/auth-app';
import { logger } from '../../utils/logger.js';

/**
 * Transform raw GitHub repository data to match our database schema
 * @param {object} repoData - Raw repository data from GitHub API
 * @returns {object} - Transformed repository data ready for database storage
 */
export function transformRepositoryData(repoData) {
  if (!repoData) {
    logger.error('No repository data provided for transformation');
    throw new Error('Repository data is required');
  }

  try {
    return {
      // Map from GitHub API fields to our database schema
      name: repoData.name,
      description: repoData.description || null,
      url: repoData.html_url,
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      is_enriched: false, // New repositories start as not enriched
      open_issues_count: repoData.open_issues_count || 0,
      last_updated: repoData.updated_at,
      size_kb: repoData.size || 0,
      watchers_count: repoData.watchers_count || 0,
      primary_language: repoData.language || null,
      license: repoData.license ? repoData.license.name : null,
      // Additional calculated or derived fields
      health_percentage: calculateRepositoryHealth(repoData),
      // Metadata
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`Error transforming repository data: ${error.message}`, { 
      error, 
      repoId: repoData?.id 
    });
    throw new Error(`Failed to transform repository data: ${error.message}`);
  }
}

/**
 * Calculate a health score for the repository based on various factors
 * @param {object} repoData - Raw repository data from GitHub API
 * @returns {number} - Health score from 0-100
 */
function calculateRepositoryHealth(repoData) {
  // This is a simplified health calculation that could be expanded
  // with more sophisticated metrics
  
  let score = 0;
  const maxScore = 100;
  
  // Factor 1: Recent activity (updated in last 3 months)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const lastUpdated = new Date(repoData.updated_at);
  if (lastUpdated > threeMonthsAgo) {
    score += 30;
  }
  
  // Factor 2: Documentation (has README)
  if (repoData.has_readme) {
    score += 20;
  }
  
  // Factor 3: Issue management
  const openIssuesRatio = repoData.open_issues_count / (repoData.stargazers_count + 1);
  if (openIssuesRatio < 0.1) {
    score += 20;
  } else if (openIssuesRatio < 0.2) {
    score += 10;
  }
  
  // Factor 4: Community engagement
  if (repoData.stargazers_count > 100) {
    score += 15;
  } else if (repoData.stargazers_count > 10) {
    score += 10;
  } else {
    score += 5;
  }
  
  // Factor 5: Active development
  if (repoData.pushed_at) {
    const lastPush = new Date(repoData.pushed_at);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    if (lastPush > oneMonthAgo) {
      score += 15;
    }
  }
  
  return Math.min(score, maxScore);
}

/**
 * Enrich repository data with additional information
 * @param {object} repoData - Basic repository data
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @returns {Promise<object>} - Enriched repository data
 */
export async function enrichRepositoryData(repoData, octokit) {
  if (!repoData || !repoData.name || !octokit) {
    logger.error('Missing required parameters for repository enrichment');
    throw new Error('Repository data and Octokit instance are required');
  }

  try {
    const [owner, repo] = repoData.url.split('/').slice(-2);
    
    // Get additional data that might not be in the basic repository info
    const [readmeResponse, languagesResponse] = await Promise.allSettled([
      octokit.rest.repos.getReadme({
        owner,
        repo,
        mediaType: {
          format: 'html',
        },
      }).catch(() => ({ data: { has_readme: false } })),
      
      octokit.rest.repos.listLanguages({
        owner,
        repo,
      }).catch(() => ({ data: {} })),
    ]);

    // Process results and add to enriched data
    const enrichedData = { ...repoData };
    
    // Check if README exists
    if (readmeResponse.status === 'fulfilled' && readmeResponse.value?.data) {
      enrichedData.has_readme = true;
    } else {
      enrichedData.has_readme = false;
    }
    
    // Process languages data
    if (languagesResponse.status === 'fulfilled' && languagesResponse.value?.data) {
      const languages = languagesResponse.value.data;
      const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
      
      // Calculate language percentages
      const languagePercentages = {};
      Object.entries(languages).forEach(([language, bytes]) => {
        languagePercentages[language] = Math.round((bytes / totalBytes) * 100);
      });
      
      enrichedData.languages = languagePercentages;
    }
    
    enrichedData.is_enriched = true;
    return enrichedData;
  } catch (error) {
    logger.error(`Error enriching repository data: ${error.message}`, { 
      error, 
      repositoryName: repoData.name 
    });
    throw new Error(`Failed to enrich repository data: ${error.message}`);
  }
}

export default {
  transformRepositoryData,
  enrichRepositoryData
}; 