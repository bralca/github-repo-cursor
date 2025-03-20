const path = require('path');
const fs = require('fs');

// Dynamically load the URL utility functions from the TypeScript file
// This approach allows us to test without needing to compile TypeScript
const urlUtilsPath = path.resolve(__dirname, '../lib/url-utils.ts');
const urlUtilsContent = fs.readFileSync(urlUtilsPath, 'utf8');

// Extract function implementations
const extractFunction = (content, functionName) => {
  const regex = new RegExp(`export function ${functionName}\\s*\\([^)]*\\)\\s*{[^}]*}`, 'gs');
  const match = content.match(regex);
  return match ? match[0].replace('export function', 'function') : null;
};

// Dynamically evaluate the functions
const toSlug = eval(`(${extractFunction(urlUtilsContent, 'toSlug')})`);
const generateRepositorySlug = eval(`(${extractFunction(urlUtilsContent, 'generateRepositorySlug')})`);
const parseRepositorySlug = eval(`(${extractFunction(urlUtilsContent, 'parseRepositorySlug')})`);
const generateContributorSlug = eval(`(${extractFunction(urlUtilsContent, 'generateContributorSlug')})`);
const parseContributorSlug = eval(`(${extractFunction(urlUtilsContent, 'parseContributorSlug')})`);
const generateMergeRequestSlug = eval(`(${extractFunction(urlUtilsContent, 'generateMergeRequestSlug')})`);
const parseMergeRequestSlug = eval(`(${extractFunction(urlUtilsContent, 'parseMergeRequestSlug')})`);
const buildRepositoryUrl = eval(`(${extractFunction(urlUtilsContent, 'buildRepositoryUrl')})`);
const buildContributorUrl = eval(`(${extractFunction(urlUtilsContent, 'buildContributorUrl')})`);
const buildMergeRequestUrl = eval(`(${extractFunction(urlUtilsContent, 'buildMergeRequestUrl')})`);

/**
 * Test script to verify URL utility functions for SEO-friendly URLs
 * 
 * This script tests both slug generation and parsing
 */

const TEST_COUNTS = {
  repositories: 0,
  contributors: 0,
  mergeRequests: 0,
  total: 0,
  errors: 0
};

// Helper to log test results
function logResult(entity, test, success, details) {
  TEST_COUNTS.total++;
  if (success) {
    console.log(`✅ [${entity}] ${test}`);
    TEST_COUNTS[entity]++;
  } else {
    console.log(`❌ [${entity}] ${test} ${details ? `- ${details}` : ''}`);
    TEST_COUNTS.errors++;
  }
}

// Test repository slug generation and parsing
function testRepositorySlugs() {
  console.log("\n📁 Testing Repository Slug Utilities\n");
  
  const testCases = [
    { name: "React", githubId: "123456", expected: "react-123456" },
    { name: "Vue.js", githubId: "789012", expected: "vuejs-789012" },
    { name: "Next.js Framework", githubId: "345678", expected: "nextjs-framework-345678" },
    { name: "Special@Chars#Repo", githubId: "901234", expected: "specialcharsrepo-901234" },
    { name: "VeryLongRepositoryNameThatShouldBeTruncated", githubId: "567890", expected: "verylongrepositoryname-567890" }
  ];
  
  testCases.forEach(test => {
    // Test slug generation
    const slug = generateRepositorySlug(test.name, test.githubId);
    logResult('repositories', `Generate slug for "${test.name}"`, slug === test.expected,
      slug ? `Got: ${slug}, Expected: ${test.expected}` : 'Failed to generate slug');
    
    // Test slug parsing
    const parsedSlug = parseRepositorySlug(test.expected);
    logResult('repositories', `Parse slug ${test.expected}`, 
      parsedSlug && parsedSlug.githubId === test.githubId,
      parsedSlug ? `Extracted ID: ${parsedSlug.githubId}` : 'Failed to parse slug');
    
    // Test URL building
    const url = buildRepositoryUrl(test.name, test.githubId);
    const expectedUrl = `/${test.expected}`;
    logResult('repositories', `Build URL for "${test.name}"`, url === expectedUrl,
      url ? `Got: ${url}, Expected: ${expectedUrl}` : 'Failed to build URL');
  });
  
  // Test invalid slug parsing
  const invalidSlug = "invalid-slug-format";
  const parsedInvalidSlug = parseRepositorySlug(invalidSlug);
  logResult('repositories', `Handle invalid slug format`, parsedInvalidSlug === null,
    `Expected null, got ${parsedInvalidSlug}`);
}

// Test contributor slug generation and parsing
function testContributorSlugs() {
  console.log("\n👤 Testing Contributor Slug Utilities\n");
  
  const testCases = [
    { name: "John Doe", username: "johndoe", githubId: "123456", expected: "john-doe-johndoe-123456" },
    { name: "Jane Smith", username: "jsmith", githubId: "789012", expected: "jane-smith-jsmith-789012" },
    { name: null, username: "anonymous", githubId: "345678", expected: "anonymous-345678" },
    { name: "Special@Chars#User", username: "specialuser", githubId: "901234", expected: "specialcharsuser-specialuser-901234" },
    { name: "VeryLongContributorNameThatShouldBeTruncated", username: "longname", githubId: "567890", expected: "verylongcontributorna-longname-567890" }
  ];
  
  testCases.forEach(test => {
    // Test slug generation
    const slug = generateContributorSlug(test.name || undefined, test.username, test.githubId);
    logResult('contributors', `Generate slug for "${test.username}"`, slug === test.expected,
      slug ? `Got: ${slug}, Expected: ${test.expected}` : 'Failed to generate slug');
    
    // Test slug parsing
    const parsedSlug = parseContributorSlug(test.expected);
    logResult('contributors', `Parse slug ${test.expected}`, 
      parsedSlug && parsedSlug.githubId === test.githubId,
      parsedSlug ? `Extracted ID: ${parsedSlug.githubId}` : 'Failed to parse slug');
    
    // Test URL building
    const url = buildContributorUrl(test.name || undefined, test.username, test.githubId);
    const expectedUrl = `/contributors/${test.expected}`;
    logResult('contributors', `Build URL for "${test.username}"`, url === expectedUrl,
      url ? `Got: ${url}, Expected: ${expectedUrl}` : 'Failed to build URL');
  });
  
  // Test invalid slug parsing
  const invalidSlug = "invalid-slug-format";
  const parsedInvalidSlug = parseContributorSlug(invalidSlug);
  logResult('contributors', `Handle invalid slug format`, parsedInvalidSlug === null,
    `Expected null, got ${parsedInvalidSlug}`);
}

// Test merge request slug generation and parsing
function testMergeRequestSlugs() {
  console.log("\n🔄 Testing Merge Request Slug Utilities\n");
  
  const testCases = [
    { title: "Add new feature", githubId: "123456", expected: "add-new-feature-123456" },
    { title: "Fix critical bug", githubId: "789012", expected: "fix-critical-bug-789012" },
    { title: "Update documentation", githubId: "345678", expected: "update-documentation-345678" },
    { title: "Special@Chars#MR", githubId: "901234", expected: "specialcharsmr-901234" },
    { title: "VeryLongMergeRequestTitleThatShouldBeTruncated", githubId: "567890", expected: "verylongmergerequestt-567890" }
  ];
  
  const repoName = "test-repo";
  const repoId = "999999";
  const repoSlug = generateRepositorySlug(repoName, repoId);
  
  testCases.forEach(test => {
    // Test slug generation
    const slug = generateMergeRequestSlug(test.title, test.githubId);
    logResult('mergeRequests', `Generate slug for "${test.title}"`, slug === test.expected,
      slug ? `Got: ${slug}, Expected: ${test.expected}` : 'Failed to generate slug');
    
    // Test slug parsing
    const parsedSlug = parseMergeRequestSlug(test.expected);
    logResult('mergeRequests', `Parse slug ${test.expected}`, 
      parsedSlug && parsedSlug.githubId === test.githubId,
      parsedSlug ? `Extracted ID: ${parsedSlug.githubId}` : 'Failed to parse slug');
    
    // Test URL building
    const url = buildMergeRequestUrl(repoName, repoId, test.title, test.githubId);
    const expectedUrl = `/${repoSlug}/merge-requests/${test.expected}`;
    logResult('mergeRequests', `Build URL for "${test.title}"`, url === expectedUrl,
      url ? `Got: ${url}, Expected: ${expectedUrl}` : 'Failed to build URL');
  });
  
  // Test invalid slug parsing
  const invalidSlug = "invalid-slug-format";
  const parsedInvalidSlug = parseMergeRequestSlug(invalidSlug);
  logResult('mergeRequests', `Handle invalid slug format`, parsedInvalidSlug === null,
    `Expected null, got ${parsedInvalidSlug}`);
}

function runTests() {
  console.log("🧪 Starting URL Utility Tests for SEO-Friendly URLs\n");
  
  testRepositorySlugs();
  testContributorSlugs();
  testMergeRequestSlugs();
  
  console.log("\n📊 Test Summary:");
  console.log(`Repository Tests: ${TEST_COUNTS.repositories} passed`);
  console.log(`Contributor Tests: ${TEST_COUNTS.contributors} passed`);
  console.log(`Merge Request Tests: ${TEST_COUNTS.mergeRequests} passed`);
  console.log(`Errors: ${TEST_COUNTS.errors}`);
  console.log(`Total Tests: ${TEST_COUNTS.total}`);
  
  if (TEST_COUNTS.errors === 0) {
    console.log("\n✅ All tests passed! The URL utility functions are working correctly for SEO-friendly URLs.");
  } else {
    console.log("\n❌ Some tests failed. Please review the error details above.");
  }
}

// Run all tests
try {
  runTests();
} catch (error) {
  console.error("Error running tests:", error);
  process.exit(1);
} 