/**
 * Contributor Processor Test Script
 * 
 * This script tests the contributor processor by processing sample data
 * and displaying the results.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipelineFactory } from '../pipeline/core/pipeline-factory.js';
import { githubClientFactory } from '../services/github/github-client.js';
import { supabaseClientFactory } from '../services/supabase/supabase-client.js';
import { registerContributorProcessorPipeline, processContributor } from '../pipeline/stages/contributor-processor-pipeline.js';
import { logger } from '../utils/logger.js';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    // Initialize mock clients for testing
    logger.info('Initializing mock clients for testing');
    githubClientFactory.createMockClient();
    supabaseClientFactory.createMockClient();
    
    // Initialize pipeline factory
    logger.info('Initializing pipeline factory');
    
    // Register the contributor processor pipeline
    registerContributorProcessorPipeline({
      timeframeInDays: 90 // Process last 90 days of data
    });
    
    // Load sample contributor data
    const sampleDataPath = path.resolve(__dirname, '../../../DOCS/data-samples/sampleContributor.json');
    logger.info(`Loading sample contributor data from path: ${sampleDataPath}`);
    
    let contributorData;
    try {
      const fileData = fs.readFileSync(sampleDataPath, 'utf8');
      contributorData = JSON.parse(fileData);
      logger.info('Sample contributor data loaded successfully');
    } catch (error) {
      // If sample file doesn't exist, create mock data
      logger.warn(`Sample file not found, using mock contributor data instead. Error: ${error.message}`);
      contributorData = {
        id: 'user-123',
        username: 'octocat',
        login: 'octocat',
        name: 'The Octocat',
        avatar_url: 'https://github.com/avatar.png',
        type: 'User',
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };
    }
    
    // Create some mock commits for the contributor
    const mockCommits = [];
    const now = new Date();
    for (let i = 0; i < 50; i++) {
      const commitDate = new Date(now);
      commitDate.setDate(now.getDate() - Math.floor(Math.random() * 100)); // Random date in the last 100 days
      
      mockCommits.push({
        id: `commit-${i}`,
        repository_id: `repo-${Math.floor(Math.random() * 3) + 1}`, // One of 3 random repos
        sha: `mock-sha-${i}`,
        message: `Mock commit message ${i}`,
        author: contributorData.username,
        author_id: contributorData.id,
        authored_at: commitDate.toISOString(),
        committed_at: commitDate.toISOString(),
        stats_additions: Math.floor(Math.random() * 100),
        stats_deletions: Math.floor(Math.random() * 20)
      });
    }
    
    // Create some mock merge requests
    const mockMergeRequests = [];
    for (let i = 0; i < 10; i++) {
      const mrDate = new Date(now);
      mrDate.setDate(now.getDate() - Math.floor(Math.random() * 100)); // Random date in the last 100 days
      
      mockMergeRequests.push({
        id: `mr-${i}`,
        repository_id: `repo-${Math.floor(Math.random() * 3) + 1}`, // One of 3 random repos
        number: i + 1,
        title: `Mock merge request ${i}`,
        author: contributorData.username,
        author_id: contributorData.id,
        created_at: mrDate.toISOString(),
        updated_at: mrDate.toISOString(),
        merged_at: mrDate.toISOString()
      });
    }
    
    // Create mock repositories
    const mockRepositories = [
      {
        id: 'repo-1',
        name: 'awesome-project',
        full_name: 'octocat/awesome-project',
        language: 'JavaScript',
        description: 'An awesome JavaScript project'
      },
      {
        id: 'repo-2',
        name: 'cool-app',
        full_name: 'octocat/cool-app',
        language: 'TypeScript',
        description: 'A cool TypeScript application'
      },
      {
        id: 'repo-3',
        name: 'data-analyzer',
        full_name: 'octocat/data-analyzer',
        language: 'Python',
        description: 'A Python data analysis tool'
      }
    ];
    
    // Create mock repository-contributor relationships
    const mockRepoContributors = [
      {
        repository_id: 'repo-1',
        contributor_id: contributorData.id,
        commit_count: 25,
        pull_request_count: 5,
        additions: 2500,
        deletions: 500,
        first_contribution_at: '2023-01-15T10:00:00Z',
        last_contribution_at: '2023-03-20T11:00:00Z'
      },
      {
        repository_id: 'repo-2',
        contributor_id: contributorData.id,
        commit_count: 15,
        pull_request_count: 3,
        additions: 1500,
        deletions: 300,
        first_contribution_at: '2023-02-10T09:00:00Z',
        last_contribution_at: '2023-03-15T14:00:00Z'
      },
      {
        repository_id: 'repo-3',
        contributor_id: contributorData.id,
        commit_count: 10,
        pull_request_count: 2,
        additions: 800,
        deletions: 150,
        first_contribution_at: '2023-02-20T08:00:00Z',
        last_contribution_at: '2023-03-10T16:00:00Z'
      }
    ];
    
    // Process the contributor
    logger.info('Processing contributor data...');
    const result = await processContributor(contributorData, {
      commits: mockCommits,
      repositories: mockRepositories,
      mergeRequests: mockMergeRequests,
      repoContributors: mockRepoContributors
    });
    
    // Display contributor statistics
    logger.info('Contributor processing completed');
    console.log('\nContributor Statistics:');
    console.log(JSON.stringify(result.statistics, null, 2));
    
    // Check for errors
    if (result.errors.length > 0) {
      logger.error('Errors encountered during processing:', result.errors);
    } else {
      logger.info('No errors encountered during processing');
    }
    
    // Provide a summary
    console.log('\nProcessing Summary:');
    console.log('- Contributor ID:', contributorData.id);
    console.log('- Contributor Username:', contributorData.username);
    console.log('- Commits Analyzed:', mockCommits.length);
    console.log('- Merge Requests Analyzed:', mockMergeRequests.length);
    console.log('- Repositories:', mockRepositories.length);
    console.log('- Impact Score:', result.statistics?.impact_score?.overall_score || 'N/A');
    console.log('- Role Classification:', result.statistics?.role_classification?.primary_role || 'N/A');
    console.log('- Top Languages:', result.statistics?.language_preferences?.top_languages?.join(', ') || 'N/A');
    
    // If activity metrics are computed, display summary
    if (result.statistics?.activity_metrics) {
      console.log('- Total Contributions:', result.statistics.activity_metrics.total_contributions);
      console.log('- Recent Contributions:', result.statistics.activity_metrics.recent_contributions);
      console.log('- Current Streak:', result.statistics.activity_metrics.current_streak);
      console.log('- Activity Trend:', result.statistics.activity_metrics.activity_trend);
    }
    
    // If repository relationships are computed, display summary
    if (result.statistics?.repository_relationships) {
      console.log('- Primary Repository:', result.statistics.repository_relationships.primary_repository_name || 'N/A');
      console.log('- Total Repositories:', result.statistics.repository_relationships.total_repositories);
    }
    
  } catch (error) {
    logger.error('Test script failed:', error);
    console.error(error);
  }
}

// Run the test
main(); 