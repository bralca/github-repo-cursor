import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseRepositorySlug, parseMergeRequestSlug } from '@/lib/url-utils';
import { getMergeRequestSEODataByGithubId } from '@/lib/database/merge-requests';
import { getRepositorySEODataByGithubId } from '@/lib/database/repositories';
import { getContributorBaseDataByGithubId } from '@/lib/database/contributors';
import { generateMergeRequestMetadata } from '@/lib/metadata-utils';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import MergeRequestContent from '@/components/merge-request/MergeRequestContent';

// Define types for the page props
interface MergeRequestPageProps {
  params: Promise<{
    repositorySlug: string;
    mergeRequestSlug: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Define metadata generation function
export async function generateMetadata({ params }: MergeRequestPageProps): Promise<Metadata> {
  // Extract the GitHub IDs from the slugs
  const paramsObj = await params;
  const repositorySlugInfo = parseRepositorySlug(paramsObj.repositorySlug);
  const mergeRequestSlugInfo = parseMergeRequestSlug(paramsObj.mergeRequestSlug);
  
  if (!repositorySlugInfo || !mergeRequestSlugInfo) {
    return {
      title: 'Merge Request Not Found',
      description: 'The requested merge request could not be found.',
    };
  }
  
  // Fetch repository and merge request data for SEO
  const repository = await getRepositorySEODataByGithubId(repositorySlugInfo.githubId);
  const mergeRequest = await getMergeRequestSEODataByGithubId(
    mergeRequestSlugInfo.githubId,
    repositorySlugInfo.githubId
  );
  
  // Use the metadata generation utility
  const metadata = generateMergeRequestMetadata(
    mergeRequest ? {
      title: mergeRequest.title,
      description: mergeRequest.description || undefined,
      state: mergeRequest.state,
      repository_name: repository?.name,
      repository_id: repository?.github_id,
      created_at: mergeRequest.created_at,
      github_id: mergeRequest.github_id
    } : null,
    repository ? {
      name: repository.name,
      full_name: repository.full_name || undefined,
      description: repository.description || undefined,
      stars: repository.stars || undefined,
      forks: repository.forks || undefined,
      primary_language: repository.primary_language || undefined,
      github_id: repository.github_id,
      url: `/repository/${repository.name}-${repository.github_id}`
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
 * Merge Request Page Component
 * This server component renders the merge request page with SEO metadata
 */
export default async function MergeRequestPage({ params }: MergeRequestPageProps) {
  // Extract the GitHub IDs from the slugs
  const paramsObj = await params;
  const repositorySlugInfo = parseRepositorySlug(paramsObj.repositorySlug);
  const mergeRequestSlugInfo = parseMergeRequestSlug(paramsObj.mergeRequestSlug);
  
  if (!repositorySlugInfo || !mergeRequestSlugInfo) {
    notFound();
  }
  
  // Fetch repository and merge request data
  const repository = await getRepositorySEODataByGithubId(repositorySlugInfo.githubId);
  const mergeRequest = await getMergeRequestSEODataByGithubId(
    mergeRequestSlugInfo.githubId,
    repositorySlugInfo.githubId
  );
  
  // Handle case where data is not found
  if (!repository || !mergeRequest) {
    notFound();
  }
  
  // Fetch author data if available
  let author = null;
  if (mergeRequest.author_github_id) {
    author = await getContributorBaseDataByGithubId(mergeRequest.author_github_id.toString());
  }
  
  // Get status display text and color
  const getStatusInfo = (state: string) => {
    switch (state.toLowerCase()) {
      case 'merged':
        return { text: 'Merged', bgColor: 'bg-purple-100', textColor: 'text-purple-800', dotColor: 'bg-purple-600' };
      case 'closed':
        return { text: 'Closed', bgColor: 'bg-red-100', textColor: 'text-red-800', dotColor: 'bg-red-600' };
      case 'open':
      default:
        return { text: 'Open', bgColor: 'bg-green-100', textColor: 'text-green-800', dotColor: 'bg-green-600' };
    }
  };
  
  const statusInfo = getStatusInfo(mergeRequest.state);
  
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
          <span className="text-gray-600">#{mergeRequest.github_id}</span>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">{mergeRequest.title}</h1>
        
        <div className="flex items-center mb-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.textColor} mr-2`}>
            <span className={`w-2 h-2 ${statusInfo.dotColor} rounded-full mr-1`}></span>
            {statusInfo.text}
          </span>
          
          <span className="text-gray-600 text-sm">
            Created {formatDate(mergeRequest.created_at)} by{' '}
            {author ? (
              <Link 
                href={`/contributors/${author.username ? `${author.username}-` : ''}${author.github_id}`} 
                className="font-medium hover:underline"
              >
                {author.name || author.username || `User #${author.github_id}`}
              </Link>
            ) : (
              <span className="font-medium">Unknown Author</span>
            )}
          </span>
        </div>
      </div>
      
      {/* Client component for interactive content */}
      <MergeRequestContent 
        repositoryGithubId={parseInt(repositorySlugInfo.githubId)}
        mergeRequestGithubId={parseInt(mergeRequestSlugInfo.githubId)}
        initialData={{
          title: mergeRequest.title,
          description: mergeRequest.description || undefined,
          state: mergeRequest.state as 'open' | 'closed' | 'merged',
          created_at: mergeRequest.created_at,
          updated_at: mergeRequest.updated_at,
          additions: mergeRequest.additions,
          deletions: mergeRequest.deletions,
          changed_files: mergeRequest.changed_files,
          commits_count: mergeRequest.commits_count,
          repository: {
            id: `repo-${repository.github_id}`,
            name: repository.name,
            full_name: repository.full_name || repository.name,
            github_id: parseInt(repository.github_id.toString())
          },
          author: author ? {
            id: `author-${author.github_id}`,
            github_id: parseInt(author.github_id.toString()),
            username: author.username || '',
            name: author.name,
            avatar: author.avatar || 'https://avatars.githubusercontent.com/u/0?v=4'
          } : undefined
        }}
      />
    </div>
  );
}