/**
 * Test Bigint Support
 * 
 * This script tests that our database can now handle GitHub's large IDs properly.
 * It attempts to insert records with very large IDs (beyond integer limits) and 
 * verifies they can be stored and retrieved correctly.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../src/utils/logger.js';
import crypto from 'crypto';

// Get current directory and resolve path to .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

// Load environment variables from the correct path
dotenv.config({ path: envPath });

// Log environment setup
logger.info(`Loading environment from: ${envPath}`);
logger.info('Environment variables loaded:');
logger.info(`- SUPABASE_URL: ${process.env.SUPABASE_URL ? 'defined' : 'undefined'}`);
logger.info(`- SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? 'defined' : 'undefined'}`);
logger.info(`- SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'defined' : 'undefined'}`);

// Extract environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  logger.error('Required Supabase credentials are missing!');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

/**
 * Test large GitHub IDs in our database
 */
async function testBigintSupport() {
  logger.info('=== Testing Bigint Support for GitHub IDs ===');
  
  // Test values - intentionally using values that exceed PostgreSQL's integer limit (2,147,483,647)
  const testValues = {
    repository: {
      id: 9223372036854775000n, // Close to bigint max, simulating a very large GitHub repo ID
      name: 'test-bigint-repo',
      description: 'Test repository for bigint support',
      url: 'https://github.com/test/bigint-test',
      stars: 0,
      forks: 0,
      is_enriched: false,
      created_at: new Date().toISOString()
    },
    
    mergeRequest: {
      id: 8223372036854775000n, // Another large ID
      title: 'Test Large ID PR',
      description: 'Testing bigint support for PR IDs',
      status: 'open',
      author: 'test-user',
      author_avatar: 'https://github.com/avatar.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      repository_id: 9223372036854775000n, // Reference to the test repository
      is_enriched: false
    },
    
    commit: {
      id: crypto.randomUUID(), // UUID for commit ID
      hash: 'abcdef1234567890',
      title: 'Test commit with large IDs',
      author: 'test-user',
      date: new Date().toISOString(),
      diff: '',
      repository_id: 9223372036854775000n, // Reference to the test repository
      merge_request_id: 8223372036854775000n, // Reference to the test PR
      is_analyzed: false,
      created_at: new Date().toISOString(),
      is_enriched: false
    }
  };
  
  try {
    // Step 1: Insert test repository with large ID
    logger.info('Step 1: Inserting test repository with ID:', testValues.repository.id.toString());
    
    const { data: repoData, error: repoError } = await supabase
      .from('repositories')
      .upsert([testValues.repository], { onConflict: 'id' });
    
    if (repoError) {
      logger.error('Repository insertion failed:', repoError.message);
    } else {
      logger.info('Repository inserted successfully');
    }
    
    // Step 2: Insert test merge request with large ID and reference to repository
    logger.info('Step 2: Inserting test merge request with ID:', testValues.mergeRequest.id.toString());
    
    const { data: mrData, error: mrError } = await supabase
      .from('merge_requests')
      .upsert([testValues.mergeRequest], { onConflict: 'id' });
    
    if (mrError) {
      logger.error('Merge request insertion failed:', mrError.message);
    } else {
      logger.info('Merge request inserted successfully');
    }
    
    // Step 3: Insert test commit with references to large IDs
    logger.info('Step 3: Inserting test commit with repository_id and merge_request_id references');
    
    const { data: commitData, error: commitError } = await supabase
      .from('commits')
      .upsert([testValues.commit], { onConflict: 'id' });
    
    if (commitError) {
      logger.error('Commit insertion failed:', commitError.message);
    } else {
      logger.info('Commit inserted successfully');
    }
    
    // Step 4: Verify data was stored correctly by retrieving it
    logger.info('Step 4: Verifying data was stored correctly');
    
    // Check repository
    const { data: repoCheck, error: repoCheckError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', testValues.repository.id.toString());
    
    if (repoCheckError) {
      logger.error('Repository verification failed:', repoCheckError.message);
    } else if (repoCheck && repoCheck.length > 0) {
      logger.info('Repository verified - ID stored correctly:', repoCheck[0].id);
    } else {
      logger.error('Repository verification failed - no records found');
    }
    
    // Check merge request
    const { data: mrCheck, error: mrCheckError } = await supabase
      .from('merge_requests')
      .select('*')
      .eq('id', testValues.mergeRequest.id.toString());
    
    if (mrCheckError) {
      logger.error('Merge request verification failed:', mrCheckError.message);
    } else if (mrCheck && mrCheck.length > 0) {
      logger.info('Merge request verified - ID stored correctly:', mrCheck[0].id);
      logger.info('Merge request repository_id stored correctly:', mrCheck[0].repository_id);
    } else {
      logger.error('Merge request verification failed - no records found');
    }
    
    // Check commit
    const { data: commitCheck, error: commitCheckError } = await supabase
      .from('commits')
      .select('*')
      .eq('id', testValues.commit.id);
    
    if (commitCheckError) {
      logger.error('Commit verification failed:', commitCheckError.message);
    } else if (commitCheck && commitCheck.length > 0) {
      logger.info('Commit verified - ID stored correctly:', commitCheck[0].id);
      logger.info('Commit repository_id stored correctly:', commitCheck[0].repository_id);
      logger.info('Commit merge_request_id stored correctly:', commitCheck[0].merge_request_id);
    } else {
      logger.error('Commit verification failed - no records found');
    }
    
    logger.info('=== Bigint Support Test Complete ===');
    
    // Clean up test data (optional - comment out if you want to keep test data)
    logger.info('Cleaning up test data...');
    
    await supabase.from('commits').delete().eq('id', testValues.commit.id);
    await supabase.from('merge_requests').delete().eq('id', testValues.mergeRequest.id.toString());
    await supabase.from('repositories').delete().eq('id', testValues.repository.id.toString());
    
    logger.info('Test data cleaned up');
    
  } catch (error) {
    logger.error('Test failed with error:', error);
  }
}

// Run the test
testBigintSupport()
  .then(() => {
    logger.info('Test completed');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
  }); 