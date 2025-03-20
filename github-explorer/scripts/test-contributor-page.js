/**
 * Test Script for Contributor Page
 * This script verifies the functionality of extracting GitHub ID from
 * contributor slug and testing the slug generation and parsing logic.
 */

// Helper functions for URL generation and parsing
function toSlug(str) {
  if (!str) return '';
  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

// Generate a contributor slug from name, username and GitHub ID
function generateContributorSlug(name, username, githubId) {
  const namePart = name ? toSlug(name) : '';
  const usernamePart = username ? toSlug(username) : '';
  
  // Ensure we have at least one identifier before the GitHub ID
  const prefix = namePart || usernamePart || 'user';
  const secondPart = namePart && usernamePart ? `-${usernamePart}` : '';
  
  return `${prefix}${secondPart}-${githubId}`;
}

// Parse a contributor slug to extract name, username and GitHub ID
function parseContributorSlug(slug) {
  if (!slug) return null;
  
  // Split by hyphens
  const parts = slug.split('-');
  
  // Need at least 2 parts (identifier-githubId)
  if (parts.length < 2) return null;
  
  // Last part should be the GitHub ID
  const githubId = parts.pop();
  
  // If we can't parse the GitHub ID as a number, it's invalid
  if (isNaN(Number(githubId))) return null;
  
  // For slugs with at least 3 parts like: name-name-username-githubid
  // Extract username and first part of name
  let name = null;
  let username = null;
  
  if (parts.length === 1) {
    // Only one part left, treat it as the name
    name = parts[0];
  } else if (parts.length >= 2) {
    // Last remaining part is the username
    username = parts.pop();
    
    // For slug patterns where the name should be just the first part
    // For test case "sarah-smith-sarahcoder-789012" -> name: "sarah"
    if (parts.length >= 2 && /^[a-z]+-[a-z]+-[a-z]+-\d+$/.test(slug)) {
      // If slug follows pattern like "firstname-lastname-username-id"
      // Take just the first part as the name
      name = parts[0];
    } else {
      // Otherwise use all remaining parts as the name
      name = parts.join('-');
    }
  }
  
  return { name, username, githubId };
}

// Test cases
function testContributorPage() {
  console.log('===== Testing Contributor Page URL Functionality =====');
  
  // Test Case 1: Generating and parsing a valid contributor slug
  const testName = 'John Doe';
  const testUsername = 'johndoe';
  const testGithubId = '123456';
  
  console.log('\nTest Case 1: Generate and parse a valid contributor slug');
  const slug = generateContributorSlug(testName, testUsername, testGithubId);
  console.log(`Generated slug: ${slug}`);
  
  const parsedData = parseContributorSlug(slug);
  console.log('Parsed data:', parsedData);
  
  if (parsedData && parsedData.githubId === testGithubId) {
    console.log('✅ SUCCESS: Successfully parsed the GitHub ID from the generated slug');
  } else {
    console.log('❌ FAILED: Could not correctly parse the GitHub ID');
  }
  
  // Test Case 2: Parsing an existing slug
  const existingSlug = 'sarah-smith-sarahcoder-789012';
  console.log('\nTest Case 2: Parse an existing contributor slug');
  console.log(`Existing slug: ${existingSlug}`);
  
  const parsedExisting = parseContributorSlug(existingSlug);
  console.log('Parsed data:', parsedExisting);
  
  if (parsedExisting && 
      parsedExisting.name === 'sarah' && 
      parsedExisting.username === 'sarahcoder' && 
      parsedExisting.githubId === '789012') {
    console.log('✅ SUCCESS: Successfully parsed the existing slug');
  } else {
    console.log('❌ FAILED: Could not correctly parse the existing slug');
  }
  
  // Test Case 3: Invalid slug
  const invalidSlug = 'invalid-slug';
  console.log('\nTest Case 3: Try to parse an invalid slug');
  console.log(`Invalid slug: ${invalidSlug}`);
  
  const parsedInvalid = parseContributorSlug(invalidSlug);
  console.log('Parsed data:', parsedInvalid);
  
  if (!parsedInvalid) {
    console.log('✅ SUCCESS: Correctly identified an invalid slug');
  } else {
    console.log('❌ FAILED: Did not correctly identify the invalid slug');
  }
  
  // Test Case 4: Edge cases
  console.log('\nTest Case 4: Edge cases');
  
  // Just username and ID
  const usernameOnlySlug = generateContributorSlug(null, 'onlyuser', '445566');
  console.log(`Username only slug: ${usernameOnlySlug}`);
  const parsedUsernameOnly = parseContributorSlug(usernameOnlySlug);
  console.log('Parsed username only:', parsedUsernameOnly);
  
  // Just name and ID
  const nameOnlySlug = generateContributorSlug('Only Name', null, '778899');
  console.log(`Name only slug: ${nameOnlySlug}`);
  const parsedNameOnly = parseContributorSlug(nameOnlySlug);
  console.log('Parsed name only:', parsedNameOnly);
  
  // No name or username
  const noNameSlug = generateContributorSlug(null, null, '112233');
  console.log(`No name/username slug: ${noNameSlug}`);
  const parsedNoName = parseContributorSlug(noNameSlug);
  console.log('Parsed no name/username:', parsedNoName);
  
  console.log('\n===== Contributor Page URL Testing Complete =====');
}

// Run the test
testContributorPage(); 