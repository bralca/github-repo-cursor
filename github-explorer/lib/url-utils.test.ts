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
} from './url-utils';

// Add explicit type declarations for Jest
declare global {
  const describe: (description: string, callback: () => void) => void;
  const test: (description: string, callback: () => void) => void;
  const expect: <T>(actual: T) => any;
  const beforeEach: (callback: () => void) => void;
  const afterEach: (callback: () => void) => void;
}

// Test data
const sampleRepository: Repository = {
  id: '123',
  github_id: '456789',
  name: 'Test Repository',
  full_name: 'owner/test-repository'
};

const sampleContributor: Contributor = {
  id: '234',
  github_id: '567890',
  name: 'John Doe',
  username: 'johndoe'
};

const sampleMergeRequest: MergeRequest = {
  id: '345',
  github_id: '678901',
  title: 'Add new feature',
  repository_id: sampleRepository.id,
  repository_github_id: sampleRepository.github_id
};

const sampleFile: File = {
  id: '456',
  github_id: '789012',
  filename: 'src/components/Header.tsx'
};

describe('URL Utility - Base Functions', () => {
  describe('toSlug', () => {
    test('converts basic string to slug', () => {
      expect(toSlug('Hello World')).toBe('hello-world');
    });

    test('removes special characters', () => {
      expect(toSlug('Special! @#$% Characters')).toBe('special-characters');
    });

    test('handles spaces and hyphens', () => {
      expect(toSlug('  Multiple   Spaces   ')).toBe('multiple-spaces');
      expect(toSlug('Already-has-hyphens')).toBe('already-has-hyphens');
    });

    test('converts ampersand to "and"', () => {
      expect(toSlug('UI & UX')).toBe('ui-and-ux');
    });

    test('truncates long strings', () => {
      const longString = 'This is a very long string that should be truncated because it exceeds the maximum length for slugs in our application and we want to ensure URLs are not too long';
      expect(toSlug(longString).length).toBeLessThanOrEqual(50);
    });

    test('handles empty or null input', () => {
      expect(toSlug('')).toBe('');
      expect(toSlug(null as any)).toBe('');
      expect(toSlug(undefined as any)).toBe('');
    });
  });

  describe('extractGithubId', () => {
    test('extracts ID from slug', () => {
      expect(extractGithubId('repo-name-123456')).toBe('123456');
    });

    test('returns null for invalid slug', () => {
      expect(extractGithubId('repo-name-without-id')).toBeNull();
    });

    test('handles empty input', () => {
      expect(extractGithubId('')).toBeNull();
      expect(extractGithubId(null as any)).toBeNull();
    });
  });

  describe('isValidUrl', () => {
    test('validates correct URL format', () => {
      expect(isValidUrl('/repo-name-123456')).toBe(true);
    });

    test('rejects invalid URL format', () => {
      expect(isValidUrl('repo-name-123456')).toBe(false); // Missing leading slash
    });

    test('handles empty input', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl(null as any)).toBe(false);
    });
  });

  describe('combinePath', () => {
    test('combines path segments', () => {
      expect(combinePath('segment1', 'segment2')).toBe('/segment1/segment2');
    });

    test('handles leading and trailing slashes', () => {
      expect(combinePath('/segment1/', '/segment2/')).toBe('/segment1/segment2');
    });

    test('filters empty segments', () => {
      expect(combinePath('segment1', '', 'segment2')).toBe('/segment1/segment2');
    });
  });
});

describe('URL Utility - Repository Functions', () => {
  describe('generateRepositorySlug', () => {
    test('generates correct repository slug', () => {
      expect(generateRepositorySlug('Test Repository', '123456')).toBe('test-repository-123456');
    });

    test('handles special characters in name', () => {
      expect(generateRepositorySlug('Test & Demo!', '123456')).toBe('test-and-demo-123456');
    });

    test('throws error for missing parameters', () => {
      expect(() => generateRepositorySlug('', '123456')).toThrow();
      expect(() => generateRepositorySlug('Test', '')).toThrow();
    });
  });

  describe('parseRepositorySlug', () => {
    test('parses repository slug correctly', () => {
      const result = parseRepositorySlug('test-repository-123456');
      expect(result).toEqual({
        name: 'test-repository',
        githubId: '123456'
      });
    });

    test('returns null for invalid slug', () => {
      expect(parseRepositorySlug('invalid-slug')).toBeNull();
    });

    test('handles empty input', () => {
      expect(parseRepositorySlug('')).toBeNull();
      expect(parseRepositorySlug(null as any)).toBeNull();
    });
  });

  describe('buildRepositoryUrl', () => {
    test('builds correct repository URL', () => {
      expect(buildRepositoryUrl(sampleRepository)).toBe('/test-repository-456789');
    });

    test('throws error for invalid repository', () => {
      expect(() => buildRepositoryUrl({ id: '123', github_id: '', name: 'Test' })).toThrow();
      expect(() => buildRepositoryUrl({ id: '123', github_id: '456', name: '' })).toThrow();
      expect(() => buildRepositoryUrl(null as any)).toThrow();
    });
  });
});

describe('URL Utility - Contributor Functions', () => {
  describe('generateContributorSlug', () => {
    test('generates correct contributor slug with name and username', () => {
      expect(generateContributorSlug('John Doe', 'johndoe', '123456')).toBe('john-doe-johndoe-123456');
    });

    test('handles missing name', () => {
      expect(generateContributorSlug(undefined, 'johndoe', '123456')).toBe('contributor-johndoe-123456');
    });

    test('handles missing username', () => {
      expect(generateContributorSlug('John Doe', undefined, '123456')).toBe('john-doe-123456');
    });

    test('throws error for missing GitHub ID', () => {
      expect(() => generateContributorSlug('John Doe', 'johndoe', '')).toThrow();
    });
  });

  describe('parseContributorSlug', () => {
    test('parses contributor slug correctly', () => {
      const result = parseContributorSlug('john-doe-johndoe-123456');
      expect(result).toEqual({
        name: 'john',
        username: 'doe-johndoe',
        githubId: '123456'
      });
    });

    test('returns null for invalid slug', () => {
      expect(parseContributorSlug('invalid-slug')).toBeNull();
    });
  });

  describe('buildContributorUrl', () => {
    test('builds correct contributor URL', () => {
      expect(buildContributorUrl(sampleContributor)).toBe('/contributors/john-doe-johndoe-567890');
    });

    test('throws error for invalid contributor', () => {
      expect(() => buildContributorUrl({ id: '123', github_id: '', name: 'Test' })).toThrow();
      expect(() => buildContributorUrl(null as any)).toThrow();
    });
  });
});

describe('URL Utility - Merge Request Functions', () => {
  describe('generateMergeRequestSlug', () => {
    test('generates correct merge request slug', () => {
      expect(generateMergeRequestSlug('Add new feature', '123456')).toBe('add-new-feature-123456');
    });

    test('handles special characters in title', () => {
      expect(generateMergeRequestSlug('Fix bug #123 & improve UX', '123456')).toBe('fix-bug-123-and-improve-ux-123456');
    });

    test('handles empty title', () => {
      expect(generateMergeRequestSlug('', '123456')).toBe('merge-request-123456');
    });

    test('throws error for missing GitHub ID', () => {
      expect(() => generateMergeRequestSlug('Add new feature', '')).toThrow();
    });
  });

  describe('parseMergeRequestSlug', () => {
    test('parses merge request slug correctly', () => {
      const result = parseMergeRequestSlug('add-new-feature-123456');
      expect(result).toEqual({
        title: 'add-new-feature',
        githubId: '123456'
      });
    });

    test('returns null for invalid slug', () => {
      expect(parseMergeRequestSlug('invalid-slug')).toBeNull();
    });
  });

  describe('buildMergeRequestUrl', () => {
    test('builds correct merge request URL', () => {
      expect(buildMergeRequestUrl(sampleRepository, sampleMergeRequest))
        .toBe('/test-repository-456789/merge-requests/add-new-feature-678901');
    });

    test('throws error for invalid parameters', () => {
      expect(() => buildMergeRequestUrl({ ...sampleRepository, github_id: '' }, sampleMergeRequest)).toThrow();
      expect(() => buildMergeRequestUrl(sampleRepository, { ...sampleMergeRequest, github_id: '' })).toThrow();
    });
  });
});

describe('URL Utility - File and Commit Functions', () => {
  describe('generateFileSlug', () => {
    test('generates correct file slug', () => {
      expect(generateFileSlug('src/components/Header.tsx', '123456')).toBe('src-components-header-tsx-123456');
    });

    test('handles special characters in filename', () => {
      expect(generateFileSlug('src/utils/special-$%^-file.js', '123456')).toBe('src-utils-special-file-js-123456');
    });

    test('throws error for missing GitHub ID', () => {
      expect(() => generateFileSlug('filename.txt', '')).toThrow();
    });
  });

  describe('parseFileSlug', () => {
    test('parses file slug correctly', () => {
      const result = parseFileSlug('src-components-header-tsx-123456');
      expect(result).toEqual({
        filename: 'src-components-header-tsx',
        githubId: '123456'
      });
    });

    test('returns null for invalid slug', () => {
      expect(parseFileSlug('invalid-slug')).toBeNull();
    });
  });

  describe('buildCommitUrl', () => {
    test('builds correct commit URL', () => {
      expect(buildCommitUrl(sampleRepository, sampleMergeRequest, sampleContributor, sampleFile))
        .toBe('/test-repository-456789/merge-requests/add-new-feature-678901/commits/john-doe-johndoe-567890/src-components-header-tsx-789012');
    });

    test('throws error for invalid parameters', () => {
      expect(() => buildCommitUrl(
        { ...sampleRepository, github_id: '' }, 
        sampleMergeRequest, 
        sampleContributor, 
        sampleFile
      )).toThrow();
      
      expect(() => buildCommitUrl(
        sampleRepository, 
        sampleMergeRequest, 
        sampleContributor, 
        { ...sampleFile, github_id: '' }
      )).toThrow();
    });
  });
}); 