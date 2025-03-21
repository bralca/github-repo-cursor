// Simple EntityLink component test file
// Run with: node entity-link.test.js

const assert = require('assert');

// Mock the URL utilities we'll use in the EntityLink component
const urlUtils = {
  buildRepositoryUrl: (repository) => 
    `/${repository.name.toLowerCase().replace(/[^\w-]+/g, '-')}-${repository.github_id}`,
  
  buildContributorUrl: (contributor) => 
    `/contributors/${contributor.name.toLowerCase().replace(/[^\w-]+/g, '-')}-${contributor.username}-${contributor.github_id}`,
  
  buildMergeRequestUrl: (repository, mergeRequest) => 
    `${urlUtils.buildRepositoryUrl(repository)}/merge-requests/${mergeRequest.title.toLowerCase().replace(/[^\w-]+/g, '-')}-${mergeRequest.github_id}`,
  
  buildCommitUrl: (repository, mergeRequest, contributor, file) => 
    `${urlUtils.buildMergeRequestUrl(repository, mergeRequest)}/commits/${contributor.name.toLowerCase().replace(/[^\w-]+/g, '-')}-${contributor.username}-${contributor.github_id}/${file.filename.toLowerCase().replace(/[^\w-]+/g, '-')}-${file.github_id}`
};

// Mock EntityLink component
class EntityLink {
  constructor(entity, type, children, options = {}) {
    this.entity = entity;
    this.type = type;
    this.children = children;
    this.options = options;
  }
  
  // Generate the appropriate href based on entity type
  generateHref() {
    switch (this.type) {
      case 'repository':
        return urlUtils.buildRepositoryUrl(this.entity);
      case 'contributor':
        return urlUtils.buildContributorUrl(this.entity);
      case 'mergeRequest':
        return urlUtils.buildMergeRequestUrl(this.options.repository, this.entity);
      case 'commit':
        return urlUtils.buildCommitUrl(
          this.options.repository, 
          this.options.mergeRequest, 
          this.options.contributor,
          this.entity
        );
      default:
        throw new Error(`Unknown entity type: ${this.type}`);
    }
  }
  
  // Generate default link text if none provided
  getDefaultText() {
    switch (this.type) {
      case 'repository':
        return this.entity.name;
      case 'contributor':
        return this.entity.name || this.entity.username;
      case 'mergeRequest':
        return this.entity.title;
      case 'commit':
        return this.entity.filename;
      default:
        return 'Unknown entity';
    }
  }
  
  // Render the complete link (simulated)
  render() {
    const href = this.generateHref();
    const text = this.children || this.getDefaultText();
    const className = this.options.className || '';
    
    return {
      type: 'a',
      props: {
        href,
        className
      },
      children: text
    };
  }
}

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
  },
  file: {
    filename: 'src/React.js',
    github_id: '123456'
  }
};

// Test functions
function testRepositoryLink() {
  console.log('Testing repository link generation...');
  
  const link = new EntityLink(testData.repository, 'repository');
  const rendered = link.render();
  
  assert.strictEqual(rendered.props.href, '/react-10270250', 'Repository link href is incorrect');
  assert.strictEqual(rendered.children, 'React', 'Repository link text is incorrect');
  
  // Test with custom text
  const customLink = new EntityLink(testData.repository, 'repository', 'Custom Text');
  const customRendered = customLink.render();
  
  assert.strictEqual(customRendered.children, 'Custom Text', 'Custom repository link text is incorrect');
  
  console.log('✓ Repository link test passed');
}

function testContributorLink() {
  console.log('Testing contributor link generation...');
  
  const link = new EntityLink(testData.contributor, 'contributor');
  const rendered = link.render();
  
  assert.strictEqual(rendered.props.href, '/contributors/dan-abramov-gaearon-810438', 'Contributor link href is incorrect');
  assert.strictEqual(rendered.children, 'Dan Abramov', 'Contributor link text is incorrect');
  
  // Test with missing name
  const noNameContributor = { ...testData.contributor, name: '' };
  const noNameLink = new EntityLink(noNameContributor, 'contributor');
  const noNameRendered = noNameLink.render();
  
  assert.strictEqual(noNameRendered.children, 'gaearon', 'Contributor link text fallback is incorrect');
  
  console.log('✓ Contributor link test passed');
}

function testMergeRequestLink() {
  console.log('Testing merge request link generation...');
  
  const link = new EntityLink(testData.mergeRequest, 'mergeRequest', null, { 
    repository: testData.repository 
  });
  const rendered = link.render();
  
  assert.strictEqual(
    rendered.props.href, 
    '/react-10270250/merge-requests/add-concurrent-mode-987654', 
    'Merge request link href is incorrect'
  );
  assert.strictEqual(rendered.children, 'Add Concurrent Mode', 'Merge request link text is incorrect');
  
  console.log('✓ Merge request link test passed');
}

function testCommitLink() {
  console.log('Testing commit link generation...');
  
  const link = new EntityLink(testData.file, 'commit', null, { 
    repository: testData.repository,
    mergeRequest: testData.mergeRequest,
    contributor: testData.contributor
  });
  const rendered = link.render();
  
  assert.strictEqual(
    rendered.props.href, 
    '/react-10270250/merge-requests/add-concurrent-mode-987654/commits/dan-abramov-gaearon-810438/src-react-js-123456', 
    'Commit link href is incorrect'
  );
  assert.strictEqual(rendered.children, 'src/React.js', 'Commit link text is incorrect');
  
  console.log('✓ Commit link test passed');
}

function testLinkOptions() {
  console.log('Testing link options...');
  
  const link = new EntityLink(testData.repository, 'repository', null, { 
    className: 'custom-link-class' 
  });
  const rendered = link.render();
  
  assert.strictEqual(rendered.props.className, 'custom-link-class', 'Link className is incorrect');
  
  console.log('✓ Link options test passed');
}

function testInvalidEntityType() {
  console.log('Testing invalid entity type handling...');
  
  const link = new EntityLink(testData.repository, 'invalidType');
  
  try {
    link.generateHref();
    assert.fail('Should have thrown an error for invalid entity type');
  } catch (error) {
    assert.strictEqual(error.message, 'Unknown entity type: invalidType', 'Error message is incorrect');
  }
  
  console.log('✓ Invalid entity type test passed');
}

// Run all tests
function runTests() {
  console.log('Starting EntityLink component tests...');
  console.log('---------------------------------------');
  
  try {
    testRepositoryLink();
    testContributorLink();
    testMergeRequestLink();
    testCommitLink();
    testLinkOptions();
    testInvalidEntityType();
    
    console.log('---------------------------------------');
    console.log('✓ All EntityLink tests passed!');
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    process.exit(1);
  }
}

runTests(); 