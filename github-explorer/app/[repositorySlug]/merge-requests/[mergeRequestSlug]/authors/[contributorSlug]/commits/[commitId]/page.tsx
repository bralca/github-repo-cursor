import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
  parseRepositorySlug, 
  parseMergeRequestSlug, 
  parseContributorSlug
} from '@/lib/url-utils';

// Import from server API modules instead of database
import { getRepositorySEODataByGithubId } from '@/lib/server-api/repositories';
import { getMergeRequestSEODataByGithubId } from '@/lib/server-api/merge-requests';
import { getContributorSEODataByGithubId } from '@/lib/server-api/contributors';
import { getCommitSEODataBySha } from '@/lib/server-api/commits';

import { generateCommitMetadata } from '@/lib/metadata-utils';

// Define types for the page props
interface CommitPageProps {
  params: Promise<{
    repositorySlug: string;
    mergeRequestSlug: string;
    contributorSlug: string;
    commitId: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Define metadata generation function
export async function generateMetadata({ params }: CommitPageProps): Promise<Metadata> {
  // Extract the GitHub IDs from the slugs
  const paramsObj = await params;
  const repositorySlugInfo = parseRepositorySlug(paramsObj.repositorySlug);
  const mergeRequestSlugInfo = parseMergeRequestSlug(paramsObj.mergeRequestSlug);
  const contributorSlugInfo = parseContributorSlug(paramsObj.contributorSlug);
  const commitId = paramsObj.commitId;
  
  if (!repositorySlugInfo || !mergeRequestSlugInfo || !contributorSlugInfo || !commitId) {
    return {
      title: 'Commit Not Found',
      description: 'The requested commit could not be found.',
    };
  }
  
  // Fetch repository, merge request, contributor, and commit data for SEO
  const repository = await getRepositorySEODataByGithubId(repositorySlugInfo.githubId);
  const mergeRequest = await getMergeRequestSEODataByGithubId(repositorySlugInfo.githubId, parseInt(mergeRequestSlugInfo.githubId));
  const contributor = await getContributorSEODataByGithubId(contributorSlugInfo.githubId);
  const commit = await getCommitSEODataBySha(commitId);
  
  // Use the metadata generation utility
  const metadata = generateCommitMetadata(
    commit ? {
      sha: commit.github_id,
      message: commit.message,
      file_name: undefined, // We're no longer dealing with a single file
      author_name: contributor?.name || contributor?.username || undefined,
      repository_name: repository?.name,
      committed_at: commit.committed_at,
      github_id: commit.github_id
    } : null,
    repository ? {
      name: repository.name,
      full_name: repository.full_name || undefined,
      description: repository.description || undefined,
      stars: repository.stars || undefined,
      forks: repository.forks || undefined,
      primary_language: repository.primary_language || undefined,
      github_id: repository.github_id
    } : undefined
  );
  
  return metadata;
}

/**
 * Commit Page Component
 * This server component renders the commit page with SEO metadata
 */
export default async function CommitPage({ params }: CommitPageProps) {
  // Extract the GitHub IDs from the slugs
  const paramsObj = await params;
  
  const repositorySlugInfo = parseRepositorySlug(paramsObj.repositorySlug);
  const mergeRequestSlugInfo = parseMergeRequestSlug(paramsObj.mergeRequestSlug);
  const contributorSlugInfo = parseContributorSlug(paramsObj.contributorSlug);
  const commitId = paramsObj.commitId;
  
  if (!repositorySlugInfo || !mergeRequestSlugInfo || !contributorSlugInfo || !commitId) {
    notFound();
  }
  
  try {
    // Simplified version - just show the parameters
    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold mb-6">Commit Details</h1>
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Request Parameters</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Repository:</span> {repositorySlugInfo.name} (ID: {repositorySlugInfo.githubId})</p>
            <p><span className="font-medium">Merge Request:</span> {mergeRequestSlugInfo.title} (ID: {mergeRequestSlugInfo.githubId})</p>
            <p><span className="font-medium">Contributor:</span> {contributorSlugInfo.name || contributorSlugInfo.username} (ID: {contributorSlugInfo.githubId})</p>
            <p><span className="font-medium">Commit ID:</span> {commitId}</p>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
          <p className="text-yellow-800">
            This is a simplified placeholder page. The actual commit content will be implemented in a future update.
          </p>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Commit Page - Error rendering:', error);
    notFound();
  }
} 