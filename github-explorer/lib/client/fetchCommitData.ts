'use client';

import { useState, useEffect } from 'react';

// Types for commit data
interface CommitDetails {
  id: string;
  sha: string;
  message: string;
  additions: number;
  deletions: number;
  complexity_score: number | null;
  committed_at: string;
  contributor_name?: string;
  contributor_username?: string;
  contributor_avatar?: string;
}

interface CommitDiff {
  filename: string;
  status: string;
  patch?: string;
  additions: number;
  deletions: number;
}

interface RelatedCommit {
  id: string;
  sha: string;
  message: string;
  committed_at: string;
  additions: number;
  deletions: number;
  contributor_name?: string;
  contributor_username?: string;
  contributor_avatar?: string;
  contributor_slug?: string;
  file_slug?: string;
}

// Hook for fetching commit details
export function useCommitDetails(repositoryGithubId: string, commitSha: string) {
  const [data, setData] = useState<CommitDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCommitDetails() {
      setIsLoading(true);
      try {
        // In a real implementation, this would fetch from an API
        // For demo purposes, we're using a timeout to simulate network request
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for demonstration
        const mockData: CommitDetails = {
          id: `commit-${commitSha}`,
          sha: commitSha,
          message: "Fix bug in navigation component",
          additions: 25,
          deletions: 10,
          complexity_score: 5,
          committed_at: new Date().toISOString(),
          contributor_name: "John Doe",
          contributor_username: "johndoe",
          contributor_avatar: "https://avatars.githubusercontent.com/u/12345678"
        };
        
        setData(mockData);
        setError(null);
      } catch (err) {
        console.error("Error fetching commit details:", err);
        setError("Failed to load commit details. Please try again.");
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (repositoryGithubId && commitSha) {
      fetchCommitDetails();
    }
  }, [repositoryGithubId, commitSha]);

  return { data, isLoading, error };
}

// Hook for fetching commit diff
export function useCommitDiff(repositoryGithubId: string, commitSha: string, filename: string) {
  const [data, setData] = useState<CommitDiff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCommitDiff() {
      setIsLoading(true);
      try {
        // In a real implementation, this would fetch from an API
        // For demo purposes, we're using a timeout to simulate network request
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock data for demonstration
        const mockData: CommitDiff = {
          filename: filename,
          status: 'modified',
          patch: `@@ -1,5 +1,7 @@
+// Added import
+import { useState } from 'react';
 
 export function Component() {
-  const value = 'old';
+  const [value, setValue] = useState('new');
   return <div>{value}</div>;
 }`,
          additions: 3,
          deletions: 1
        };
        
        setData(mockData);
        setError(null);
      } catch (err) {
        console.error("Error fetching commit diff:", err);
        setError("Failed to load code diff. Please try again.");
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (repositoryGithubId && commitSha && filename) {
      fetchCommitDiff();
    }
  }, [repositoryGithubId, commitSha, filename]);

  return { data, isLoading, error };
}

// Hook for fetching related commits
export function useCommitRelated(repositoryGithubId: string, mergeRequestGithubId: string) {
  const [data, setData] = useState<RelatedCommit[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRelatedCommits() {
      setIsLoading(true);
      try {
        // In a real implementation, this would fetch from an API
        // For demo purposes, we're using a timeout to simulate network request
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock data for demonstration
        const mockData: RelatedCommit[] = [
          {
            id: `commit-1`,
            sha: "abc123def456",
            message: "Update dependencies and fix security vulnerabilities",
            committed_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            additions: 120,
            deletions: 80,
            contributor_name: "Jane Smith",
            contributor_username: "janesmith",
            contributor_avatar: "https://avatars.githubusercontent.com/u/87654321",
            contributor_slug: "jane-smith-janesmith-87654321",
            file_slug: "package-json-abc123def456"
          },
          {
            id: `commit-2`,
            sha: "def456ghi789",
            message: "Refactor authentication logic",
            committed_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            additions: 45,
            deletions: 30,
            contributor_name: "John Doe",
            contributor_username: "johndoe",
            contributor_avatar: "https://avatars.githubusercontent.com/u/12345678",
            contributor_slug: "john-doe-johndoe-12345678",
            file_slug: "src-auth-controller-def456ghi789"
          },
          {
            id: `commit-3`,
            sha: "ghi789jkl012",
            message: "Add unit tests for new features",
            committed_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
            additions: 200,
            deletions: 0,
            contributor_name: "Alex Johnson",
            contributor_username: "alexj",
            contributor_avatar: "https://avatars.githubusercontent.com/u/56781234",
            contributor_slug: "alex-johnson-alexj-56781234",
            file_slug: "tests-feature-spec-ghi789jkl012"
          }
        ];
        
        setData(mockData);
        setError(null);
      } catch (err) {
        console.error("Error fetching related commits:", err);
        setError("Failed to load related commits. Please try again.");
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (repositoryGithubId && mergeRequestGithubId) {
      fetchRelatedCommits();
    }
  }, [repositoryGithubId, mergeRequestGithubId]);

  return { data, isLoading, error };
} 