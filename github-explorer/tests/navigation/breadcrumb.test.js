// Simple breadcrumb component test file
// Run with: node breadcrumb.test.js

const assert = require('assert');

// Mock the BreadcrumbService we'll test
class BreadcrumbService {
  constructor() {
    this.urlUtils = {
      parseRepositorySlug: (slug) => {
        const parts = slug.split('-');
        const githubId = parts.pop();
        const name = parts.join('-');
        return { name, githubId };
      },
      parseContributorSlug: (slug) => {
        const parts = slug.split('-');
        const githubId = parts.pop();
        const username = parts.pop();
        const name = parts.join('-');
        return { name, username, githubId };
      },
      parseMergeRequestSlug: (slug) => {
        const parts = slug.split('-');
        const githubId = parts.pop();
        const title = parts.join('-');
        return { title, githubId };
      }
    };
  }

  // Parse a URL path into breadcrumb segments
  parsePath(path) {
    if (!path || path === '/') {
      return [{ label: 'Home', path: '/', isActive: true }];
    }

    const segments = path.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', path: '/', isActive: false }];
    
    let currentPath = '';
    
    for (let i = 0; i < segments.length; i++) {
      currentPath += `/${segments[i]}`;
      
      // Handle special cases based on segment position and content
      if (i === 0 && !segments[i].includes('contributors')) {
        // This is a repository slug
        const { name } = this.urlUtils.parseRepositorySlug(segments[i]);
        breadcrumbs.push({
          label: this.capitalizeFirstLetter(name),
          path: currentPath,
          isActive: i === segments.length - 1
        });
      } else if (segments[i] === 'contributors' && i === 0) {
        breadcrumbs.push({
          label: 'Contributors',
          path: currentPath,
          isActive: i === segments.length - 1
        });
      } else if (i === 1 && segments[i-1] === 'contributors') {
        // This is a contributor slug
        const { name } = this.urlUtils.parseContributorSlug(segments[i]);
        breadcrumbs.push({
          label: this.capitalizeFirstLetter(name),
          path: currentPath,
          isActive: i === segments.length - 1
        });
      } else if (segments[i] === 'merge-requests') {
        breadcrumbs.push({
          label: 'Merge Requests',
          path: currentPath,
          isActive: i === segments.length - 1
        });
      } else if (i === 2 && segments[i-1] === 'merge-requests') {
        // This is a merge request slug
        const { title } = this.urlUtils.parseMergeRequestSlug(segments[i]);
        breadcrumbs.push({
          label: this.capitalizeFirstLetter(title),
          path: currentPath,
          isActive: i === segments.length - 1
        });
      } else if (segments[i] === 'commits') {
        breadcrumbs.push({
          label: 'Commits',
          path: currentPath,
          isActive: i === segments.length - 1
        });
      } else {
        // Generic case for other segments
        breadcrumbs.push({
          label: this.capitalizeFirstLetter(segments[i].replace(/-/g, ' ')),
          path: currentPath,
          isActive: i === segments.length - 1
        });
      }
    }
    
    return breadcrumbs;
  }
  
  // Helper to capitalize first letter of each word
  capitalizeFirstLetter(string) {
    return string
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

// Test data - URL paths to test
const testPaths = {
  home: '/',
  repository: '/react-10270250',
  contributor: '/contributors/dan-abramov-gaearon-810438',
  mergeRequest: '/react-10270250/merge-requests/add-concurrent-mode-987654',
  commit: '/react-10270250/merge-requests/add-concurrent-mode-987654/commits/dan-abramov-gaearon-810438/src-react-js-123456'
};

// Test functions
function testHomeBreadcrumb() {
  console.log('Testing home breadcrumb...');
  
  const service = new BreadcrumbService();
  const breadcrumbs = service.parsePath(testPaths.home);
  
  assert.strictEqual(breadcrumbs.length, 1, 'Home should have only one breadcrumb');
  assert.strictEqual(breadcrumbs[0].label, 'Home', 'Home breadcrumb label incorrect');
  assert.strictEqual(breadcrumbs[0].path, '/', 'Home breadcrumb path incorrect');
  assert.strictEqual(breadcrumbs[0].isActive, true, 'Home breadcrumb should be active');
  
  console.log('✓ Home breadcrumb test passed');
}

function testRepositoryBreadcrumb() {
  console.log('Testing repository breadcrumb...');
  
  const service = new BreadcrumbService();
  const breadcrumbs = service.parsePath(testPaths.repository);
  
  assert.strictEqual(breadcrumbs.length, 2, 'Repository should have two breadcrumbs');
  assert.strictEqual(breadcrumbs[0].label, 'Home', 'First breadcrumb should be Home');
  assert.strictEqual(breadcrumbs[1].label, 'React', 'Second breadcrumb should be React');
  assert.strictEqual(breadcrumbs[1].isActive, true, 'Repository breadcrumb should be active');
  
  console.log('✓ Repository breadcrumb test passed');
}

function testContributorBreadcrumb() {
  console.log('Testing contributor breadcrumb...');
  
  const service = new BreadcrumbService();
  const breadcrumbs = service.parsePath(testPaths.contributor);
  
  assert.strictEqual(breadcrumbs.length, 3, 'Contributor should have three breadcrumbs');
  assert.strictEqual(breadcrumbs[0].label, 'Home', 'First breadcrumb should be Home');
  assert.strictEqual(breadcrumbs[1].label, 'Contributors', 'Second breadcrumb should be Contributors');
  assert.strictEqual(breadcrumbs[2].label, 'Dan-abramov', 'Third breadcrumb should be Dan-abramov');
  assert.strictEqual(breadcrumbs[2].isActive, true, 'Contributor breadcrumb should be active');
  
  console.log('✓ Contributor breadcrumb test passed');
}

function testMergeRequestBreadcrumb() {
  console.log('Testing merge request breadcrumb...');
  
  const service = new BreadcrumbService();
  const breadcrumbs = service.parsePath(testPaths.mergeRequest);
  
  assert.strictEqual(breadcrumbs.length, 4, 'Merge request should have four breadcrumbs');
  assert.strictEqual(breadcrumbs[0].label, 'Home', 'First breadcrumb should be Home');
  assert.strictEqual(breadcrumbs[1].label, 'React', 'Second breadcrumb should be React');
  assert.strictEqual(breadcrumbs[2].label, 'Merge Requests', 'Third breadcrumb should be Merge Requests');
  assert.strictEqual(breadcrumbs[3].label, 'Add-concurrent-mode', 'Fourth breadcrumb should be Add-concurrent-mode');
  assert.strictEqual(breadcrumbs[3].isActive, true, 'Merge request breadcrumb should be active');
  
  console.log('✓ Merge request breadcrumb test passed');
}

function testNestedCommitBreadcrumb() {
  console.log('Testing nested commit breadcrumb...');
  
  const service = new BreadcrumbService();
  const breadcrumbs = service.parsePath(testPaths.commit);
  
  assert.strictEqual(breadcrumbs.length, 7, 'Commit should have seven breadcrumbs');
  assert.strictEqual(breadcrumbs[0].label, 'Home', 'First breadcrumb should be Home');
  assert.strictEqual(breadcrumbs[1].label, 'React', 'Second breadcrumb should be React');
  assert.strictEqual(breadcrumbs[2].label, 'Merge Requests', 'Third breadcrumb should be Merge Requests');
  assert.strictEqual(breadcrumbs[3].label, 'Add-concurrent-mode', 'Fourth breadcrumb should be Add-concurrent-mode');
  assert.strictEqual(breadcrumbs[4].label, 'Commits', 'Fifth breadcrumb should be Commits');
  assert.strictEqual(breadcrumbs[6].isActive, true, 'Last breadcrumb should be active');
  
  console.log('✓ Nested commit breadcrumb test passed');
}

// Run all tests
function runTests() {
  console.log('Starting breadcrumb navigation tests...');
  console.log('---------------------------------------');
  
  try {
    testHomeBreadcrumb();
    testRepositoryBreadcrumb();
    testContributorBreadcrumb();
    testMergeRequestBreadcrumb();
    testNestedCommitBreadcrumb();
    
    console.log('---------------------------------------');
    console.log('✓ All breadcrumb tests passed!');
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    process.exit(1);
  }
}

runTests(); 