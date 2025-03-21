// Simple navigation test file
// Run with: node navigation.test.js

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Mock the URL utilities we'll test against
const urlUtils = {
  generateRepositorySlug: (name, githubId) => `${name.toLowerCase().replace(/[^\w-]+/g, '-')}-${githubId}`,
  parseRepositorySlug: (slug) => {
    const parts = slug.split('-');
    const githubId = parts.pop();
    const name = parts.join('-');
    return { name, githubId };
  },
  
  generateContributorSlug: (name, username, githubId) => 
    `${name.toLowerCase().replace(/[^\w-]+/g, '-')}-${username.toLowerCase()}-${githubId}`,
  parseContributorSlug: (slug) => {
    const parts = slug.split('-');
    const githubId = parts.pop();
    const username = parts.pop();
    const name = parts.join('-');
    return { name, username, githubId };
  },
  
  buildRepositoryUrl: (repository) => 
    `/${urlUtils.generateRepositorySlug(repository.name, repository.github_id)}`,
  
  buildContributorUrl: (contributor) => 
    `/contributors/${urlUtils.generateContributorSlug(contributor.name, contributor.username, contributor.github_id)}`,
  
  buildMergeRequestUrl: (repository, mergeRequest) => 
    `${urlUtils.buildRepositoryUrl(repository)}/merge-requests/${mergeRequest.title.toLowerCase().replace(/[^\w-]+/g, '-')}-${mergeRequest.github_id}`
};

// Test data
const testData = {
  repository: {
    name: 'React',
    github_id: '10270250'
  },
  contributor: {
    name: 'Dan Abramov',
    username: 'gaearon',
    github_id: '810438'
  },
  mergeRequest: {
    title: 'Add Concurrent Mode',
    github_id: '987654'
  }
};

// Test functions
function testRepositorySlug() {
  console.log('Testing repository slug generation and parsing...');
  
  const slug = urlUtils.generateRepositorySlug(testData.repository.name, testData.repository.github_id);
  assert.strictEqual(slug, 'react-10270250', 'Repository slug generation failed');
  
  const parsed = urlUtils.parseRepositorySlug(slug);
  assert.strictEqual(parsed.name, 'react', 'Repository name parsing failed');
  assert.strictEqual(parsed.githubId, '10270250', 'Repository GitHub ID parsing failed');
  
  console.log('✓ Repository slug tests passed');
}

function testContributorSlug() {
  console.log('Testing contributor slug generation and parsing...');
  
  const slug = urlUtils.generateContributorSlug(
    testData.contributor.name, 
    testData.contributor.username, 
    testData.contributor.github_id
  );
  assert.strictEqual(slug, 'dan-abramov-gaearon-810438', 'Contributor slug generation failed');
  
  const parsed = urlUtils.parseContributorSlug(slug);
  assert.strictEqual(parsed.name, 'dan-abramov', 'Contributor name parsing failed');
  assert.strictEqual(parsed.username, 'gaearon', 'Contributor username parsing failed');
  assert.strictEqual(parsed.githubId, '810438', 'Contributor GitHub ID parsing failed');
  
  console.log('✓ Contributor slug tests passed');
}

function testUrlBuilding() {
  console.log('Testing URL building for different entities...');
  
  const repoUrl = urlUtils.buildRepositoryUrl(testData.repository);
  assert.strictEqual(repoUrl, '/react-10270250', 'Repository URL building failed');
  
  const contributorUrl = urlUtils.buildContributorUrl(testData.contributor);
  assert.strictEqual(contributorUrl, '/contributors/dan-abramov-gaearon-810438', 'Contributor URL building failed');
  
  const mrUrl = urlUtils.buildMergeRequestUrl(testData.repository, testData.mergeRequest);
  assert.strictEqual(
    mrUrl, 
    '/react-10270250/merge-requests/add-concurrent-mode-987654', 
    'Merge request URL building failed'
  );
  
  console.log('✓ URL building tests passed');
}

function testUrlEdgeCases() {
  console.log('Testing URL generation edge cases...');
  
  // Test special characters
  const specialRepo = { name: 'React & Redux!', github_id: '12345' };
  const specialSlug = urlUtils.generateRepositorySlug(specialRepo.name, specialRepo.github_id);
  assert.strictEqual(specialSlug, 'react-redux--12345', 'Special character handling failed');
  
  // Test empty name
  const emptyNameRepo = { name: '', github_id: '12345' };
  const emptySlug = urlUtils.generateRepositorySlug(emptyNameRepo.name, emptyNameRepo.github_id);
  assert.strictEqual(emptySlug, '-12345', 'Empty name handling failed');
  
  // Test very long name
  const longNameRepo = { 
    name: 'This is an extremely long repository name that should probably be truncated in some way to avoid very long URLs',
    github_id: '12345'
  };
  const longSlug = urlUtils.generateRepositorySlug(longNameRepo.name, longNameRepo.github_id);
  assert.ok(longSlug.includes('12345'), 'Long name handling failed - ID not preserved');
  
  console.log('✓ Edge case tests passed');
}

// Run all tests
function runTests() {
  console.log('Starting navigation URL utility tests...');
  console.log('---------------------------------------');
  
  try {
    testRepositorySlug();
    testContributorSlug();
    testUrlBuilding();
    testUrlEdgeCases();
    
    console.log('---------------------------------------');
    console.log('✓ All navigation URL tests passed!');
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    process.exit(1);
  }
}

runTests(); 