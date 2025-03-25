import { getMergeRequestBySlug, getMergeRequestSEODataBySlug } from '@/lib/server-api/merge-requests';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { MergeRequestSEOData } from '@/lib/server-api/merge-requests';
import { RepositorySEOData } from '@/lib/server-api/repositories';

interface MergeRequestDataWrapperProps {
  repositorySlug: string;
  mergeRequestSlug: string;
  children: (data: Awaited<ReturnType<typeof getMergeRequestBySlug>>) => ReactNode;
  showNotFound?: boolean;
}

/**
 * Server Component for fetching merge request data
 * 
 * This wrapper component fetches merge request data and passes it to its children.
 * If the merge request is not found, it renders a not found error or returns null.
 */
export async function MergeRequestDataWrapper({
  repositorySlug,
  mergeRequestSlug,
  children,
  showNotFound = true,
}: MergeRequestDataWrapperProps) {
  // Combine the repository slug and merge request slug
  const combinedSlug = `${repositorySlug}/${mergeRequestSlug}`;
  const mergeRequest = await getMergeRequestBySlug(combinedSlug);
  
  if (!mergeRequest) {
    if (showNotFound) {
      notFound();
    }
    return null;
  }
  
  return <>{children(mergeRequest)}</>;
}

// Define the expected return type of getMergeRequestSEODataBySlug
interface MergeRequestSEOResult {
  mergeRequest: MergeRequestSEOData;
  repository: RepositorySEOData;
}

interface MergeRequestSEODataWrapperProps {
  repositorySlug: string;
  mergeRequestSlug: string;
  children: (mergeRequest: MergeRequestSEOData, repository: RepositorySEOData) => ReactNode;
  showNotFound?: boolean;
}

/**
 * Server Component for fetching merge request SEO data
 * 
 * This wrapper fetches only the SEO-relevant data for the merge request,
 * which is more lightweight than the full merge request data.
 * It also fetches related repository data for complete context.
 */
export async function MergeRequestSEODataWrapper({
  repositorySlug,
  mergeRequestSlug,
  children,
  showNotFound = true,
}: MergeRequestSEODataWrapperProps) {
  // Combine the repository slug and merge request slug
  const combinedSlug = `${repositorySlug}/${mergeRequestSlug}`;
  const result = await getMergeRequestSEODataBySlug(combinedSlug) as MergeRequestSEOResult | null;
  
  if (!result) {
    if (showNotFound) {
      notFound();
    }
    return null;
  }
  
  return <>{children(result.mergeRequest, result.repository)}</>;
} 