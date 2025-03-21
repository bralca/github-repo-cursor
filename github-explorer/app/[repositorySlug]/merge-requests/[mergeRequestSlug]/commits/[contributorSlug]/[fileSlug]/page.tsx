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

// Define types for the page props
interface CommitPageProps {
  params: {
    repositorySlug: string;
    mergeRequestSlug: string;
    contributorSlug: string;
    fileSlug: string;
  };
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
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="mb-2">
            <Link href={`/${paramsObj.repositorySlug}`} className="text-blue-600 hover:underline">
              {repository.name}
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href={`/${paramsObj.repositorySlug}/merge-requests`} className="text-blue-600 hover:underline">
              merge requests
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href={`/${paramsObj.repositorySlug}/merge-requests/${paramsObj.mergeRequestSlug}`} className="text-blue-600 hover:underline">
              #{mergeRequest.github_id}
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href={`/${paramsObj.repositorySlug}/merge-requests/${paramsObj.mergeRequestSlug}/commits`} className="text-blue-600 hover:underline">
              commits
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-600">{commit.sha.substring(0, 7)}</span>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">{commit.message}</h1>
          
          <div className="flex items-center mb-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.textColor} mr-2`}>
              <span className={`w-2 h-2 ${statusInfo.dotColor} rounded-full mr-1`}></span>
              {statusInfo.text}
            </span>
            
            <span className="text-gray-600 text-sm">
              Committed {formatDate(commit.committed_at)} by{' '}
              <Link 
                href={`/contributors/${paramsObj.contributorSlug}`} 
                className="font-medium hover:underline"
              >
                {contributor.name || contributor.username || `User #${contributor.github_id}`}
              </Link>
            </span>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {contributor.avatar && (
                  <Image 
                    src={contributor.avatar} 
                    alt={contributor.username || 'Contributor avatar'} 
                    width={40} 
                    height={40} 
                    className="rounded-full"
                  />
                )}
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-medium">
                  {fileSlugInfo.filename}
                </h2>
                <div className="text-sm text-gray-600">
                  <span className="text-green-600 mr-2">+{commit.additions || 0}</span>
                  <span className="text-red-600">-{commit.deletions || 0}</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span>{format(new Date(commit.committed_at), 'MMM d, yyyy')}</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="font-mono">{commit.sha.substring(0, 7)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Placeholder for client component */}
        <div className="bg-white shadow rounded-lg overflow-hidden p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Commit Details</h2>
            <p className="text-gray-600 mb-4">
              This commit was made to the file <code className="bg-gray-100 px-2 py-1 rounded">{fileSlugInfo.filename}</code> 
              by {contributor.name || contributor.username} in merge request "{mergeRequest.title}".
            </p>
            
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <h3 className="font-medium mb-2">Commit Message</h3>
              <p className="whitespace-pre-line">{commit.message}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Repository</h3>
                <Link href={`/${paramsObj.repositorySlug}`} className="text-indigo-600 hover:text-indigo-800">
                  {repository.name}
                </Link>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Merge Request</h3>
                <Link href={`/${paramsObj.repositorySlug}/merge-requests/${paramsObj.mergeRequestSlug}`} className="text-indigo-600 hover:text-indigo-800">
                  {mergeRequest.title}
                </Link>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">SHA</h3>
                <p className="font-mono text-sm">{commit.sha}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Changes</h3>
                <p>
                  <span className="text-green-600 mr-2">+{commit.additions || 0} additions</span>
                  <span className="text-red-600">-{commit.deletions || 0} deletions</span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">File Changes</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-500 italic">
                Detailed file changes will be available in the client component implementation.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Commit Page - Error rendering:', error);
    notFound();
  }
} 