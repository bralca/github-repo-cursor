import * as repositoryQueries from '../lib/database/repositories';
import * as contributorQueries from '../lib/database/contributors';
import * as mergeRequestQueries from '../lib/database/merge-requests';
import * as commitQueries from '../lib/database/commits';
import * as urlUtils from '../lib/url-utils';

/**
 * Test script to verify database query functions for SEO-friendly URLs
 * 
 * This script:
 * 1. Tests slug generation and parsing
 * 2. Tests database queries using slugs
 * 3. Verifies data is returned with all needed SEO fields
 */

const TEST_COUNTS = {
  repositories: 0,
  contributors: 0,
  mergeRequests: 0,
  commits: 0,
  errors: 0,
  total: 0
};

// Helper to log test results
function logResult(entity: string, test: string, success: boolean, details?: string) {
  TEST_COUNTS.total++;
  if (success) {
    console.log(`✅ [${entity}] ${test}`);
    TEST_COUNTS[entity as keyof typeof TEST_COUNTS]++;
  } else {
    console.log(`❌ [${entity}] ${test} ${details ? `- ${details}` : ''}`);
    TEST_COUNTS.errors++;
  }
}

async function testRepositories() {
  console.log("\n📁 Testing Repository Queries\n");
  
  // 1. Get repositories to test with
  console.log("Fetching test repositories...");
  const repositories = await repositoryQueries.getRepositories(1, 3);
  
  if (!repositories.length) {
    logResult('repositories', 'Fetch test repositories', false, 'No repositories found in database');
    return;
  }
  
  for (const repo of repositories) {
    // Test slug generation and parsing
    const slug = urlUtils.generateRepositorySlug(repo.name, repo.github_id.toString());
    logResult('repositories', `Generate slug for ${repo.name}`, !!slug, 
      slug ? `Generated: ${slug}` : 'Failed to generate slug');
    
    const parsedSlug = urlUtils.parseRepositorySlug(slug);
    logResult('repositories', `Parse slug ${slug}`, !!parsedSlug && parsedSlug.githubId === repo.github_id.toString(),
      parsedSlug ? `Extracted ID: ${parsedSlug.githubId}` : 'Failed to parse slug');
    
    // Test getting repository by slug
    const repoBySlug = await repositoryQueries.getRepositoryBySlug(slug);
    logResult('repositories', `Get repository by slug ${slug}`, !!repoBySlug,
      repoBySlug ? `Found: ${repoBySlug.name}` : 'Repository not found by slug');
    
    // Test getting SEO data by slug
    const seoData = await repositoryQueries.getRepositorySEODataBySlug(slug);
    logResult('repositories', `Get SEO data for ${slug}`, 
      !!seoData && 
      'name' in seoData && 
      'description' in seoData && 
      'primary_language' in seoData,
      seoData ? `SEO data includes name, description, etc.` : 'SEO data missing required fields');
  }
  
  // Test error case - invalid slug
  const invalidSlug = "invalid-slug-format";
  const invalidRepo = await repositoryQueries.getRepositoryBySlug(invalidSlug);
  logResult('repositories', `Handle invalid slug ${invalidSlug}`, invalidRepo === null, 
    `Expected null, got ${invalidRepo}`);
}

async function testContributors() {
  console.log("\n👤 Testing Contributor Queries\n");
  
  // 1. Get contributors to test with
  console.log("Fetching test contributors...");
  const contributors = await contributorQueries.getTopContributors(1, 3);
  
  if (!contributors.length) {
    logResult('contributors', 'Fetch test contributors', false, 'No contributors found in database');
    return;
  }
  
  for (const contributor of contributors) {
    // For testing, we need to ensure we have username
    const username = contributor.username || 'user';
    
    // Test slug generation and parsing
    const slug = urlUtils.generateContributorSlug(contributor.name || 'Anonymous', username, contributor.github_id.toString());
    logResult('contributors', `Generate slug for ${username}`, !!slug, 
      slug ? `Generated: ${slug}` : 'Failed to generate slug');
    
    const parsedSlug = urlUtils.parseContributorSlug(slug);
    logResult('contributors', `Parse slug ${slug}`, !!parsedSlug && parsedSlug.githubId === contributor.github_id.toString(),
      parsedSlug ? `Extracted ID: ${parsedSlug.githubId}` : 'Failed to parse slug');
    
    // Test getting contributor by slug
    const contribBySlug = await contributorQueries.getContributorBySlug(slug);
    logResult('contributors', `Get contributor by slug ${slug}`, !!contribBySlug,
      contribBySlug ? `Found: ${contribBySlug.username || 'unnamed'}` : 'Contributor not found by slug');
    
    // Test getting SEO data by slug
    const seoData = await contributorQueries.getContributorSEODataBySlug(slug);
    logResult('contributors', `Get SEO data for ${slug}`, 
      !!seoData && 
      'username' in seoData && 
      'avatar' in seoData,
      seoData ? `SEO data includes username, avatar, etc.` : 'SEO data missing required fields');
  }
  
  // Test error case - invalid slug
  const invalidSlug = "invalid-slug-format";
  const invalidContrib = await contributorQueries.getContributorBySlug(invalidSlug);
  logResult('contributors', `Handle invalid slug ${invalidSlug}`, invalidContrib === null, 
    `Expected null, got ${invalidContrib}`);
}

async function testMergeRequests() {
  console.log("\n🔄 Testing Merge Request Queries\n");
  
  // 1. First get a repository to use for merge requests
  console.log("Fetching test repository...");
  const repositories = await repositoryQueries.getRepositories(1, 1);
  
  if (!repositories.length) {
    logResult('mergeRequests', 'Fetch test repository', false, 'No repository found for merge requests');
    return;
  }
  
  const repository = repositories[0];
  
  // 2. Get merge requests for this repository
  console.log(`Fetching merge requests for repository ${repository.name}...`);
  const mergeRequests = await mergeRequestQueries.getRepositoryMergeRequests(
    repository.github_id.toString(), 1, 3
  );
  
  if (!mergeRequests.length) {
    logResult('mergeRequests', `Fetch merge requests for repo ${repository.github_id}`, false, 'No merge requests found');
    return;
  }
  
  for (const mr of mergeRequests) {
    // Test slug generation and parsing
    const slug = urlUtils.generateMergeRequestSlug(mr.title, mr.github_id.toString());
    logResult('mergeRequests', `Generate slug for merge request #${mr.github_id}`, !!slug, 
      slug ? `Generated: ${slug}` : 'Failed to generate slug');
    
    const parsedSlug = urlUtils.parseMergeRequestSlug(slug);
    logResult('mergeRequests', `Parse slug ${slug}`, !!parsedSlug && parsedSlug.githubId === mr.github_id.toString(),
      parsedSlug ? `Extracted ID: ${parsedSlug.githubId}` : 'Failed to parse slug');
    
    // Test getting merge request by slug
    const mrBySlug = await mergeRequestQueries.getMergeRequestBySlug(slug, repository.github_id.toString());
    logResult('mergeRequests', `Get merge request by slug ${slug}`, !!mrBySlug,
      mrBySlug ? `Found: ${mrBySlug.title}` : 'Merge request not found by slug');
    
    // Test getting SEO data by slug
    const seoData = await mergeRequestQueries.getMergeRequestSEODataBySlug(slug, repository.github_id.toString());
    logResult('mergeRequests', `Get SEO data for ${slug}`, 
      !!seoData && 
      'title' in seoData && 
      'description' in seoData,
      seoData ? `SEO data includes title, description, etc.` : 'SEO data missing required fields');
  }
  
  // Test error case - invalid slug
  const invalidSlug = "invalid-slug-format";
  const invalidMr = await mergeRequestQueries.getMergeRequestBySlug(invalidSlug, repository.github_id.toString());
  logResult('mergeRequests', `Handle invalid slug ${invalidSlug}`, invalidMr === null, 
    `Expected null, got ${invalidMr}`);
}

async function testCommits() {
  console.log("\n📝 Testing Commit Queries\n");
  
  // 1. First get a repository to use for commits
  console.log("Fetching test repository...");
  const repositories = await repositoryQueries.getRepositories(1, 1);
  
  if (!repositories.length) {
    logResult('commits', 'Fetch test repository', false, 'No repository found for commits');
    return;
  }
  
  const repository = repositories[0];
  
  // 2. Get commits for this repository
  console.log(`Fetching commits for repository ${repository.name}...`);
  const commits = await commitQueries.getRepositoryCommits(
    repository.github_id.toString(), 1, 3
  );
  
  if (!commits.length) {
    logResult('commits', `Fetch commits for repo ${repository.github_id}`, false, 'No commits found');
    return;
  }
  
  for (const commit of commits) {
    // Test getting commit by SHA
    const commitBySha = await commitQueries.getCommitBySha(commit.sha, repository.github_id.toString());
    logResult('commits', `Get commit by SHA ${commit.sha.substring(0, 7)}`, !!commitBySha,
      commitBySha ? `Found commit from ${commitBySha.committed_at}` : 'Commit not found by SHA');
    
    // Test getting SEO data by SHA
    const seoData = await commitQueries.getCommitSEODataBySha(commit.sha, repository.github_id.toString());
    logResult('commits', `Get SEO data for ${commit.sha.substring(0, 7)}`, 
      !!seoData && 
      'message' in seoData && 
      'committed_at' in seoData,
      seoData ? `SEO data includes message, date, etc.` : 'SEO data missing required fields');
  }
  
  // Test error case - invalid SHA
  const invalidSha = "invalid-sha";
  const invalidCommit = await commitQueries.getCommitBySha(invalidSha, repository.github_id.toString());
  logResult('commits', `Handle invalid SHA ${invalidSha}`, invalidCommit === null, 
    `Expected null, got ${invalidCommit}`);
}

async function runTests() {
  console.log("🧪 Starting Database Query Tests for SEO-Friendly URLs\n");
  
  await testRepositories();
  await testContributors();
  await testMergeRequests();
  await testCommits();
  
  console.log("\n📊 Test Summary:");
  console.log(`Repository Tests: ${TEST_COUNTS.repositories} passed`);
  console.log(`Contributor Tests: ${TEST_COUNTS.contributors} passed`);
  console.log(`Merge Request Tests: ${TEST_COUNTS.mergeRequests} passed`);
  console.log(`Commit Tests: ${TEST_COUNTS.commits} passed`);
  console.log(`Errors: ${TEST_COUNTS.errors}`);
  console.log(`Total Tests: ${TEST_COUNTS.total}`);
  
  if (TEST_COUNTS.errors === 0) {
    console.log("\n✅ All tests passed! The database query functions are working correctly with SEO-friendly URLs.");
  } else {
    console.log("\n❌ Some tests failed. Please review the error details above.");
  }
}

// Run all tests
runTests().catch(error => {
  console.error("Error running tests:", error);
  process.exit(1);
}); 