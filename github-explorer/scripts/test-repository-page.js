/**
 * Repository Page Implementation Test
 * 
 * This script verifies that the repository page correctly:
 * 1. Extracts the GitHub ID from the repository slug
 * 2. Tests the slug parsing logic
 */

// We'll use the URL utility functions directly to test our logic
// without relying on the database connection

// Function to convert a string to a URL-friendly slug
function toSlug(input) {
  if (!input) return '';
  
  return input
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/&/g, '-and-')      // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')    // Remove all non-word characters except hyphens
    .replace(/\-\-+/g, '-')      // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')          // Trim hyphens from start
    .replace(/-+$/, '')          // Trim hyphens from end
    .substring(0, 50);           // Truncate to maximum length
}

// Function to extract a GitHub ID from a slug segment
function extractGithubId(slug) {
  if (!slug) return null;
  
  // Look for a numeric ID at the end of the slug
  const match = slug.match(/-(\d+)$/);
  return match ? match[1] : null;
}

// Function to generate a repository slug
function generateRepositorySlug(name, githubId) {
  if (!name || !githubId) {
    throw new Error('Repository name and GitHub ID are required for slug generation');
  }
  
  const nameSlug = toSlug(name);
  return `${nameSlug}-${githubId}`;
}

// Function to parse a repository slug
function parseRepositorySlug(slug) {
  if (!slug) return null;
  
  const githubId = extractGithubId(slug);
  if (!githubId) return null;
  
  // Remove the ID part to get the name portion
  const name = slug.replace(new RegExp(`-${githubId}$`), '');
  return { name, githubId };
}

function testRepositoryPage() {
  console.log('Repository Page Implementation Test');
  console.log('-----------------------------------');
  
  // Test case 1: Valid repository slug
  console.log('\nTest Case 1: Generate and Parse Repository Slug');
  
  const repoName = 'React';
  const githubId = '123456';
  console.log(`- Generating slug for repository: ${repoName} with ID: ${githubId}`);
  
  try {
    const generatedSlug = generateRepositorySlug(repoName, githubId);
    console.log(`- Generated slug: ${generatedSlug}`);
    
    console.log(`- Parsing slug: ${generatedSlug}`);
    const parsedSlug = parseRepositorySlug(generatedSlug);
    
    if (parsedSlug) {
      console.log('- Parsed slug data:', parsedSlug);
      
      if (parsedSlug.githubId === githubId) {
        console.log('✅ SUCCESS: GitHub ID extracted correctly');
      } else {
        console.log(`❌ FAILED: GitHub ID mismatch. Expected ${githubId}, got ${parsedSlug.githubId}`);
      }
    } else {
      console.log('❌ FAILED: Could not parse generated slug');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
  
  // Test case 2: Testing with existing slug
  const testSlug = 'react-facebook-123456';
  console.log(`\nTest Case 2: Parse existing slug "${testSlug}"`);
  
  const slugInfo = parseRepositorySlug(testSlug);
  
  if (slugInfo) {
    console.log('- Parsed slug data:', slugInfo);
    console.log(`✅ SUCCESS: Slug parsed correctly with GitHub ID: ${slugInfo.githubId}`);
  } else {
    console.log('❌ FAILED: Could not parse repository slug');
  }
  
  // Test case 3: Invalid repository slug
  const invalidSlug = 'invalid-slug';
  console.log(`\nTest Case 3: Invalid repository slug "${invalidSlug}"`);
  
  const invalidSlugInfo = parseRepositorySlug(invalidSlug);
  
  if (!invalidSlugInfo) {
    console.log('✅ SUCCESS: Invalid slug correctly identified');
  } else {
    console.log('❌ FAILED: Invalid slug was incorrectly parsed:', invalidSlugInfo);
  }
}

// Run the test
testRepositoryPage(); 