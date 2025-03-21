import { render, screen } from '@testing-library/react';
import { EntityLink } from './EntityLink';
import {
  buildRepositoryUrl,
  buildContributorUrl,
  buildMergeRequestUrl,
  buildCommitUrl
} from '@/lib/url-utils';

// Mock url-utils functions
jest.mock('@/lib/url-utils', () => ({
  // Export actual types
  ...jest.requireActual('@/lib/url-utils'),
  // Mock URL building functions
  buildRepositoryUrl: jest.fn().mockReturnValue('/test-repo-123'),
  buildContributorUrl: jest.fn().mockReturnValue('/contributors/john-doe-456'),
  buildMergeRequestUrl: jest.fn().mockReturnValue('/test-repo-123/merge-requests/new-feature-789'),
  buildCommitUrl: jest.fn().mockReturnValue('/test-repo-123/merge-requests/new-feature-789/commits/john-doe-456/main-js-012')
}));

describe('EntityLink', () => {
  // Test data
  const repository = { id: '1', github_id: '123', name: 'Test Repo' };
  const contributor = { id: '2', github_id: '456', name: 'John Doe', username: 'johndoe' };
  const mergeRequest = { id: '3', github_id: '789', title: 'New Feature', repository_id: '1', repository_github_id: '123' };
  const file = { id: '4', github_id: '012', filename: 'main.js' };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders repository link correctly', () => {
    render(
      <EntityLink entityType="repository" entity={repository}>
        Repository Link
      </EntityLink>
    );
    
    expect(buildRepositoryUrl).toHaveBeenCalledWith(repository);
    expect(screen.getByText('Repository Link')).toHaveAttribute('href', '/test-repo-123');
  });

  test('renders contributor link correctly', () => {
    render(
      <EntityLink entityType="contributor" entity={contributor}>
        Contributor Link
      </EntityLink>
    );
    
    expect(buildContributorUrl).toHaveBeenCalledWith(contributor);
    expect(screen.getByText('Contributor Link')).toHaveAttribute('href', '/contributors/john-doe-456');
  });

  test('renders merge request link correctly', () => {
    render(
      <EntityLink 
        entityType="mergeRequest" 
        entity={mergeRequest} 
        repository={repository}
      >
        Merge Request Link
      </EntityLink>
    );
    
    expect(buildMergeRequestUrl).toHaveBeenCalledWith(repository, mergeRequest);
    expect(screen.getByText('Merge Request Link')).toHaveAttribute('href', '/test-repo-123/merge-requests/new-feature-789');
  });

  test('renders commit link correctly', () => {
    render(
      <EntityLink 
        entityType="commit" 
        entity={file} 
        repository={repository}
        mergeRequest={mergeRequest}
        contributor={contributor}
      >
        Commit Link
      </EntityLink>
    );
    
    expect(buildCommitUrl).toHaveBeenCalledWith(repository, mergeRequest, contributor, file);
    expect(screen.getByText('Commit Link')).toHaveAttribute('href', '/test-repo-123/merge-requests/new-feature-789/commits/john-doe-456/main-js-012');
  });

  test('applies custom className', () => {
    render(
      <EntityLink 
        entityType="repository" 
        entity={repository} 
        className="custom-class"
      >
        Repository Link
      </EntityLink>
    );
    
    expect(screen.getByText('Repository Link')).toHaveClass('custom-class');
  });

  test('applies title attribute', () => {
    render(
      <EntityLink 
        entityType="repository" 
        entity={repository} 
        title="Custom Title"
      >
        Repository Link
      </EntityLink>
    );
    
    expect(screen.getByText('Repository Link')).toHaveAttribute('title', 'Custom Title');
  });

  test('applies aria-label attribute', () => {
    render(
      <EntityLink 
        entityType="repository" 
        entity={repository} 
        ariaLabel="Custom Aria Label"
      >
        Repository Link
      </EntityLink>
    );
    
    expect(screen.getByText('Repository Link')).toHaveAttribute('aria-label', 'Custom Aria Label');
  });
}); 