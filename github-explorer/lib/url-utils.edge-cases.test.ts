import {
  toSlug,
  extractGithubId,
  isValidUrl,
  generateRepositorySlug,
  parseRepositorySlug,
  generateContributorSlug,
  parseContributorSlug,
  generateMergeRequestSlug,
  parseMergeRequestSlug,
  generateFileSlug,
  parseFileSlug
} from './url-utils';

describe('URL Utility Edge Cases', () => {
  describe('toSlug - Edge Cases', () => {
    test('handles extremely long titles', () => {
      const longTitle = 'This is an extremely long title that definitely exceeds our maximum slug length and should be truncated properly to ensure good URL structure and avoid problems with browsers or servers that might have URL length limitations';
      expect(toSlug(longTitle).length).toBeLessThanOrEqual(50);
    });

    test('handles special characters and symbols', () => {
      expect(toSlug('Title with @#$% special !@#$ chars')).toBe('title-with-special-chars');
      expect(toSlug('Math: 2+2=4 and 3*3=9')).toBe('math-2-2-4-and-3-3-9');
      expect(toSlug('C++ & Java & Python')).toBe('c-and-java-and-python');
    });

    test('handles non-English characters', () => {
      expect(toSlug('Résumé and Café')).toBe('resume-and-cafe');
      expect(toSlug('München Straße')).toBe('munchen-strasse');
      expect(toSlug('こんにちは世界')).toBe('konnichiha-shi-jie'); // Japanese "Hello World"
    });
    
    test('handles leading/trailing spaces and multiple consecutive spaces', () => {
      expect(toSlug('  Leading spaces')).toBe('leading-spaces');
      expect(toSlug('Trailing spaces  ')).toBe('trailing-spaces');
      expect(toSlug('Multiple   consecutive    spaces')).toBe('multiple-consecutive-spaces');
    });
  });

  describe('extractGithubId - Edge Cases', () => {
    test('handles IDs with special characters', () => {
      expect(extractGithubId('repo-name-123.456')).toBe('123.456');
      expect(extractGithubId('repo-name-abc-123')).toBe('abc-123');
    });
    
    test('returns null for malformed slugs', () => {
      expect(extractGithubId('no-id-present')).toBeNull();
      expect(extractGithubId('repo-name-')).toBeNull();
    });
  });

  describe('Repository Slug Edge Cases', () => {
    test('handles repository names with special characters', () => {
      const slug = generateRepositorySlug('C++ & JavaScript Project!', '123456');
      expect(slug).toBe('c-and-javascript-project-123456');
      
      const parsed = parseRepositorySlug(slug);
      expect(parsed).toEqual({
        name: 'c-and-javascript-project',
        githubId: '123456'
      });
    });
    
    test('handles extremely long repository names', () => {
      const longName = 'This is an extremely long repository name that definitely exceeds our maximum slug length and should be truncated';
      const slug = generateRepositorySlug(longName, '123456');
      
      expect(slug.length).toBeLessThanOrEqual(60); // name (50) + id (6) + hyphen (1)
      expect(slug.endsWith('-123456')).toBe(true);
      
      const parsed = parseRepositorySlug(slug);
      expect(parsed?.githubId).toBe('123456');
    });
  });

  describe('Contributor Slug Edge Cases', () => {
    test('handles missing name or username gracefully', () => {
      expect(generateContributorSlug(undefined, 'username', '123456')).toBe('contributor-username-123456');
      expect(generateContributorSlug('Name', undefined, '123456')).toBe('name-123456');
      expect(generateContributorSlug(undefined, undefined, '123456')).toBe('contributor-123456');
    });
    
    test('handles names/usernames with special characters', () => {
      const slug = generateContributorSlug('Jörg Müller', 'j.mueller@example', '123456');
      expect(slug).toBe('jorg-muller-j-mueller-example-123456');
      
      const parsed = parseContributorSlug(slug);
      expect(parsed?.githubId).toBe('123456');
    });
  });

  describe('Merge Request Slug Edge Cases', () => {
    test('handles empty title gracefully', () => {
      expect(generateMergeRequestSlug('', '123456')).toBe('merge-request-123456');
    });
    
    test('handles titles with issue numbers and branches', () => {
      const slug = generateMergeRequestSlug('[ISSUE-123] Fix bug in feature/new-layout branch', '456789');
      expect(slug).toBe('issue-123-fix-bug-in-feature-new-layout-branch-456789');
      
      const parsed = parseMergeRequestSlug(slug);
      expect(parsed?.githubId).toBe('456789');
    });
  });

  describe('File Slug Edge Cases', () => {
    test('handles file paths with dots and special characters', () => {
      const slug = generateFileSlug('src/components/Header.tsx', '123456');
      expect(slug).toBe('src-components-header-tsx-123456');
      
      const parsed = parseFileSlug(slug);
      expect(parsed?.githubId).toBe('123456');
    });
    
    test('handles very long file paths', () => {
      const longPath = 'very/long/path/with/many/nested/directories/and/a/very/long/filename/with/extensions.test.spec.tsx';
      const slug = generateFileSlug(longPath, '123456');
      
      expect(slug.length).toBeLessThanOrEqual(60);
      expect(slug.endsWith('-123456')).toBe(true);
      
      const parsed = parseFileSlug(slug);
      expect(parsed?.githubId).toBe('123456');
    });
  });
}); 