import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseRepositorySlug, parseMergeRequestSlug } from '@/lib/url-utils';

// Define types for the page props
interface MergeRequestPageProps {
  params: {
    repositorySlug: string;
    mergeRequestSlug: string;
  };
}

// Define metadata generation function
export async function generateMetadata({ params }: MergeRequestPageProps): Promise<Metadata> {
  // Extract the GitHub IDs from the slugs
  const repositorySlugInfo = parseRepositorySlug(params.repositorySlug);
  const mergeRequestSlugInfo = parseMergeRequestSlug(params.mergeRequestSlug);
  
  if (!repositorySlugInfo || !mergeRequestSlugInfo) {
    return {
      title: 'Merge Request Not Found',
      description: 'The requested merge request could not be found.',
    };
  }
  
  // In a real implementation, we would fetch the repository and merge request data
  // For now, we'll return basic metadata based on the slug info
  const repoName = repositorySlugInfo.name;
  const mrTitle = mergeRequestSlugInfo.title;
  
  return {
    title: `${mrTitle} | ${repoName} | GitHub Explorer`,
    description: `Review merge request "${mrTitle}" for ${repoName} repository on GitHub Explorer.`,
    openGraph: {
      title: `${mrTitle} | ${repoName} | GitHub Explorer`,
      description: `Review merge request "${mrTitle}" for ${repoName} repository, including changes, comments, and reviews.`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${mrTitle} | ${repoName} | GitHub Explorer`,
      description: `Review merge request "${mrTitle}" for ${repoName} repository, including changes, comments, and reviews.`,
    },
  };
}

/**
 * Merge Request Page Component
 * This server component renders the merge request page with SEO metadata
 */
export default async function MergeRequestPage({ params }: MergeRequestPageProps) {
  // Extract the GitHub IDs from the slugs
  const repositorySlugInfo = parseRepositorySlug(params.repositorySlug);
  const mergeRequestSlugInfo = parseMergeRequestSlug(params.mergeRequestSlug);
  
  if (!repositorySlugInfo || !mergeRequestSlugInfo) {
    notFound();
  }
  
  // In a real implementation, we would fetch the repository and merge request data
  // For now, we'll use the slug information to render a basic page
  const { name: repoName, githubId: repoGithubId } = repositorySlugInfo;
  const { title: mrTitle, githubId: mrGithubId } = mergeRequestSlugInfo;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-2">
          <a href={`/${params.repositorySlug}`} className="text-blue-600 hover:underline">
            {repoName}
          </a>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">merge requests</span>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">#{mrGithubId}</span>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">{mrTitle}</h1>
        
        <div className="flex items-center mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mr-2">
            <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
            Open
          </span>
          
          <span className="text-gray-600 text-sm">
            Created by <span className="font-medium">Unknown Author</span>
          </span>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Description</h2>
        <div className="p-4 bg-gray-50 rounded mb-6">
          <p className="text-gray-500 italic">No description provided.</p>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-xl font-semibold mb-4">Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 mb-2">Repository: <span className="font-medium">{repoName}</span></p>
              <p className="text-gray-600 mb-2">Merge Request ID: <span className="font-medium">#{mrGithubId}</span></p>
              <p className="text-gray-600 mb-2">Status: <span className="text-green-600 font-medium">Open</span></p>
            </div>
            <div>
              <p className="text-gray-600 mb-2">Source Branch: <span className="font-medium">unknown</span></p>
              <p className="text-gray-600 mb-2">Target Branch: <span className="font-medium">main</span></p>
              <p className="text-gray-600 mb-2">Created: <span className="font-medium">unknown</span></p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Placeholder for client component */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Changes</h2>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-4">
          This is a placeholder for the client-side rendered merge request changes and reviews.
        </p>
      </div>
    </div>
  );
} 