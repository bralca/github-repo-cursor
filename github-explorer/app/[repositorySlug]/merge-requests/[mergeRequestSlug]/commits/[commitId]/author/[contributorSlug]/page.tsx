import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
  parseRepositorySlug, 
  parseMergeRequestSlug, 
  parseContributorSlug
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
  getCommitSEODataBySha,
  getCommitFiles
} from '@/lib/database/commits';
import { generateCommitMetadata } from '@/lib/metadata-utils';
import CommitContent from '@/components/commit/CommitContent';

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
  const mergeRequest = await getMergeRequestSEODataByGithubId(
    mergeRequestSlugInfo.githubId,
    repositorySlugInfo.githubId
  );
  const contributor = await getContributorBaseDataByGithubId(contributorSlugInfo.githubId);
  const commit = await getCommitSEODataBySha(
    commitId, // The commitId is the commit SHA
    repositorySlugInfo.githubId
  );
  
  // Use the metadata generation utility
  const metadata = generateCommitMetadata(
    commit ? {
      sha: commit.sha,
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
  
  const commitId = paramsObj.commitId;
  console.log('Commit Page - Commit ID:', commitId);
  
  if (!repositorySlugInfo || !mergeRequestSlugInfo || !contributorSlugInfo || !commitId) {
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
    
    console.log('Commit Page - Fetching commit with SHA:', commitId);
    const commit = await getCommitSEODataBySha(
      commitId,
      repositorySlugInfo.githubId
    );
    console.log('Commit Page - Commit result:', commit ? 'Found' : 'Not found');
    
    // Get all files for this commit
    console.log('Commit Page - Fetching files for commit:', commitId);
    const files = await getCommitFiles(commitId, repositorySlugInfo.githubId);
    console.log('Commit Page - Found', files?.length || 0, 'files for this commit');
    
    // Handle case where data is not found
    if (!repository || !mergeRequest || !contributor || !commit) {
      console.log('Commit Page - Some data is missing, returning 404');
      notFound();
    }
    
    // Continue with the rest of the page rendering
    console.log('Commit Page - All data found, continuing with rendering');
    
    // Find the first file to use as default
    const defaultFilename = files && files.length > 0 ? files[0].filename : "No files available";
    
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
        changed_files: commit.changed_files || (files?.length || 1),
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
      filename: defaultFilename // Setting a default filename
    };
    
    return (
      <main>
        <CommitContent 
          initialData={initialData}
          repositorySlug={paramsObj.repositorySlug}
          mergeRequestSlug={paramsObj.mergeRequestSlug}
          contributorSlug={paramsObj.contributorSlug}
          commitId={commitId}
        />
      </main>
    );
  } catch (error) {
    console.error('Commit Page - Error rendering:', error);
    notFound();
  }
} 