import {
  toSlug,
  extractGithubId,
  isValidUrl,
  combinePath,
  generateRepositorySlug,
  parseRepositorySlug,
  buildRepositoryUrl,
  generateContributorSlug,
  parseContributorSlug,
  buildContributorUrl,
  generateMergeRequestSlug,
  parseMergeRequestSlug,
  buildMergeRequestUrl,
  generateFileSlug,
  parseFileSlug,
  buildCommitUrl,
  Repository,
  Contributor,
  MergeRequest,
  File
} from '../lib/url-utils';

// Test data
// Repository samples
const repositories: Repository[] = [
  {
    id: '123',
    github_id: '456789',
    name: 'Test Repository',
    full_name: 'owner/test-repository'
  },
  {
    id: '124',
    github_id: '456790',
    name: 'React & Node.js Example!',
    full_name: 'owner/react-nodejs-example'
  },
  {
    id: '125',
    github_id: '456791',
    name: 'Super-Long-Repository-Name-That-Exceeds-The-Maximum-Length-For-Slugs-In-Our-Application-And-Should-Be-Truncated',
    full_name: 'owner/super-long-repository-name'
  },
  {
    id: '126',
    github_id: '456792',
    name: 'repo123_with-numbers',
    full_name: 'owner/repo123_with-numbers'
  },
  {
    id: '127',
    github_id: '456793',
    name: '',  // Empty name - should use fallback
    full_name: 'owner/repository'
  }
];

// Contributor samples
const contributors: Contributor[] = [
  {
    id: '234',
    github_id: '567890',
    name: 'John Doe',
    username: 'johndoe'
  },
  {
    id: '235',
    github_id: '567891',
    name: 'Sarah O\'Connor & Smith',  // Name with special characters
    username: 'sarahoc'
  },
  {
    id: '236',
    github_id: '567892',
    name: undefined,  // Missing name
    username: 'username-only'
  },
  {
    id: '237',
    github_id: '567893',
    name: 'Maria Rodriguez',
    username: undefined  // Missing username
  },
  {
    id: '238',
    github_id: '567894',
    name: 'Extremely Long Name That Would Typically Exceed Normal Limits And Should Be Truncated In The URL Generation Process',
    username: 'longname'
  }
];

// Merge Request samples
const mergeRequests: MergeRequest[] = [
  {
    id: '345',
    github_id: '678901',
    title: 'Add new feature',
    repository_id: repositories[0].id,
    repository_github_id: repositories[0].github_id
  },
  {
    id: '346',
    github_id: '678902',
    title: 'Fix bug #123 & implement error handling',  // Special characters
    repository_id: repositories[0].id,
    repository_github_id: repositories[0].github_id
  },
  {
    id: '347',
    github_id: '678903',
    title: 'Extremely Long Merge Request Title That Would Require Truncation In The URL Generation Process For Good URL Practices',
    repository_id: repositories[0].id,
    repository_github_id: repositories[0].github_id
  },
  {
    id: '348',
    github_id: '678904',
    title: '',  // Empty title - should use fallback
    repository_id: repositories[0].id,
    repository_github_id: repositories[0].github_id
  },
  {
    id: '349',
    github_id: '678905',
    title: 'API v2.0: Refactor GET /users/123/profile endpoint',  // Technical title
    repository_id: repositories[0].id,
    repository_github_id: repositories[0].github_id
  }
];

// File samples
const files: File[] = [
  {
    id: '456',
    github_id: '789012',
    filename: 'src/components/Header.tsx'
  },
  {
    id: '457',
    github_id: '789013',
    filename: 'very/deeply/nested/project/structure/index.js'  // Deep nesting
  },
  {
    id: '458',
    github_id: '789014',
    filename: 'special-file-name!@#$%.config.js'  // Special chars
  },
  {
    id: '459',
    github_id: '789015',
    filename: 'README.md'  // Simple root file
  },
  {
    id: '460',
    github_id: '789016',
    filename: 'extremely-long-file-name-that-exceeds-normal-limits-and-should-be-truncated-properly-in-the-url-generation-process-with-its-extension.ts'  // Long name
  }
];

// Helper to run tests
function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}:`, error);
  }
}

// Test basic slug generation
runTest('toSlug converts basic string to slug', () => {
  const result = toSlug('Hello World');
  if (result !== 'hello-world') throw new Error(`Expected 'hello-world', got '${result}'`);
});

runTest('toSlug handles special characters', () => {
  const result = toSlug('Special @#$% Characters!');
  if (result !== 'special-characters') throw new Error(`Expected 'special-characters', got '${result}'`);
});

runTest('toSlug truncates long strings', () => {
  const longString = 'This is a very long string that should be truncated because it exceeds the maximum length for slugs in our application';
  if (toSlug(longString).length > 50) throw new Error('Long slug was not truncated');
});

// Test repository URL functions
console.log('\n--- Repository URL Tests ---');

repositories.forEach((repo, index) => {
  if (index === 4) { // Empty name repository test
    runTest(`Repository ${index + 1}: generateRepositorySlug handles empty name`, () => {
      try {
        generateRepositorySlug(repo.name, repo.github_id);
        throw new Error('Expected an error for empty repository name but got none');
      } catch (error) {
        // This is expected behavior
        if (!(error instanceof Error) || !error.message.includes('Repository name and GitHub ID are required')) {
          throw new Error(`Got unexpected error: ${error}`);
        }
      }
    });

    runTest(`Repository ${index + 1}: buildRepositoryUrl handles empty name`, () => {
      try {
        buildRepositoryUrl(repo);
        throw new Error('Expected an error for empty repository name but got none');
      } catch (error) {
        // This is expected behavior
        if (!(error instanceof Error) || !error.message.includes('Valid repository object with name and github_id is required')) {
          throw new Error(`Got unexpected error: ${error}`);
        }
      }
    });
  } else {
    runTest(`Repository ${index + 1}: generateRepositorySlug for "${repo.name || '(empty)'}"`, () => {
      const result = generateRepositorySlug(repo.name, repo.github_id);
      // For empty name we can't predict exact result but ensure it has the github_id
      if (repo.name && !result.includes(toSlug(repo.name))) {
        throw new Error(`Expected slug to contain "${toSlug(repo.name)}"`);
      }
      if (!result.endsWith(repo.github_id)) {
        throw new Error(`Expected slug to end with github_id "${repo.github_id}"`);
      }
    });

    runTest(`Repository ${index + 1}: buildRepositoryUrl for "${repo.name || '(empty)'}"`, () => {
      const result = buildRepositoryUrl(repo);
      if (!result.startsWith('/')) {
        throw new Error(`Expected URL to start with "/", got "${result}"`);
      }
      if (!result.endsWith(repo.github_id)) {
        throw new Error(`Expected URL to end with github_id "${repo.github_id}"`);
      }
    });
  }
});

// Test contributor URL functions
console.log('\n--- Contributor URL Tests ---');

contributors.forEach((contributor, index) => {
  runTest(`Contributor ${index + 1}: generateContributorSlug for "${contributor.name || '(no name)'}" / "${contributor.username || '(no username)'}"`, () => {
    const result = generateContributorSlug(contributor.name, contributor.username, contributor.github_id);
    
    // Check for name part if present
    if (contributor.name && !result.includes(toSlug(contributor.name))) {
      throw new Error(`Expected slug to contain name "${toSlug(contributor.name)}"`);
    }
    
    // Check for username part if present
    if (contributor.username && !result.includes(toSlug(contributor.username))) {
      throw new Error(`Expected slug to contain username "${toSlug(contributor.username)}"`);
    }
    
    // Always check for GitHub ID
    if (!result.endsWith(contributor.github_id)) {
      throw new Error(`Expected slug to end with github_id "${contributor.github_id}"`);
    }
  });

  runTest(`Contributor ${index + 1}: buildContributorUrl for "${contributor.name || '(no name)'}" / "${contributor.username || '(no username)'}"`, () => {
    const result = buildContributorUrl(contributor);
    
    if (!result.startsWith('/contributors/')) {
      throw new Error(`Expected URL to start with "/contributors/", got "${result}"`);
    }
    
    if (!result.endsWith(contributor.github_id)) {
      throw new Error(`Expected URL to end with github_id "${contributor.github_id}"`);
    }
  });
});

// Test merge request URL functions
console.log('\n--- Merge Request URL Tests ---');

mergeRequests.forEach((mr, index) => {
  if (index === 3) { // Empty title merge request test
    runTest(`Merge Request ${index + 1}: generateMergeRequestSlug handles empty title`, () => {
      const result = generateMergeRequestSlug(mr.title, mr.github_id);
      if (!result.includes('merge-request')) {
        throw new Error(`Expected slug to contain fallback text "merge-request", got "${result}"`);
      }
      if (!result.endsWith(mr.github_id)) {
        throw new Error(`Expected slug to end with github_id "${mr.github_id}"`);
      }
    });

    runTest(`Merge Request ${index + 1}: buildMergeRequestUrl handles empty title`, () => {
      try {
        const repo = repositories.find(r => r.github_id === mr.repository_github_id)!;
        buildMergeRequestUrl(repo, mr);
        throw new Error('Expected an error for empty merge request title but got none');
      } catch (error) {
        // This is expected behavior
        if (!(error instanceof Error) || !error.message.includes('Valid merge request object with title and github_id is required')) {
          throw new Error(`Got unexpected error: ${error}`);
        }
      }
    });
  } else {
    runTest(`Merge Request ${index + 1}: generateMergeRequestSlug for "${mr.title || '(empty)'}"`, () => {
      const result = generateMergeRequestSlug(mr.title, mr.github_id);
      
      // For empty title we can't predict exact result but ensure it has the github_id
      if (mr.title && !result.includes(toSlug(mr.title))) {
        throw new Error(`Expected slug to contain title "${toSlug(mr.title)}"`);
      }
      
      if (!result.endsWith(mr.github_id)) {
        throw new Error(`Expected slug to end with github_id "${mr.github_id}"`);
      }
    });

    runTest(`Merge Request ${index + 1}: buildMergeRequestUrl for "${mr.title || '(empty)'}"`, () => {
      const repo = repositories.find(r => r.github_id === mr.repository_github_id)!;
      const result = buildMergeRequestUrl(repo, mr);
      
      if (!result.includes('/merge-requests/')) {
        throw new Error(`Expected URL to include "/merge-requests/", got "${result}"`);
      }
      
      if (!result.endsWith(mr.github_id)) {
        throw new Error(`Expected URL to end with MR github_id "${mr.github_id}"`);
      }
    });
  }
});

// Test file slug and commit URL functions
console.log('\n--- File and Commit URL Tests ---');

files.forEach((file, index) => {
  runTest(`File ${index + 1}: generateFileSlug for "${file.filename}"`, () => {
    const result = generateFileSlug(file.filename, file.github_id);
    
    // Simple check - full validation would be complex due to path normalization
    if (!result.endsWith(file.github_id)) {
      throw new Error(`Expected slug to end with github_id "${file.github_id}"`);
    }
  });

  runTest(`File ${index + 1}: buildCommitUrl for "${file.filename}"`, () => {
    const repo = repositories[0];
    const mr = mergeRequests[0];
    const contributor = contributors[0];
    
    const result = buildCommitUrl(repo, mr, contributor, file);
    
    if (!result.includes('/commits/')) {
      throw new Error(`Expected URL to include "/commits/", got "${result}"`);
    }
    
    if (!result.endsWith(file.github_id)) {
      throw new Error(`Expected URL to end with file github_id "${file.github_id}"`);
    }
  });
});

console.log('\n✨ All tests completed'); 