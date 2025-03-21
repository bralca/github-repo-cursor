import { render, screen } from '@testing-library/react';
import RepositoryPage, { generateMetadata } from './page';
import { parseRepositorySlug } from '@/lib/url-utils';
import { getRepositorySEODataByGithubId } from '@/lib/database/repositories';

// Mock the required modules
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

jest.mock('@/lib/url-utils', () => ({
  parseRepositorySlug: jest.fn(),
}));

jest.mock('@/lib/database/repositories', () => ({
  getRepositorySEODataByGithubId: jest.fn(),
}));

// Mock the RepositoryContent component
jest.mock('@/components/repository/RepositoryContent', () => {
  return function MockRepositoryContent({ repository }: { repository: any }) {
    return <div data-testid="repository-content">{repository.name}</div>;
  };
});

describe('Repository Page', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMetadata', () => {
    test('returns appropriate metadata when repository exists', async () => {
      // Mock repository data
      const mockRepo = {
        id: '123',
        github_id: '456',
        name: 'Test Repo',
        full_name: 'owner/test-repo',
        description: 'A test repository'
      };

      // Setup mocks
      (parseRepositorySlug as jest.Mock).mockReturnValue({ name: 'test-repo', githubId: '456' });
      (getRepositorySEODataByGithubId as jest.Mock).mockResolvedValue(mockRepo);

      // Call the function
      const metadata = await generateMetadata({ params: { repositorySlug: 'test-repo-456' } } as any);

      // Check the metadata structure
      expect(metadata).toHaveProperty('title', 'owner/test-repo');
      expect(metadata).toHaveProperty('description', 'A test repository');
      expect(metadata).toHaveProperty('openGraph');
      expect(metadata).toHaveProperty('alternates.canonical');
    });

    test('returns not found metadata when repository slug is invalid', async () => {
      // Setup mocks
      (parseRepositorySlug as jest.Mock).mockReturnValue(null);

      // Call the function
      const metadata = await generateMetadata({ params: { repositorySlug: 'invalid-slug' } } as any);

      // Check the metadata structure
      expect(metadata).toHaveProperty('title', 'Repository Not Found');
      expect(metadata).toHaveProperty('description', 'The requested repository could not be found.');
    });

    test('returns not found metadata when repository does not exist', async () => {
      // Setup mocks
      (parseRepositorySlug as jest.Mock).mockReturnValue({ name: 'test-repo', githubId: '456' });
      (getRepositorySEODataByGithubId as jest.Mock).mockResolvedValue(null);

      // Call the function
      const metadata = await generateMetadata({ params: { repositorySlug: 'test-repo-456' } } as any);

      // Check the metadata structure
      expect(metadata).toHaveProperty('title', 'Repository Not Found');
      expect(metadata).toHaveProperty('description', 'The requested repository could not be found.');
    });
  });

  describe('RepositoryPage', () => {
    test('renders the repository content when repository exists', async () => {
      // Mock repository data
      const mockRepo = {
        id: '123',
        github_id: '456',
        name: 'Test Repo',
        full_name: 'owner/test-repo',
      };

      // Setup mocks
      (parseRepositorySlug as jest.Mock).mockReturnValue({ name: 'test-repo', githubId: '456' });
      (getRepositorySEODataByGithubId as jest.Mock).mockResolvedValue(mockRepo);

      // Render the component
      const { rerender } = render(
        <RepositoryPage params={{ repositorySlug: 'test-repo-456' }} />
      );

      // Force re-render to ensure all async operations complete
      rerender(<RepositoryPage params={{ repositorySlug: 'test-repo-456' }} />);

      // Check that the component renders correctly
      expect(screen.getByTestId('repository-content')).toBeInTheDocument();
      expect(screen.getByTestId('repository-content')).toHaveTextContent('Test Repo');
    });

    test('calls notFound when repository does not exist', async () => {
      const { notFound } = require('next/navigation');

      // Setup mocks
      (parseRepositorySlug as jest.Mock).mockReturnValue({ name: 'test-repo', githubId: '456' });
      (getRepositorySEODataByGithubId as jest.Mock).mockResolvedValue(null);

      // Render the component
      render(<RepositoryPage params={{ repositorySlug: 'test-repo-456' }} />);

      // Check that notFound was called
      expect(notFound).toHaveBeenCalled();
    });

    test('calls notFound when repository slug is invalid', async () => {
      const { notFound } = require('next/navigation');

      // Setup mocks
      (parseRepositorySlug as jest.Mock).mockReturnValue(null);

      // Render the component
      render(<RepositoryPage params={{ repositorySlug: 'invalid-slug' }} />);

      // Check that notFound was called
      expect(notFound).toHaveBeenCalled();
    });
  });
}); 