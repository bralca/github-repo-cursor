import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseRepositorySlug } from '@/lib/url-utils';

// Define types for the page props
interface CommitPageProps {
  params: Promise<{
    repositorySlug: string;
    commitHash: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Define metadata generation function
export async function generateMetadata({ params }: CommitPageProps): Promise<Metadata> {
  // Await params before using them to avoid NextJS errors
  const resolvedParams = await params;
  
  // Extract the GitHub ID from the repository slug
  const repositorySlugInfo = parseRepositorySlug(resolvedParams.repositorySlug);
  
  if (!repositorySlugInfo) {
    return {
      title: 'Repository Not Found',
      description: 'The requested repository could not be found.',
    };
  }
  
  // Truncate the commit hash for display if it's very long
  const displayCommitHash = resolvedParams.commitHash.length > 10 
    ? resolvedParams.commitHash.substring(0, 7) 
    : resolvedParams.commitHash;
  
  // In a real implementation, we would fetch the repository and commit data
  // For now, we'll return basic metadata based on the slug info
  const repoName = repositorySlugInfo.name;
  
  return {
    title: `Commit ${displayCommitHash} | ${repoName} | GitHub Explorer`,
    description: `View commit ${displayCommitHash} in the ${repoName} repository on GitHub Explorer.`,
    openGraph: {
      title: `Commit ${displayCommitHash} | ${repoName} | GitHub Explorer`,
      description: `View commit ${displayCommitHash} in the ${repoName} repository. Browse changes, affected files, and commit details.`,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `Commit ${displayCommitHash} | ${repoName} | GitHub Explorer`,
      description: `View commit ${displayCommitHash} in the ${repoName} repository. Browse changes, affected files, and commit details.`,
    },
  };
}

/**
 * Commit Page Component
 * This server component renders a commit view with SEO metadata
 */
export default async function CommitPage({ params }: CommitPageProps) {
  // Await params before using them to avoid NextJS errors
  const resolvedParams = await params;
  
  // Extract the GitHub ID from the repository slug
  const repositorySlugInfo = parseRepositorySlug(resolvedParams.repositorySlug);
  
  if (!repositorySlugInfo) {
    notFound();
  }
  
  // Truncate the commit hash for display if it's very long
  const displayCommitHash = resolvedParams.commitHash.length > 10 
    ? resolvedParams.commitHash.substring(0, 7) 
    : resolvedParams.commitHash;
  
  // For now, we'll use the slug information to render a basic page
  const { name: repoName, githubId: repoGithubId } = repositorySlugInfo;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center text-sm mb-4">
          <a href={`/${resolvedParams.repositorySlug}`} className="text-blue-600 hover:underline">
            {repoName}
          </a>
          <span className="mx-2 text-gray-400">/</span>
          <a href={`/${resolvedParams.repositorySlug}/commits`} className="text-blue-600 hover:underline">
            commits
          </a>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">{displayCommitHash}</span>
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Commit: {displayCommitHash}</h1>
        
        <div className="flex items-center space-x-4 mb-6">
          <span className="text-gray-600 text-sm">
            Committed by: <span className="font-medium">Unknown</span>
          </span>
          <span className="text-gray-600 text-sm">
            Date: <span className="font-medium">Unknown</span>
          </span>
        </div>
      </div>
      
      {/* Commit summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Commit Message</h2>
        <div className="p-4 bg-gray-50 rounded mb-6">
          <p className="text-gray-500 italic">No commit message available</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Details</h3>
            <div className="space-y-2">
              <p className="text-gray-600">Repository: <span className="font-medium">{repoName}</span></p>
              <p className="text-gray-600">Full Hash: <span className="font-medium font-mono">{resolvedParams.commitHash}</span></p>
              <p className="text-gray-600">Parent Commit: <span className="font-medium font-mono">Unknown</span></p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Stats</h3>
            <div className="space-y-2">
              <p className="text-gray-600">Changed Files: <span className="font-medium">Unknown</span></p>
              <p className="text-gray-600">Additions: <span className="font-medium text-green-600">+0</span></p>
              <p className="text-gray-600">Deletions: <span className="font-medium text-red-600">-0</span></p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Changed files */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Changed Files</h2>
        
        {/* Placeholder for file list */}
        <div className="divide-y divide-gray-200">
          <div className="py-3 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-1"></div>
            <div className="flex mt-1">
              <div className="h-4 bg-green-100 rounded w-16 mr-2"></div>
              <div className="h-4 bg-red-100 rounded w-16"></div>
            </div>
          </div>
          <div className="py-3 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-2/3 mb-1"></div>
            <div className="flex mt-1">
              <div className="h-4 bg-green-100 rounded w-12 mr-2"></div>
              <div className="h-4 bg-red-100 rounded w-24"></div>
            </div>
          </div>
          <div className="py-3 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/2 mb-1"></div>
            <div className="flex mt-1">
              <div className="h-4 bg-green-100 rounded w-20 mr-2"></div>
              <div className="h-4 bg-red-100 rounded w-8"></div>
            </div>
          </div>
        </div>
        
        <p className="text-gray-500 text-sm mt-4">
          This is a placeholder for the changed files list. In a real implementation, this would display the actual files changed in this commit.
        </p>
      </div>
      
      {/* Diff viewer placeholder */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Diff</h2>
        
        <div className="bg-gray-50 p-4 rounded font-mono text-sm overflow-auto">
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-4 bg-green-100 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-4 bg-red-100 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
            </div>
          </div>
          
          <p className="text-gray-500 text-sm mt-4 font-sans">
            This is a placeholder for the diff viewer. In a real implementation, this would display the actual code changes with syntax highlighting.
          </p>
        </div>
      </div>
    </div>
  );
} 