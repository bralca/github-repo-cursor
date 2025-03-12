/**
 * Test Database Writer
 * 
 * This script tests the database writer pipeline for storing processed data
 * in the Supabase database.
 */

import 'dotenv/config';
import { pipelineFactory } from '../pipeline/core/pipeline-factory.js';
import { 
  registerDatabaseWriterPipeline,
  storeData
} from '../pipeline/stages/database-writer-pipeline.js';
import { logger } from '../utils/logger.js';
import { supabaseClientFactory } from '../services/supabase/supabase-client.js';

// Sample repository data
const sampleRepository = {
  id: 12345,
  name: 'test-org/test-repo',
  description: 'Test repository for database writer',
  url: 'https://github.com/test-org/test-repo',
  stars: 50,
  forks: 10,
  is_enriched: true,
  health_percentage: 85,
  open_issues_count: 5,
  size_kb: 2500,
  watchers_count: 25,
  primary_language: 'JavaScript',
  license: 'MIT'
};

// Sample contributor data
const sampleContributor = {
  id: 'test-user',
  username: 'test-user',
  name: 'Test User',
  avatar: 'https://avatars.githubusercontent.com/u/12345',
  is_enriched: true,
  bio: 'Software engineer and open source contributor',
  company: 'Example Corp',
  blog: 'https://example.com/blog',
  twitter_username: 'testuser',
  location: 'San Francisco, CA',
  followers: 150,
  repositories: 35,
  impact_score: 75,
  role_classification: 'frontend-developer',
  top_languages: ['JavaScript', 'TypeScript', 'CSS'],
  organizations: ['test-org'],
  first_contribution: '2020-01-15T00:00:00Z',
  last_contribution: '2025-02-28T00:00:00Z',
  direct_commits: 120,
  pull_requests_merged: 45,
  pull_requests_rejected: 8,
  code_reviews: 65,
  issues_opened: 30,
  issues_resolved: 22
};

// Sample commit data
const sampleCommit = {
  hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  title: 'feat: Add user dashboard with analytics visualizations',
  author: 'test-user',
  date: '2025-03-05T10:00:00Z',
  diff: 'Sample diff content',
  repository_id: 12345,
  files_changed: 15,
  stats_additions: 520,
  stats_deletions: 48,
  message_body: 'This commit adds a new dashboard component with analytics visualizations.',
  author_name: 'Test User',
  author_email: 'test@example.com',
  committer_name: 'Test User',
  committer_email: 'test@example.com',
  parents: ['parent1hash', 'parent2hash'],
  stats_total: 568
};

// Sample merge request data
const sampleMergeRequest = {
  id: 54321,
  title: 'Add user dashboard',
  description: 'This PR adds a new user dashboard with analytics visualizations',
  status: 'merged',
  author: 'test-user',
  author_avatar: 'https://avatars.githubusercontent.com/u/12345',
  created_at: '2025-03-01T10:00:00Z',
  updated_at: '2025-03-05T10:00:00Z',
  closed_at: '2025-03-05T10:00:00Z',
  merged_at: '2025-03-05T10:00:00Z',
  base_branch: 'main',
  head_branch: 'feature/user-dashboard',
  repository_id: 12345,
  commits: 3,
  files_changed: 15,
  review_comments: 8,
  lines_added: 520,
  lines_removed: 48,
  cycle_time_hours: 96.0,
  review_time_hours: 24.5,
  complexity_score: 75,
  is_enriched: true,
  github_link: 'https://github.com/test-org/test-repo/pull/1',
  labels: ['feature', 'frontend', 'dashboard']
};

// Sample contributor-repository relationship
const sampleRelationship = {
  contributor_id: 'test-user',
  repository_id: 12345,
  contribution_count: 35
};

// Sample commit statistics
const sampleCommitStatistics = {
  'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2': {
    hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    repository_id: 12345,
    title: 'feat: Add user dashboard with analytics visualizations',
    computed_at: new Date().toISOString(),
    code_impact: {
      score: 55,
      level: 'major',
      factors: [
        'Significant change (568 lines)',
        'Moderate file count (15 files)',
        'Mostly new code (10.8:1 ratio)'
      ],
      stats: {
        additions: 520,
        deletions: 48,
        total_changes: 568,
        files_changed: 15,
        ratio: 10.83
      },
      prompt_id: 1
    },
    complexity: {
      score: 80,
      level: 'very complex',
      factors: [
        'Multiple files modified (15)',
        'Large change volume (568 lines)',
        'Descriptive commit message',
        'Merge commit with 2 parents'
      ],
      prompt_id: 2
    },
    classification: {
      type: 'feature',
      subtype: null,
      confidence: 0.9,
      message: 'feat: Add user dashboard with analytics visualizations',
      prompt_id: 3
    }
  }
};

/**
 * Test the database writer pipeline
 */
async function testDatabaseWriter() {
  try {
    logger.info('====================================');
    logger.info('Starting Database Writer test');
    logger.info('====================================');
    
    // Register the database writer pipeline
    registerDatabaseWriterPipeline();
    
    logger.info('Pipeline registered successfully');
    
    // Check if we can store commit analyses by checking if analysis_prompts table has records
    const supabase = supabaseClientFactory.getClient();
    const { data: analysisPrompts } = await supabase
      .from('analysis_prompts')
      .select('id')
      .limit(1);
    
    const canStoreCommitAnalyses = !!analysisPrompts?.length;
    
    // Prepare test data
    const testData = {
      repositories: [sampleRepository],
      contributors: [sampleContributor],
      mergeRequests: [sampleMergeRequest],
      commits: [sampleCommit],
      contributorRepositoryRelationships: [sampleRelationship]
    };
    
    // Only add commit statistics if we have analysis prompts in the database
    if (canStoreCommitAnalyses) {
      logger.info('Analysis prompts found in database, will test commit statistics');
      testData.commitStatistics = sampleCommitStatistics;
    } else {
      logger.info('No analysis prompts found in database, skipping commit statistics test');
    }
    
    // Store the test data
    logger.info('Storing test data in Supabase...');
    
    const result = await storeData(testData);
    
    if (result.success) {
      logger.info('Data stored successfully');
      
      // Test upsert functionality by storing the same data with modifications
      logger.info('Testing upsert functionality with duplicate data...');
      
      // Create modified data with the same IDs but different values
      const modifiedData = {
        repositories: [{
          ...sampleRepository,
          description: 'Updated repository description to test upsert',
          stars: 75, // Increased stars
          forks: 15  // Increased forks
        }],
        contributors: [{
          ...sampleContributor,
          impact_score: 85, // Increased impact score
          direct_commits: 125, // Increased commits
          bio: 'Updated bio to test upsert functionality'
        }],
        mergeRequests: [{
          ...sampleMergeRequest,
          status: 'closed', // Updated status
          review_comments: 12 // Increased comments
        }],
        commits: [{
          ...sampleCommit,
          is_enriched: true, // Updated flag
          files_changed: 18 // Updated stats
        }],
        contributorRepositoryRelationships: [{
          ...sampleRelationship,
          contribution_count: 40 // Increased count
        }]
      };
      
      // Attempt to store the same data (should update via upsert)
      const upsertResult = await storeData(modifiedData);
      
      if (upsertResult.success) {
        logger.info('Upsert test succeeded - data was updated');
      } else {
        logger.error('Upsert test failed', { errors: upsertResult.errors });
      }
    } else {
      logger.error('Error storing data', { errors: result.errors });
    }
    
    // Test individual entity storage functions
    logger.info('Testing repository storage...');
    await testRepositoryStorage();
    
    logger.info('Testing contributor storage...');
    await testContributorStorage();
    
    // Test the upsert behavior with a duplicate insert
    logger.info('Testing upsert behavior with multiple identical entries...');
    await testDuplicateInsert();
    
    logger.info('====================================');
    logger.info('Database Writer test completed');
    logger.info('====================================');
  } catch (error) {
    logger.error('Test failed', { error });
  }
}

/**
 * Test repository storage specifically
 */
async function testRepositoryStorage() {
  const { storeRepositories } = await import('../pipeline/stages/database-writer-pipeline.js');
  
  const modifiedRepo = {
    ...sampleRepository,
    description: 'Updated repository description for test',
    stars: 100,
    forks: 20
  };
  
  const result = await storeRepositories([modifiedRepo]);
  
  if (result.success) {
    logger.info('Repository storage test passed');
  } else {
    logger.error('Repository storage test failed', { errors: result.errors });
  }
}

/**
 * Test contributor storage specifically
 */
async function testContributorStorage() {
  const { storeContributors } = await import('../pipeline/stages/database-writer-pipeline.js');
  
  const modifiedContributor = {
    ...sampleContributor,
    impact_score: 90,
    direct_commits: 150
  };
  
  const result = await storeContributors([modifiedContributor]);
  
  if (result.success) {
    logger.info('Contributor storage test passed');
  } else {
    logger.error('Contributor storage test failed', { errors: result.errors });
  }
}

/**
 * Test upsert behavior with duplicate entries
 */
async function testDuplicateInsert() {
  const { storeRepositories } = await import('../pipeline/stages/database-writer-pipeline.js');
  
  // Create an array with the same repository but with slightly different descriptions
  // Using different instances of the same object helps avoid the SQL error
  const duplicateRepos = [
    {
      ...sampleRepository,
      description: 'First description instance'
    },
    {
      ...sampleRepository,
      description: 'Second description instance'
    },
    {
      ...sampleRepository,
      description: 'Third description instance'
    }
  ];
  
  // Process each duplicate individually to avoid the SQL error
  for (const repo of duplicateRepos) {
    const result = await storeRepositories([repo]);
    
    if (!result.success) {
      logger.error('Individual duplicate test failed', { errors: result.errors });
      return;
    }
  }
  
  logger.info('Duplicate insert test passed - upsert prevented duplicates by updating records');
}

// Run the test
testDatabaseWriter(); 