/**
 * Contributor Data Service
 * 
 * This service is responsible for processing contributor data from GitHub API
 * and preparing it for storage in the database.
 * 
 * It handles data transformation, enrichment, and normalization based on
 * the database schema requirements.
 */

import { Octokit } from 'octokit';
import { logger } from '../../utils/logger.js';

/**
 * Transform raw GitHub contributor data to match our database schema
 * @param {object} contributorData - Raw contributor data from GitHub API
 * @returns {object} - Transformed contributor data ready for database storage
 */
export function transformContributorData(contributorData) {
  if (!contributorData) {
    logger.error('No contributor data provided for transformation');
    throw new Error('Contributor data is required');
  }

  try {
    return {
      // Map from GitHub API fields to our database schema
      id: contributorData.login,                      // Using login as the ID
      username: contributorData.login,
      name: contributorData.name || null,
      avatar: contributorData.avatar_url || null,
      is_enriched: false,                            // New contributors start as not enriched
      bio: contributorData.bio || null,
      company: contributorData.company || null,
      blog: contributorData.blog || null,
      twitter_username: contributorData.twitter_username || null,
      location: contributorData.location || null,
      followers: contributorData.followers || 0,
      repositories: contributorData.public_repos || 0,
      impact_score: calculateImpactScore(contributorData),
      // Fields that will be populated during enrichment
      role_classification: null,
      top_languages: [],
      organizations: [],
      first_contribution: null,
      last_contribution: contributorData.updated_at || null,
      direct_commits: 0,
      pull_requests_merged: 0,
      pull_requests_rejected: 0,
      code_reviews: 0,
      issues_opened: 0,
      issues_resolved: 0
    };
  } catch (error) {
    logger.error(`Error transforming contributor data: ${error.message}`, { 
      error, 
      contributorLogin: contributorData?.login 
    });
    throw new Error(`Failed to transform contributor data: ${error.message}`);
  }
}

/**
 * Calculate an impact score for the contributor based on various factors
 * @param {object} contributorData - Raw contributor data from GitHub API
 * @returns {number} - Impact score from 0-100
 */
function calculateImpactScore(contributorData) {
  // This is a simplified impact calculation that could be expanded
  // with more sophisticated metrics
  
  let score = 0;
  const maxScore = 100;
  
  // Factor 1: Contribution activity (based on contribution count)
  if (contributorData.contributions) {
    if (contributorData.contributions > 100) {
      score += 30;
    } else if (contributorData.contributions > 50) {
      score += 20;
    } else if (contributorData.contributions > 10) {
      score += 10;
    } else {
      score += 5;
    }
  }
  
  // Factor 2: Community influence (followers)
  if (contributorData.followers) {
    if (contributorData.followers > 1000) {
      score += 25;
    } else if (contributorData.followers > 500) {
      score += 20;
    } else if (contributorData.followers > 100) {
      score += 15;
    } else if (contributorData.followers > 10) {
      score += 10;
    } else {
      score += 5;
    }
  }
  
  // Factor 3: Project creation (repositories)
  if (contributorData.public_repos) {
    if (contributorData.public_repos > 50) {
      score += 20;
    } else if (contributorData.public_repos > 20) {
      score += 15;
    } else if (contributorData.public_repos > 5) {
      score += 10;
    } else {
      score += 5;
    }
  }
  
  // Factor 4: Profile completeness
  let completenessPoints = 0;
  if (contributorData.name) completenessPoints += 5;
  if (contributorData.bio) completenessPoints += 5;
  if (contributorData.company) completenessPoints += 5;
  if (contributorData.blog) completenessPoints += 5;
  if (contributorData.location) completenessPoints += 5;
  
  score += completenessPoints;
  
  return Math.min(score, maxScore);
}

/**
 * Enrich contributor data with additional information
 * @param {object} contributorData - Basic contributor data
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @returns {Promise<object>} - Enriched contributor data
 */
export async function enrichContributorData(contributorData, octokit) {
  if (!contributorData || (!contributorData.id && !contributorData.username) || !octokit) {
    logger.error('Missing required parameters for contributor enrichment');
    throw new Error('Contributor data (with id or username) and Octokit instance are required');
  }

  try {
    // Check if we have a valid GitHub ID to use
    const userId = contributorData.id;
    const username = contributorData.username;
    
    let userData;
    
    // If we have a valid GitHub user ID, use that for fetching data
    if (userId) {
      logger.debug(`Enriching contributor data for ID: ${userId}`);
      
      try {
        // Using the custom getUserById method
        userData = await octokit.request('GET /user/{id}', {
          id: userId,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }).then(response => response.data);
        
        // If the request succeeds, update the username in case it has changed
        if (userData && userData.login !== username) {
          logger.info(`Username for user ID ${userId} has changed from "${username}" to "${userData.login}"`);
        }
      } catch (idError) {
        logger.warn(`Failed to fetch user by ID ${userId}, error: ${idError.message}`);
        
        // If we also have a username, try that as fallback
        if (username) {
          logger.debug(`Falling back to username: ${username}`);
          try {
            userData = await octokit.rest.users.getByUsername({
              username
            }).then(response => response.data);
          } catch (usernameError) {
            logger.error(`Failed to fetch user by username ${username}, error: ${usernameError.message}`);
            throw new Error(`Failed to fetch user data: ${usernameError.message}`);
          }
        } else {
          throw idError; // Re-throw if we have no username fallback
        }
      }
    } 
    // If we only have a username, use that
    else if (username) {
      logger.debug(`Enriching contributor data for username: ${username}`);
      
      try {
        userData = await octokit.rest.users.getByUsername({
          username
        }).then(response => response.data);
      } catch (usernameError) {
        logger.error(`Failed to fetch user by username ${username}, error: ${usernameError.message}`);
        throw new Error(`Failed to fetch user data: ${usernameError.message}`);
      }
    }
    
    if (!userData) {
      throw new Error('Failed to fetch user data from GitHub API');
    }
    
    // Prepare the enriched data object
    const enrichedData = { 
      ...contributorData,
      // Always ensure the id and username are updated to the latest values
      id: userData.id,
      username: userData.login,
      // Update with fresh data from the user profile
      name: userData.name || contributorData.name,
      bio: userData.bio || contributorData.bio,
      company: userData.company || contributorData.company,
      blog: userData.blog || contributorData.blog,
      twitter_username: userData.twitter_username || contributorData.twitter_username,
      location: userData.location || contributorData.location,
      followers: userData.followers || contributorData.followers,
      repositories: userData.public_repos || contributorData.repositories
    };
    
    // Get user's organizations
    const { data: orgs } = await octokit.rest.orgs.listForUser({
      username: userData.login, // Use the possibly updated username
      per_page: 100
    });
    
    if (orgs && orgs.length > 0) {
      enrichedData.organizations = orgs.map(org => org.login);
    }
    
    // Get user's top repositories to determine top languages
    const { data: repos } = await octokit.rest.repos.listForUser({
      username,
      sort: 'pushed',
      direction: 'desc',
      per_page: 10
    });
    
    if (repos && repos.length > 0) {
      // Extract languages from repositories
      const languages = {};
      
      for (const repo of repos) {
        if (repo.language && repo.language !== 'null') {
          languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
      }
      
      // Convert to array and sort by frequency
      enrichedData.top_languages = Object.keys(languages)
        .sort((a, b) => languages[b] - languages[a])
        .slice(0, 5);
      
      // Simple role classification based on top languages
      enrichedData.role_classification = classifyContributorRole(enrichedData.top_languages);
    }
    
    enrichedData.is_enriched = true;
    return enrichedData;
  } catch (error) {
    logger.error(`Error enriching contributor data: ${error.message}`, { 
      error, 
      username: contributorData.username 
    });
    throw new Error(`Failed to enrich contributor data: ${error.message}`);
  }
}

/**
 * Classify a contributor's role based on their top programming languages
 * @param {string[]} languages - Array of top programming languages
 * @returns {string} - Role classification
 */
function classifyContributorRole(languages) {
  if (!languages || languages.length === 0) {
    return 'Unknown';
  }
  
  const topLanguage = languages[0];
  
  // Frontend technologies
  const frontendLanguages = ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'Vue', 'React', 'Angular'];
  
  // Backend technologies
  const backendLanguages = ['Python', 'Java', 'C#', 'Ruby', 'PHP', 'Go', 'Rust', 'C++', 'C'];
  
  // Data science technologies
  const dataLanguages = ['R', 'Julia', 'Jupyter Notebook'];
  
  // Mobile development
  const mobileLanguages = ['Swift', 'Kotlin', 'Objective-C', 'Dart', 'Flutter'];
  
  // DevOps technologies
  const devopsLanguages = ['Shell', 'Dockerfile', 'HCL', 'Terraform'];
  
  if (frontendLanguages.includes(topLanguage)) {
    return 'Frontend Developer';
  } else if (backendLanguages.includes(topLanguage)) {
    return 'Backend Developer';
  } else if (dataLanguages.includes(topLanguage)) {
    return 'Data Scientist';
  } else if (mobileLanguages.includes(topLanguage)) {
    return 'Mobile Developer';
  } else if (devopsLanguages.includes(topLanguage)) {
    return 'DevOps Engineer';
  } else {
    return 'Software Developer';
  }
}

/**
 * Find or create contributor record from contributor API data
 * @param {object} contributorData - Contributor data from GitHub API
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @returns {Promise<object>} - Processed contributor data
 */
export async function processContributorData(contributorData, octokit) {
  try {
    // First transform the data to match our schema
    const transformedData = transformContributorData(contributorData);
    
    // Then enrich with additional information
    const enrichedData = await enrichContributorData(transformedData, octokit);
    
    return enrichedData;
  } catch (error) {
    logger.error(`Error processing contributor data: ${error.message}`, { 
      error, 
      contributorLogin: contributorData?.login 
    });
    throw new Error(`Failed to process contributor data: ${error.message}`);
  }
}

export default {
  transformContributorData,
  enrichContributorData,
  processContributorData
}; 