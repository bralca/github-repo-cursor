import { getCommitBySha, getCommitSEODataBySha } from '@/lib/database/commits';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { CommitSEOData, RepositorySEOData } from '@/lib/metadata-utils';

interface CommitDataWrapperProps {
  repositorySlug: string;
  commitSha: string;
  children: (data: Awaited<ReturnType<typeof getCommitBySha>>) => ReactNode;
  showNotFound?: boolean;
}

/**
 * Server Component for fetching commit data
 * 
 * This wrapper component fetches commit data and passes it to its children.
 * If the commit is not found, it renders a not found error or returns null.
 */
export async function CommitDataWrapper({
  repositorySlug,
  commitSha,
  children,
  showNotFound = true,
}: CommitDataWrapperProps) {
  const commit = await getCommitBySha(repositorySlug, commitSha);
  
  if (!commit) {
    if (showNotFound) {
      notFound();
    }
    return null;
  }
  
  return <>{children(commit)}</>;
}

// Define the expected return type of getCommitSEODataBySha
interface CommitSEOResult {
  commit: CommitSEOData;
  repository: RepositorySEOData;
}

interface CommitSEODataWrapperProps {
  repositorySlug: string;
  commitSha: string;
  children: (commit: CommitSEOData, repository: RepositorySEOData) => ReactNode;
  showNotFound?: boolean;
}

/**
 * Server Component for fetching commit SEO data
 * 
 * This wrapper fetches only the SEO-relevant data for the commit,
 * which is more lightweight than the full commit data.
 * It also fetches related repository data for complete context.
 */
export async function CommitSEODataWrapper({
  repositorySlug,
  commitSha,
  children,
  showNotFound = true,
}: CommitSEODataWrapperProps) {
  const result = await getCommitSEODataBySha(repositorySlug, commitSha) as CommitSEOResult | null;
  
  if (!result) {
    if (showNotFound) {
      notFound();
    }
    return null;
  }
  
  return <>{children(result.commit, result.repository)}</>;
} 