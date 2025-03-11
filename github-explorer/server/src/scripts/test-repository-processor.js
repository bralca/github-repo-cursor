import { pipelineFactory } from '../pipeline/core/pipeline-factory.js';
import { registerRepositoryProcessorPipeline, processRepository } from '../pipeline/stages/repository-processor-pipeline.js';
import { logger } from '../utils/logger.js';
import { githubClientFactory } from '../services/github/github-client.js';
import { supabaseClientFactory } from '../services/supabase/supabase-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
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
    
    // Register the repository processor pipeline
    registerRepositoryProcessorPipeline({
      timeframeInDays: 30 // Process last 30 days of data
    });
    
    // Load sample repository data
    const sampleDataPath = path.resolve(__dirname, '../../../DOCS/data-samples/sampleRepository.json');
    logger.info(`Loading sample repository data from path: ${sampleDataPath}`);
    
    let repositoryData;
    try {
      const fileData = fs.readFileSync(sampleDataPath, 'utf8');
      repositoryData = JSON.parse(fileData);
      logger.info('Sample repository data loaded successfully');
    } catch (error) {
      // If sample file doesn't exist, create mock data
      logger.warn(`Sample file not found, using mock repository data instead. Error: ${error.message}`);
      repositoryData = {
        id: 'mock-repo-123',
        full_name: 'octocat/mock-repo',
        description: 'A mock repository for testing',
        stargazers_count: 250,
        forks_count: 120,
        language: 'JavaScript',
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };
    }
    
    // Create some mock commits for the repository
    const mockCommits = [];
    const now = new Date();
    for (let i = 0; i < 50; i++) {
      const commitDate = new Date(now);
      commitDate.setDate(now.getDate() - Math.floor(Math.random() * 45)); // Random date in the last 45 days
      
      mockCommits.push({
        id: `commit-${i}`,
        repository_id: repositoryData.id,
        sha: `mock-sha-${i}`,
        message: `Mock commit message ${i}`,
        authored_at: commitDate.toISOString(),
        committed_at: commitDate.toISOString(),
        author_id: `author-${Math.floor(Math.random() * 5)}` // One of 5 random authors
      });
    }
    
    // Create some mock contributors
    const mockContributors = [];
    for (let i = 0; i < 5; i++) {
      mockContributors.push({
        id: `author-${i}`,
        login: `contributor-${i}`,
        name: `Contributor ${i}`,
        avatar_url: `https://github.com/avatar-${i}.png`,
        type: 'User'
      });
    }
    
    // Process the repository
    logger.info('Processing repository data...');
    const result = await processRepository(repositoryData, {
      commits: mockCommits,
      contributors: mockContributors
    });
    
    // Display repository statistics
    logger.info('Repository processing completed');
    console.log('\nRepository Statistics:');
    console.log(JSON.stringify(result.statistics, null, 2));
    
    // Check for errors
    if (result.errors.length > 0) {
      logger.error('Errors encountered during processing:', result.errors);
    } else {
      logger.info('No errors encountered during processing');
    }
    
    // Provide a summary
    console.log('\nProcessing Summary:');
    console.log('- Repository ID:', repositoryData.id);
    console.log('- Repository Name:', repositoryData.full_name);
    console.log('- Commits Analyzed:', mockCommits.length);
    console.log('- Contributors:', mockContributors.length);
    console.log('- Health Score:', result.statistics?.health_score || 'N/A');
    console.log('- Primary Language:', result.statistics?.language_breakdown?.primary_language || 'N/A');
    
    // If commit frequency is computed, display summary
    if (result.statistics?.commit_frequency) {
      console.log('- Daily Commit Average:', result.statistics.commit_frequency.daily_average.toFixed(2));
      console.log('- Weekly Commit Average:', result.statistics.commit_frequency.weekly_average.toFixed(2));
    }
    
    // If star history is computed, display summary
    if (result.statistics?.star_history) {
      console.log('- Current Stars:', result.statistics.star_history.current_stars);
      console.log('- Star Growth Rate:', result.statistics.star_history.star_growth_rate.toFixed(2), 'per day');
    }
    
  } catch (error) {
    logger.error('Test script failed:', error);
    console.error(error);
  }
}

main(); 