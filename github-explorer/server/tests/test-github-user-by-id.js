/**
 * Test script to verify fetching a GitHub user by ID
 * 
 * This script tests fetching user data from the GitHub API using
 * user IDs rather than usernames.
 */

import dotenv from 'dotenv';
import path from 'path';
import { Octokit } from '@octokit/rest';
import { fileURLToPath } from 'url';

// Get current directory and resolve path to .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

// Load environment variables from the correct path
dotenv.config({ path: envPath });
console.log(`Loading environment from: ${envPath}`);

// Extract GitHub API token
const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN;

if (!GITHUB_API_TOKEN) {
  console.error('Required GitHub API token is missing!');
  process.exit(1);
}

// Create GitHub client
const octokit = new Octokit({
  auth: GITHUB_API_TOKEN
});

/**
 * Fetch a user by username
 */
async function getUserByUsername(username) {
  try {
    console.log(`Fetching user by username: ${username}`);
    const { data } = await octokit.users.getByUsername({ username });
    return data;
  } catch (error) {
    console.error(`Error fetching user by username ${username}:`, error.message);
    return null;
  }
}

/**
 * Fetch a user by ID
 */
async function getUserById(userId) {
  try {
    console.log(`Fetching user by ID: ${userId}`);
    // Use the new endpoint that accepts user IDs
    const { data } = await octokit.request('GET /user/{id}', {
      id: userId,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    return data;
  } catch (error) {
    console.error(`Error fetching user by ID ${userId}:`, error.message);
    return null;
  }
}

/**
 * Main test function
 */
async function runTest() {
  // Test IDs and usernames from the screenshot
  const testCases = [
    { id: 583231, username: 'octocat' },
    { id: 26817458, username: 'unknown' },
    { id: 19776192, username: 'unknown' }
  ];
  
  for (const { id, username } of testCases) {
    console.log(`\n--- Testing user ID: ${id}, Username: ${username} ---`);
    
    // If we have a valid username, try fetching by username first
    if (username && username !== 'unknown') {
      const userByUsername = await getUserByUsername(username);
      if (userByUsername) {
        console.log('User data by username:', JSON.stringify(userByUsername, null, 2));
      }
    }
    
    // Now fetch by ID
    const userById = await getUserById(id);
    if (userById) {
      console.log('User data by ID:', JSON.stringify(userById, null, 2));
      
      // Compare the username from the ID lookup with our stored username
      if (username !== 'unknown') {
        console.log(`Stored username: ${username}, Actual username from API: ${userById.login}`);
        console.log(`Match: ${username === userById.login ? 'Yes' : 'No'}`);
      } else {
        console.log(`Found username: ${userById.login} for ID ${id}`);
      }
    }
  }
}

// Run the test
runTest()
  .then(() => {
    console.log('\nTest completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error running test:', error);
    process.exit(1);
  }); 