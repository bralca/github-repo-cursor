/**
 * Merge Request Data Service
 * 
 * This service is responsible for processing pull request data from GitHub API
 * and preparing it for storage in the database.
 * 
 * It handles data transformation, enrichment, and normalization based on
 * the database schema requirements.
 */

import { Octokit } from 'octokit';
import { logger } from '../../utils/logger.js';
import githubClient from './client.js';

/**
 * Transform raw GitHub pull request data to match our database schema
 * @param {object} prData - Raw pull request data from GitHub API
 * @param {string} repoId - Repository ID this pull request belongs to
 * @returns {object} - Transformed pull request data ready for database storage
 */
export function transformMergeRequestData(prData, repoId) {
  if (!prData) {
    logger.error('No pull request data provided for transformation');
    throw new Error('Pull request data is required');
  }

  try {
    return {
      // Map from GitHub API fields to our database schema
      id: prData.id,
      title: prData.title || '',
      description: prData.body || '',
      status: getPrStatus(prData),
      author: prData.user?.login || '',
      author_avatar: prData.user?.avatar_url || '',
      created_at: prData.created_at,
      updated_at: prData.updated_at,
      closed_at: prData.closed_at || null,
      merged_at: prData.merged_at || null,
      base_branch: prData.base?.ref || '',
      head_branch: prData.head?.ref || '',
      repository_id: repoId,
      commits: prData.commits || 0,
      files_changed: prData.changed_files || 0,
      review_comments: prData.review_comments || 0,
      lines_added: prData.additions || 0,
      lines_removed: prData.deletions || 0,
      cycle_time_hours: calculateCycleTime(prData),
      review_time_hours: calculateReviewTime(prData),
      complexity_score: calculateComplexityScore(prData),
      is_enriched: false,
      github_link: prData.html_url || '',
      labels: prData.labels ? prData.labels.map(label => label.name) : []
    };
  } catch (error) {
    logger.error(`Error transforming merge request data: ${error.message}`, { 
      error, 
      prId: prData?.id 
    });
    throw new Error(`Failed to transform merge request data: ${error.message}`);
  }
}

/**
 * Determine the status of a pull request
 * @param {object} prData - Raw pull request data
 * @returns {string} - Status (open, closed, merged)
 */
function getPrStatus(prData) {
  if (prData.merged_at) {
    return 'merged';
  } else if (prData.closed_at) {
    return 'closed';
  } else {
    return 'open';
  }
}

/**
 * Calculate the cycle time (time from creation to merge)
 * @param {object} prData - Raw pull request data
 * @returns {number} - Cycle time in hours or null if not merged
 */
function calculateCycleTime(prData) {
  if (!prData.merged_at) {
    return null;
  }
  
  const createdAt = new Date(prData.created_at);
  const mergedAt = new Date(prData.merged_at);
  const diffMs = mergedAt - createdAt;
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return Math.round(diffHours * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate the review time (time from first review to merge)
 * @param {object} prData - Raw pull request data
 * @returns {number} - Review time in hours or null if not applicable
 */
function calculateReviewTime(prData) {
  // If we have specific first review timestamp in the data, we could use it
  // For now, we'll use a simplified approach and assume review starts
  // after the PR was created (this will be refined with the enrichment)
  
  if (!prData.merged_at) {
    return null;
  }
  
  // Use updated_at as a proxy for first review
  const reviewStartAt = new Date(prData.updated_at);
  const createdAt = new Date(prData.created_at);
  const mergedAt = new Date(prData.merged_at);
  
  // If updated_at equals created_at, there wasn't meaningful review period
  if (reviewStartAt.getTime() === createdAt.getTime()) {
    return 0;
  }
  
  const diffMs = mergedAt - reviewStartAt;
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return Math.round(diffHours * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate a complexity score for the pull request
 * @param {object} prData - Raw pull request data
 * @returns {number} - Complexity score from 0-100
 */
function calculateComplexityScore(prData) {
  // This is a simplified complexity calculation that could be expanded
  // with more sophisticated metrics
  
  let score = 0;
  const maxScore = 100;
  
  // Factor 1: Size of changes
  const linesChanged = (prData.additions || 0) + (prData.deletions || 0);
  if (linesChanged > 1000) {
    score += 40;
  } else if (linesChanged > 500) {
    score += 30;
  } else if (linesChanged > 200) {
    score += 20;
  } else if (linesChanged > 50) {
    score += 10;
  } else {
    score += 5;
  }
  
  // Factor 2: Number of files changed
  if (prData.changed_files > 20) {
    score += 30;
  } else if (prData.changed_files > 10) {
    score += 20;
  } else if (prData.changed_files > 5) {
    score += 10;
  } else {
    score += 5;
  }
  
  // Factor 3: Number of commits
  if (prData.commits > 20) {
    score += 20;
  } else if (prData.commits > 10) {
    score += 15;
  } else if (prData.commits > 5) {
    score += 10;
  } else {
    score += 5;
  }
  
  // Factor 4: Discussion volume
  if (prData.comments > 20 || prData.review_comments > 20) {
    score += 10;
  } else if (prData.comments > 10 || prData.review_comments > 10) {
    score += 5;
  }
  
  return Math.min(score, maxScore);
}

/**
 * Enrich pull request data with additional information
 * @param {object} transformedData - Transformed pull request data
 * @param {object} rawPrData - Raw pull request data from GitHub API
 * @returns {Promise<object>} - Enriched pull request data
 */
export async function enrichMergeRequestData(transformedData, rawPrData) {
  if (!transformedData || !transformedData.id || !rawPrData) {
    logger.error('Missing required parameters for merge request enrichment');
    throw new Error('Both transformed data and raw PR data are required');
  }

  try {
    logger.debug(`Enriching merge request data for PR #${transformedData.id}`);
    
    // Create a copy of the transformed data to enrich
    const enrichedData = { ...transformedData };
    
    // Calculate a more refined complexity score
    enrichedData.complexity_score = calculateEnrichedComplexityScore(
      rawPrData,
      rawPrData.review_comments || 0,
      rawPrData.comments || 0
    );
    
    // Calculate more accurate cycle time
    if (rawPrData.merged_at) {
      enrichedData.cycle_time = calculateCycleTime(rawPrData);
    }
    
    // Calculate review time
    enrichedData.review_time = calculateReviewTime(rawPrData);
    
    // Mark as enriched
    enrichedData.is_enriched = true;
    
    return enrichedData;
  } catch (error) {
    logger.error(`Error enriching merge request data: ${error.message}`, {
      error,
      prId: transformedData.id
    });
    throw new Error(`Failed to enrich merge request data: ${error.message}`);
  }
}

/**
 * Calculate a more accurate complexity score with enriched data
 * @param {object} prData - Pull request data
 * @param {number} reviewCount - Number of reviews
 * @param {number} commentCount - Number of comments
 * @returns {number} - Adjusted complexity score
 */
function calculateEnrichedComplexityScore(prData, reviewCount, commentCount) {
  let score = 0;
  const maxScore = 100;
  
  // Factor 1: Size of changes
  const linesChanged = (prData.lines_added || 0) + (prData.lines_removed || 0);
  if (linesChanged > 1000) {
    score += 30;
  } else if (linesChanged > 500) {
    score += 25;
  } else if (linesChanged > 200) {
    score += 15;
  } else if (linesChanged > 50) {
    score += 10;
  } else {
    score += 5;
  }
  
  // Factor 2: Number of files changed
  if (prData.files_changed > 20) {
    score += 25;
  } else if (prData.files_changed > 10) {
    score += 15;
  } else if (prData.files_changed > 5) {
    score += 10;
  } else {
    score += 5;
  }
  
  // Factor 3: Number of commits
  if (prData.commits > 20) {
    score += 15;
  } else if (prData.commits > 10) {
    score += 10;
  } else if (prData.commits > 5) {
    score += 5;
  } else {
    score += 2;
  }
  
  // Factor 4: Discussion volume
  const totalComments = (commentCount || 0) + (prData.review_comments || 0);
  if (totalComments > 20) {
    score += 15;
  } else if (totalComments > 10) {
    score += 10;
  } else if (totalComments > 5) {
    score += 5;
  }
  
  // Factor 5: Review complexity
  if (reviewCount > 5) {
    score += 15;
  } else if (reviewCount > 2) {
    score += 10;
  } else if (reviewCount > 0) {
    score += 5;
  }
  
  return Math.min(score, maxScore);
}

/**
 * Process merge request data - transform and enrich in one step
 * @param {object} prData - Raw pull request data from GitHub API
 * @param {number} repositoryId - Repository ID
 * @returns {Promise<object>} - Processed pull request data
 */
export async function processMergeRequestData(prData, repositoryId) {
  try {
    // Transform the data first
    const transformedData = transformMergeRequestData(prData, repositoryId);
    
    // Then enrich it
    const enrichedData = await enrichMergeRequestData(transformedData, prData);
    
    return enrichedData;
  } catch (error) {
    logger.error(`Error processing merge request data: ${error.message}`, {
      error,
      prId: prData?.id,
      repositoryId
    });
    throw new Error(`Failed to process merge request data: ${error.message}`);
  }
}

export default {
  transformMergeRequestData,
  enrichMergeRequestData,
  processMergeRequestData
}; 