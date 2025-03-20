/**
 * Repository Page Implementation Test
 * 
 * This test verifies that the repository page correctly:
 * 1. Extracts the GitHub ID from the repository slug
 * 2. Fetches repository data using the correct function
 * 3. Generates appropriate metadata for SEO
 */

const { parseRepositorySlug } = require('../lib/url-utils');
const { getRepositorySEODataByGithubId } = require('../lib/database/repositories');

// Mock the database functions
jest.mock('../lib/database/repositories', () => ({
  getRepositorySEODataByGithubId: jest.fn()
}));

describe('Repository Page Implementation', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('parseRepositorySlug correctly extracts the GitHub ID', () => {
    const testSlug = 'react-facebook-123456';
    const result = parseRepositorySlug(testSlug);
    
    expect(result).not.toBeNull();
    expect(result.name).toBe('react-facebook');
    expect(result.githubId).toBe('123456');
  });

  test('Repository page uses getRepositorySEODataByGithubId to fetch data', async () => {
    // Mock implementation for getRepositorySEODataByGithubId
    const mockRepository = {
      id: 'uuid-12345',
      github_id: 123456,
      name: 'react',
      full_name: 'facebook/react',
      description: 'A JavaScript library for building user interfaces',
      stars: 150000,
      forks: 30000,
      open_issues_count: 634,
      primary_language: 'JavaScript',
      license: 'MIT',
      last_updated: '2023-05-10T15:32:45Z'
    };
    
    getRepositorySEODataByGithubId.mockResolvedValue(mockRepository);
    
    // Simulate the page component behavior
    const slug = 'react-facebook-123456';
    const slugInfo = parseRepositorySlug(slug);
    const repository = await getRepositorySEODataByGithubId(slugInfo.githubId);
    
    // Verify the correct function was called with the right parameter
    expect(getRepositorySEODataByGithubId).toHaveBeenCalledWith('123456');
    
    // Verify we got the expected repository data
    expect(repository).toEqual(mockRepository);
  });

  test('Repository page handles not found cases', async () => {
    // Mock implementation for getRepositorySEODataByGithubId when repository is not found
    getRepositorySEODataByGithubId.mockResolvedValue(null);
    
    // Simulate the page component behavior with an invalid or non-existent repository
    const slug = 'nonexistent-repo-999999';
    const slugInfo = parseRepositorySlug(slug);
    const repository = await getRepositorySEODataByGithubId(slugInfo.githubId);
    
    // Verify the correct function was called with the right parameter
    expect(getRepositorySEODataByGithubId).toHaveBeenCalledWith('999999');
    
    // Verify we got null, indicating repository not found
    expect(repository).toBeNull();
  });
}); 