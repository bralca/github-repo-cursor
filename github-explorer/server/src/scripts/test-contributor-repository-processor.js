/**
 * Contributor-Repository Relationship Processor Test Script
 * 
 * This script tests the contributor-repository relationship processor by processing
 * sample data and displaying the results.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipelineFactory } from '../pipeline/core/pipeline-factory.js';
import { githubClientFactory } from '../services/github/github-client.js';
import { supabaseClientFactory } from '../services/supabase/supabase-client.js';
import { registerContributorRepositoryPipeline, processContributorRepositoryRelationships } from '../pipeline/stages/contributor-repository-pipeline.js';
import { logger } from '../utils/logger.js';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  // Initialize mock clients for testing
  logger.info('Initializing mock clients for testing');

  // Create a mock GitHub client by extending the factory's createMockClient method
  const mockGithubClient = githubClientFactory.createMockClient();
  
  // Extend the mock client with additional methods needed for our test
  mockGithubClient.getRepository = async () => ({ id: 'mock-repo-123', name: 'mock-repo', full_name: 'octocat/mock-repo' });
  mockGithubClient.getContributors = async () => [{ id: 'user-1', login: 'octocat' }];
  mockGithubClient.getRateLimit = async () => ({ remaining: 5000 });
  
  logger.info('Created mock GitHub client');

  // Create a mock Supabase client using the factory's method
  const mockSupabaseClient = supabaseClientFactory.createMockClient();
  logger.info('Created mock Supabase client');

  // Initialize pipeline factory and services
  logger.info('Initializing pipeline factory');
  
  // Initialize the repository processor pipeline
  registerContributorRepositoryPipeline({
    createSupabaseServices: false // Disable automatic creation of Supabase services
  });

  // Load sample data from path
  const samplePath = path.join(__dirname, '../../../DOCS/data-samples/sampleContributorRepositoryData.json');
  let sampleData;
  
  try {
    logger.info(`Loading sample data from path: ${samplePath}`);
    const fileData = fs.readFileSync(samplePath, 'utf8');
    sampleData = JSON.parse(fileData);
  } catch (error) {
    logger.warn(`Sample file not found, using mock data instead. Error: ${error.message}`);
    
    // Create mock data
    sampleData = {
      repositories: [
        {
          id: 'repo-1',
          name: 'awesome-project',
          full_name: 'octocat/awesome-project'
        }
      ],
      contributors: [
        {
          id: 'user-1',
          login: 'octocat',
          name: 'The Octocat'
        },
        {
          id: 'user-2',
          login: 'developer1',
          name: 'Developer One'
        },
        {
          id: 'user-3',
          login: 'developer2',
          name: 'Developer Two'
        }
      ],
      commits: [
        {
          id: 'commit-1',
          sha: 'abc123',
          repository_id: 'repo-1',
          contributor_id: 'user-1',
          message: 'Initial commit',
          additions: 100,
          deletions: 0,
          created_at: '2025-01-01T10:00:00Z'
        },
        {
          id: 'commit-2',
          sha: 'def456',
          repository_id: 'repo-1',
          contributor_id: 'user-1',
          message: 'Update README',
          additions: 10,
          deletions: 5,
          created_at: '2025-01-02T11:00:00Z'
        },
        {
          id: 'commit-3',
          sha: 'ghi789',
          repository_id: 'repo-1',
          contributor_id: 'user-2',
          message: 'Fix bug in login',
          additions: 25,
          deletions: 15,
          created_at: '2025-01-03T09:00:00Z'
        },
        {
          id: 'commit-4',
          sha: 'jkl012',
          repository_id: 'repo-1',
          contributor_id: 'user-3',
          message: 'Add new feature',
          additions: 150,
          deletions: 30,
          created_at: '2025-01-04T14:00:00Z'
        }
      ],
      mergeRequests: [
        {
          id: 'mr-1',
          number: 1,
          repository_id: 'repo-1',
          contributor_id: 'user-2',
          title: 'Add new feature',
          additions: 150,
          deletions: 30,
          created_at: '2025-01-03T08:00:00Z'
        },
        {
          id: 'mr-2',
          number: 2,
          repository_id: 'repo-1',
          contributor_id: 'user-3',
          title: 'Fix critical bug',
          additions: 5,
          deletions: 8,
          created_at: '2025-01-05T09:30:00Z'
        }
      ],
      repoContributors: [
        {
          repository_id: 'repo-1',
          contributor_id: 'user-1',
          commit_count: 5,
          pull_request_count: 1,
          additions: 120,
          deletions: 15,
          contributions_count: 6,
          first_contribution_at: '2024-12-15T10:00:00Z',
          last_contribution_at: '2024-12-31T11:00:00Z'
        }
      ]
    };
  }

  // Process the sample data
  logger.info('Processing contributor-repository relationships...');
  const result = await processContributorRepositoryRelationships(sampleData);

  // Log the results
  logger.info('Contributor-repository relationship processing completed');
  console.log('\nRelationship Results:');
  console.log(JSON.stringify(result.relationships, null, 2));
  
  if (result.errors && result.errors.length > 0) {
    logger.error(`Encountered ${result.errors.length} errors during processing`);
    console.log('\nErrors:');
    console.log(JSON.stringify(result.errors, null, 2));
  } else {
    logger.info('No errors encountered during processing');
  }

  // Print a summary of the processing
  console.log('\nProcessing Summary:');
  console.log(`- Total Relationships: ${result.relationships.length}`);
  
  // Group by repository
  const byRepo = {};
  for (const rel of result.relationships) {
    if (!byRepo[rel.repository_id]) {
      byRepo[rel.repository_id] = [];
    }
    byRepo[rel.repository_id].push(rel);
  }
  
  // Print repository summaries
  for (const [repoId, relationships] of Object.entries(byRepo)) {
    const repo = sampleData.repositories.find(r => r.id === repoId);
    
    console.log(`\nRepository: ${repo ? repo.full_name : repoId}`);
    console.log(`- Contributors: ${relationships.length}`);
    
    // Print contributor summaries
    for (const rel of relationships) {
      const contributor = sampleData.contributors.find(c => c.id === rel.contributor_id);
      console.log(`  - ${contributor ? contributor.name : rel.contributor_id}:`);
      console.log(`    Commits: ${rel.commit_count}, PRs: ${rel.pull_request_count}, Total: ${rel.contributions_count}`);
      console.log(`    Additions: ${rel.additions}, Deletions: ${rel.deletions}`);
      console.log(`    First Contribution: ${rel.first_contribution_at}`);
      console.log(`    Last Contribution: ${rel.last_contribution_at}`);
    }
  }
}

// Run the test
runTest().catch(error => {
  logger.error('Test failed with error', { error });
  process.exit(1);
});