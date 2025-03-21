/**
 * Test script for file slug parsing and generation
 * This script tests the functionality of parseFileSlug and generateFileSlug functions
 */

// In Next.js projects, we can't directly require from the lib folder in Node scripts
// Let's copy the necessary functions here for testing
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
    .substring(0, 50); // Truncate to maximum length
}

function extractGithubId(slug) {
  if (!slug) return null;
  
  // Look for a numeric ID at the end of the slug
  const match = slug.match(/-([0-9a-f]+)$/);
  return match ? match[1] : null;
}

function generateFileSlug(filename, githubId) {
  if (!githubId) {
    throw new Error('GitHub ID is required for file slug generation');
  }
  
  // Convert file paths to URL-friendly format
  // Replace slashes and dots with hyphens for better URL compatibility
  const normalizedFilename = filename.replace(/[\/\.]/g, '-');
  const filenameSlug = toSlug(normalizedFilename);
  
  return `${filenameSlug}-${githubId}`;
}

function parseFileSlug(slug) {
  if (!slug) return null;
  
  // Extract GitHub ID
  const githubId = extractGithubId(slug);
  if (!githubId) return null;
  
  // Remove the ID part to get the filename portion
  const filename = slug.replace(new RegExp(`-${githubId}$`), '');
  return { filename, githubId };
}

// Test case for the original complex file slug
const testOriginalSlug = () => {
  console.log('-----------------------------------------------');
  console.log('Testing original complex file slug');
  
  const filename = 'common/src/main/resources/assets/shouldersurfing/lang/es_mx.json';
  const sha = '7ab835c9bac675a177c81b400d2e76cd5501e6d9';
  
  try {
    const slug = generateFileSlug(filename, sha);
    console.log('Generated slug:', slug);
    
    const parsed = parseFileSlug(slug);
    console.log('Parsed result:', parsed);
    
    if (parsed && parsed.githubId === sha) {
      console.log('✅ SHA extracted correctly');
    } else {
      console.log('❌ SHA extraction failed');
    }
    
    if (parsed && parsed.filename) {
      console.log('✅ Filename parsing succeeded');
    } else {
      console.log('❌ Filename parsing failed');
    }
  } catch (error) {
    console.error('Error during slug testing:', error.message);
  }
};

// Test simplified file slug approach
const testSimplifiedSlug = () => {
  console.log('-----------------------------------------------');
  console.log('Testing simplified file slug approach');
  
  // Extract just the filename without the path
  const filename = 'es_mx.json';
  const sha = '7ab835c9';  // Using shortened SHA
  
  try {
    const slug = generateFileSlug(filename, sha);
    console.log('Generated slug:', slug);
    
    const parsed = parseFileSlug(slug);
    console.log('Parsed result:', parsed);
    
    if (parsed && parsed.githubId === sha) {
      console.log('✅ SHA extracted correctly');
    } else {
      console.log('❌ SHA extraction failed');
    }
  } catch (error) {
    console.error('Error during simplified slug testing:', error.message);
  }
};

// Test slug with numeric ID instead of SHA
const testNumericIdSlug = () => {
  console.log('-----------------------------------------------');
  console.log('Testing slug with numeric ID');
  
  const filename = 'es_mx.json';
  const id = '12345';  // Using a numeric ID
  
  try {
    const slug = generateFileSlug(filename, id);
    console.log('Generated slug:', slug);
    
    const parsed = parseFileSlug(slug);
    console.log('Parsed result:', parsed);
    
    if (parsed && parsed.githubId === id) {
      console.log('✅ ID extracted correctly');
    } else {
      console.log('❌ ID extraction failed');
    }
  } catch (error) {
    console.error('Error during numeric ID slug testing:', error.message);
  }
};

// Test our actual URL
const testActualUrl = () => {
  console.log('-----------------------------------------------');
  console.log('Testing actual URL parsing');
  
  const fileSlug = 'es-mx-json-7ab835c9bac675a177c81b400d2e76cd5501e6d9';
  
  try {
    const parsed = parseFileSlug(fileSlug);
    console.log('Parsed result:', parsed);
    
    if (parsed) {
      console.log('✅ URL parsing succeeded');
      console.log('Filename:', parsed.filename);
      console.log('githubId:', parsed.githubId);
    } else {
      console.log('❌ URL parsing failed');
    }
  } catch (error) {
    console.error('Error during actual URL testing:', error.message);
  }
};

// Run all tests
console.log('=================================================');
console.log('FILE SLUG TESTING');
console.log('=================================================');

testOriginalSlug();
testSimplifiedSlug(); 
testNumericIdSlug();
testActualUrl();

console.log('=================================================');
console.log('TESTING COMPLETE');
console.log('================================================='); 