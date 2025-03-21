import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
  parseRepositorySlug, 
  parseMergeRequestSlug, 
  parseContributorSlug,
  parseFileSlug
} from '@/lib/url-utils';
import { 
  getRepositorySEODataByGithubId 
} from '@/lib/database/repositories';
import {
  getMergeRequestSEODataByGithubId
} from '@/lib/database/merge-requests';
import {
  getContributorBaseDataByGithubId
} from '@/lib/database/contributors';
import {
  getCommitSEODataBySha
} from '@/lib/database/commits';
import { generateCommitMetadata } from '@/lib/metadata-utils';
import Link from 'next/link';
import Image from 'next/image';
import { format, formatDistanceToNow } from 'date-fns';
import CommitContent from '@/components/commit/CommitContent';

// Define types for the page props
interface CommitPageProps {
  params: Promise<{
    repositorySlug: string;
    mergeRequestSlug: string;
    contributorSlug: string;
    fileSlug: string;
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
  const fileSlugInfo = parseFileSlug(paramsObj.fileSlug);
  
  if (!repositorySlugInfo || !mergeRequestSlugInfo || !contributorSlugInfo || !fileSlugInfo) {
    return {
      title: 'Commit Not Found',
      description: 'The requested commit could not be found.',
    };
  }
  
  // Fetch repository, merge request, contributor, and commit data for SEO
  const repository = await getRepositorySEODataByGithubId(repositorySlugInfo.githubId);
  const mergeRequest = await getMergeRequestSEODataByGithubId(
    mergeRequestSlugInfo.githubId,
    repositorySlugInfo.githubId
  );
  const contributor = await getContributorBaseDataByGithubId(contributorSlugInfo.githubId);
  const commit = await getCommitSEODataBySha(
    fileSlugInfo.githubId, // Using fileSlugInfo.githubId as the SHA for now
    repositorySlugInfo.githubId
  );
  
  // Use the metadata generation utility
  const metadata = generateCommitMetadata(
    commit ? {
      sha: commit.sha,
      message: commit.message,
      file_name: fileSlugInfo.filename,
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
 * Format date to display '3 days ago' format
 */
function formatDate(dateString: string | null) {
  if (!dateString) return 'Unknown';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Commit Page Component
 * This server component renders the commit page with SEO metadata
 */
export default async function CommitPage({ params }: CommitPageProps) {
  console.log('Commit Page - Starting to render with params:', params);
  
  // Extract the GitHub IDs from the slugs
  const paramsObj = await params;
  console.log('Commit Page - Params after await:', paramsObj);
  
  const repositorySlugInfo = parseRepositorySlug(paramsObj.repositorySlug);
  console.log('Commit Page - Repository slug info:', repositorySlugInfo);
  
  const mergeRequestSlugInfo = parseMergeRequestSlug(paramsObj.mergeRequestSlug);
  console.log('Commit Page - Merge request slug info:', mergeRequestSlugInfo);
  
  const contributorSlugInfo = parseContributorSlug(paramsObj.contributorSlug);
  console.log('Commit Page - Contributor slug info:', contributorSlugInfo);
  
  const fileSlugInfo = parseFileSlug(paramsObj.fileSlug);
  console.log('Commit Page - File slug info:', fileSlugInfo);
  
  if (!repositorySlugInfo || !mergeRequestSlugInfo || !contributorSlugInfo || !fileSlugInfo) {
    console.log('Commit Page - Some slug info is missing, returning 404');
    notFound();
  }
  
  try {
    // Fetch repository, merge request, contributor, and commit data
    console.log('Commit Page - Starting database queries');
    
    console.log('Commit Page - Fetching repository with ID:', repositorySlugInfo.githubId);
    const repository = await getRepositorySEODataByGithubId(repositorySlugInfo.githubId);
    console.log('Commit Page - Repository result:', repository ? 'Found' : 'Not found');
    
    console.log('Commit Page - Fetching merge request with ID:', mergeRequestSlugInfo.githubId);
    const mergeRequest = await getMergeRequestSEODataByGithubId(
      mergeRequestSlugInfo.githubId,
      repositorySlugInfo.githubId
    );
    console.log('Commit Page - Merge request result:', mergeRequest ? 'Found' : 'Not found');
    
    console.log('Commit Page - Fetching contributor with ID:', contributorSlugInfo.githubId);
    const contributor = await getContributorBaseDataByGithubId(contributorSlugInfo.githubId);
    console.log('Commit Page - Contributor result:', contributor ? 'Found' : 'Not found');
    
    console.log('Commit Page - Fetching commit with SHA:', fileSlugInfo.githubId);
    const commit = await getCommitSEODataBySha(
      fileSlugInfo.githubId,
      repositorySlugInfo.githubId
    );
    console.log('Commit Page - Commit result:', commit ? 'Found' : 'Not found');
    
    // Handle case where data is not found
    if (!repository || !mergeRequest || !contributor || !commit) {
      console.log('Commit Page - Some data is missing, returning 404');
      notFound();
    }
    
    // Continue with the rest of the page rendering
    console.log('Commit Page - All data found, continuing with rendering');
    
    // Get status display text and color
    const getStatusInfo = (status: string) => {
      switch (status.toLowerCase()) {
        case 'added':
          return { text: 'Added', bgColor: 'bg-green-100', textColor: 'text-green-800', dotColor: 'bg-green-600' };
        case 'modified':
          return { text: 'Modified', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', dotColor: 'bg-yellow-600' };
        case 'deleted':
          return { text: 'Deleted', bgColor: 'bg-red-100', textColor: 'text-red-800', dotColor: 'bg-red-600' };
        default:
          return { text: 'Changed', bgColor: 'bg-blue-100', textColor: 'text-blue-800', dotColor: 'bg-blue-600' };
      }
    };
    
    // We don't have status in the commit data, so use a default
    const statusInfo = getStatusInfo('modified');
    
    // Prepare initial data for the client component
    const initialData = {
      commit: {
        id: commit.id,
        github_id: commit.github_id,
        sha: commit.sha,
        message: commit.message,
        committed_at: commit.committed_at,
        additions: commit.additions,
        deletions: commit.deletions,
        changed_files: commit.changed_files || 1,
        complexity_score: commit.complexity_score
      },
      repository: {
        id: repository.id,
        github_id: repository.github_id.toString(),
        name: repository.name,
        full_name: repository.full_name || repository.name
      },
      contributor: {
        id: contributor.id,
        github_id: contributor.github_id.toString(),
        name: contributor.name || undefined,
        username: contributor.username || undefined,
        avatar: contributor.avatar || undefined
      },
      mergeRequest: {
        id: mergeRequest.id,
        github_id: mergeRequest.github_id.toString(),
        title: mergeRequest.title
      },
      filename: fileSlugInfo.filename
    };
    
    return (
      <main>
        <CommitContent 
          initialData={initialData}
          repositorySlug={paramsObj.repositorySlug}
          mergeRequestSlug={paramsObj.mergeRequestSlug}
          contributorSlug={paramsObj.contributorSlug}
          fileSlug={paramsObj.fileSlug}
        />
      </main>
    );
  } catch (error) {
    console.error('Commit Page - Error rendering:', error);
    notFound();
  }
} 