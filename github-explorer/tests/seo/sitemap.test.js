// Simple sitemap generation test file
// Run with: node sitemap.test.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock the sitemap generation service we'll test
class SitemapGenerator {
  constructor() {
    this.SITEMAP_LIMIT = 50000; // Google's URL limit per sitemap file
    this.baseUrl = 'https://github-explorer.example.com';
    
    // Mock of URL utility functions
    this.urlUtils = {
      buildRepositoryUrl: (repo) => `/${repo.name.toLowerCase().replace(/[^\w-]+/g, '-')}-${repo.github_id}`,
      buildContributorUrl: (contributor) => `/contributors/${contributor.name.toLowerCase().replace(/[^\w-]+/g, '-')}-${contributor.username}-${contributor.github_id}`,
      buildMergeRequestUrl: (repository, mr) => 
        `${this.urlUtils.buildRepositoryUrl(repository)}/merge-requests/${mr.title.toLowerCase().replace(/[^\w-]+/g, '-')}-${mr.github_id}`
    };
  }
  
  // Generate XML for a sitemap entry
  generateUrlEntry(path, priority = 0.5, changefreq = 'weekly') {
    const lastmod = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return `
  <url>
    <loc>${this.baseUrl}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }
  
  // Generate sitemap XML for a list of entities
  generateEntitySitemap(entities, urlBuilder, filename, priority = 0.5) {
    // Check if we need to paginate the sitemap
    const totalEntities = entities.length;
    const needsPagination = totalEntities > this.SITEMAP_LIMIT;
    
    if (!needsPagination) {
      return this.generateSingleSitemap(entities, urlBuilder, filename, priority);
    } else {
      return this.generatePaginatedSitemaps(entities, urlBuilder, filename, priority);
    }
  }
  
  // Generate a single sitemap file
  generateSingleSitemap(entities, urlBuilder, filename, priority = 0.5) {
    const urls = entities.map(entity => {
      const path = urlBuilder(entity);
      return this.generateUrlEntry(path, priority);
    }).join('\n');
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return {
      filename,
      content: xml,
      urlCount: entities.length
    };
  }
  
  // Generate multiple paginated sitemap files
  generatePaginatedSitemaps(entities, urlBuilder, filenameBase, priority = 0.5) {
    const sitemaps = [];
    let currentPage = 1;
    let currentIndex = 0;
    
    while (currentIndex < entities.length) {
      const pageEntities = entities.slice(currentIndex, currentIndex + this.SITEMAP_LIMIT);
      const paginatedFilename = `${filenameBase}-${currentPage}.xml`;
      
      const sitemap = this.generateSingleSitemap(pageEntities, urlBuilder, paginatedFilename, priority);
      sitemaps.push(sitemap);
      
      currentIndex += this.SITEMAP_LIMIT;
      currentPage++;
    }
    
    return sitemaps;
  }
  
  // Generate sitemap index file
  generateSitemapIndex(sitemapFiles) {
    const sitemaps = sitemapFiles.map(file => `
  <sitemap>
    <loc>${this.baseUrl}/sitemaps/${file.filename}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`).join('\n');
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`;

    return {
      filename: 'sitemap-index.xml',
      content: xml
    };
  }
}

// Test data
const testData = {
  repositories: [
    { name: 'React', github_id: '10270250' },
    { name: 'Vue', github_id: '11730342' },
    { name: 'Angular', github_id: '24195339' }
  ],
  contributors: [
    { name: 'Dan Abramov', username: 'gaearon', github_id: '810438' },
    { name: 'Evan You', username: 'yyx990803', github_id: '499550' },
    { name: 'Igor Minar', username: 'IgorMinar', github_id: '216296' }
  ],
  mergeRequests: [
    { title: 'Add Concurrent Mode', github_id: '987654' },
    { title: 'Fix Memory Leak', github_id: '876543' },
    { title: 'Improve Performance', github_id: '765432' }
  ]
};

// Generate large test data for pagination testing
function generateLargeTestData(count) {
  const largeData = [];
  for (let i = 0; i < count; i++) {
    largeData.push({
      name: `Repository ${i}`,
      github_id: `${i + 1000000}`
    });
  }
  return largeData;
}

// Test functions
function testGenerateUrlEntry() {
  console.log('Testing URL entry generation...');
  
  const generator = new SitemapGenerator();
  const entry = generator.generateUrlEntry('/react-10270250', 0.8, 'daily');
  
  assert.ok(entry.includes('<loc>https://github-explorer.example.com/react-10270250</loc>'), 'URL entry should contain correct location');
  assert.ok(entry.includes('<priority>0.8</priority>'), 'URL entry should contain correct priority');
  assert.ok(entry.includes('<changefreq>daily</changefreq>'), 'URL entry should contain correct change frequency');
  
  console.log('✓ URL entry generation test passed');
}

function testSingleSitemapGeneration() {
  console.log('Testing single sitemap generation...');
  
  const generator = new SitemapGenerator();
  const sitemap = generator.generateEntitySitemap(
    testData.repositories,
    repo => generator.urlUtils.buildRepositoryUrl(repo),
    'repositories.xml',
    0.8
  );
  
  assert.strictEqual(sitemap.filename, 'repositories.xml', 'Sitemap filename should be correct');
  assert.strictEqual(sitemap.urlCount, 3, 'Sitemap should contain 3 URLs');
  assert.ok(sitemap.content.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'Sitemap should have XML declaration');
  assert.ok(sitemap.content.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), 'Sitemap should have urlset element');
  assert.ok(sitemap.content.includes('<loc>https://github-explorer.example.com/react-10270250</loc>'), 'Sitemap should contain repository URL');
  
  console.log('✓ Single sitemap generation test passed');
}

function testPaginatedSitemapGeneration() {
  console.log('Testing paginated sitemap generation...');
  
  const generator = new SitemapGenerator();
  // Override the limit to a smaller number for testing
  generator.SITEMAP_LIMIT = 2;
  
  const sitemaps = generator.generateEntitySitemap(
    testData.repositories,
    repo => generator.urlUtils.buildRepositoryUrl(repo),
    'repositories',
    0.8
  );
  
  assert.strictEqual(sitemaps.length, 2, 'Should generate 2 sitemap files');
  assert.strictEqual(sitemaps[0].filename, 'repositories-1.xml', 'First sitemap filename should be paginated');
  assert.strictEqual(sitemaps[1].filename, 'repositories-2.xml', 'Second sitemap filename should be paginated');
  assert.strictEqual(sitemaps[0].urlCount, 2, 'First sitemap should contain 2 URLs');
  assert.strictEqual(sitemaps[1].urlCount, 1, 'Second sitemap should contain 1 URL');
  
  console.log('✓ Paginated sitemap generation test passed');
}

function testSitemapIndexGeneration() {
  console.log('Testing sitemap index generation...');
  
  const generator = new SitemapGenerator();
  const sitemapFiles = [
    { filename: 'repositories.xml', urlCount: 3 },
    { filename: 'contributors.xml', urlCount: 3 },
    { filename: 'merge-requests.xml', urlCount: 3 }
  ];
  
  const index = generator.generateSitemapIndex(sitemapFiles);
  
  assert.strictEqual(index.filename, 'sitemap-index.xml', 'Index filename should be correct');
  assert.ok(index.content.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'Index should have XML declaration');
  assert.ok(index.content.includes('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), 'Index should have sitemapindex element');
  assert.ok(index.content.includes('<loc>https://github-explorer.example.com/sitemaps/repositories.xml</loc>'), 'Index should reference repository sitemap');
  assert.ok(index.content.includes('<loc>https://github-explorer.example.com/sitemaps/contributors.xml</loc>'), 'Index should reference contributor sitemap');
  assert.ok(index.content.includes('<loc>https://github-explorer.example.com/sitemaps/merge-requests.xml</loc>'), 'Index should reference merge request sitemap');
  
  console.log('✓ Sitemap index generation test passed');
}

function testLargeSitemapPagination() {
  console.log('Testing large sitemap pagination...');
  
  const generator = new SitemapGenerator();
  // Set limit back to a reasonable number for testing
  generator.SITEMAP_LIMIT = 40000;
  
  // Generate 100,000 test repositories (should create 3 sitemaps)
  const largeData = generateLargeTestData(100000);
  
  const sitemaps = generator.generateEntitySitemap(
    largeData,
    repo => generator.urlUtils.buildRepositoryUrl(repo),
    'repositories',
    0.8
  );
  
  assert.strictEqual(sitemaps.length, 3, 'Should generate 3 sitemap files for 100,000 items');
  assert.strictEqual(sitemaps[0].urlCount, 40000, 'First sitemap should contain 40,000 URLs');
  assert.strictEqual(sitemaps[1].urlCount, 40000, 'Second sitemap should contain 40,000 URLs');
  assert.strictEqual(sitemaps[2].urlCount, 20000, 'Third sitemap should contain 20,000 URLs');
  
  console.log('✓ Large sitemap pagination test passed');
}

// Run all tests
function runTests() {
  console.log('Starting sitemap generation tests...');
  console.log('---------------------------------------');
  
  try {
    testGenerateUrlEntry();
    testSingleSitemapGeneration();
    testPaginatedSitemapGeneration();
    testSitemapIndexGeneration();
    testLargeSitemapPagination();
    
    console.log('---------------------------------------');
    console.log('✓ All sitemap generation tests passed!');
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    process.exit(1);
  }
}

runTests(); 