import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseRepositorySlug } from '@/lib/url-utils';

// Define types for the page props
interface FilePageProps {
  params: Promise<{
    repositorySlug: string;
    filePath: string[];
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Define metadata generation function
export async function generateMetadata({ params }: FilePageProps): Promise<Metadata> {
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
  
  // Construct the file path from the array segments
  const fullFilePath = resolvedParams.filePath.join('/');
  
  // Extract file name from the path for the title
  const fileName = resolvedParams.filePath[resolvedParams.filePath.length - 1] || '';
  
  // In a real implementation, we would fetch the repository and file data
  // For now, we'll return basic metadata based on the slug info
  const repoName = repositorySlugInfo.name;
  
  return {
    title: `${fileName} | ${repoName} | GitHub Explorer`,
    description: `View file ${fullFilePath} in the ${repoName} repository on GitHub Explorer.`,
    openGraph: {
      title: `${fileName} | ${repoName} | GitHub Explorer`,
      description: `View file ${fullFilePath} in the ${repoName} repository. Browse code, history, and more.`,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `${fileName} | ${repoName} | GitHub Explorer`,
      description: `View file ${fullFilePath} in the ${repoName} repository. Browse code, history, and more.`,
    },
  };
}

/**
 * File Page Component
 * This server component renders a file view with SEO metadata
 */
export default async function FilePage({ params }: FilePageProps) {
  // Await params before using them to avoid NextJS errors
  const resolvedParams = await params;
  
  // Extract the GitHub ID from the repository slug
  const repositorySlugInfo = parseRepositorySlug(resolvedParams.repositorySlug);
  
  if (!repositorySlugInfo) {
    notFound();
  }
  
  // Construct the file path from the array segments
  const fullFilePath = resolvedParams.filePath.join('/');
  
  // For now, we'll use the slug information to render a basic page
  const { name: repoName, githubId: repoGithubId } = repositorySlugInfo;
  
  // Extract file extension for syntax highlighting (in a real app)
  const fileName = resolvedParams.filePath[resolvedParams.filePath.length - 1] || '';
  const fileExtension = fileName.split('.').pop() || '';
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center text-sm mb-4">
          <a href={`/${resolvedParams.repositorySlug}`} className="text-blue-600 hover:underline">
            {repoName}
          </a>
          <span className="mx-2 text-gray-400">/</span>
          
          {/* Build breadcrumb navigation for nested paths */}
          {resolvedParams.filePath.map((segment, index) => {
            // Skip rendering the last segment as a link
            if (index === resolvedParams.filePath.length - 1) {
              return (
                <span key={index} className="text-gray-600">{segment}</span>
              );
            }
            
            // Build the path up to this segment
            const pathToSegment = resolvedParams.filePath.slice(0, index + 1).join('/');
            
            return (
              <span key={index}>
                <a 
                  href={`/${resolvedParams.repositorySlug}/files/${pathToSegment}`} 
                  className="text-blue-600 hover:underline"
                >
                  {segment}
                </a>
                <span className="mx-2 text-gray-400">/</span>
              </span>
            );
          })}
        </div>
        
        <h1 className="text-2xl font-bold mb-4">{fileName}</h1>
        
        <div className="flex items-center space-x-4 mb-6">
          <span className="text-gray-600 text-sm">
            <span className="font-medium">{fileExtension.toUpperCase()}</span> file
          </span>
          <span className="text-gray-600 text-sm">
            Last updated: <span className="font-medium">Unknown</span>
          </span>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        {/* File header with meta information */}
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
              {fileExtension.toUpperCase()}
            </span>
            <span className="text-sm text-gray-600">{fullFilePath}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="text-sm text-gray-600 hover:text-gray-900">
              Download
            </button>
            <button className="text-sm text-gray-600 hover:text-gray-900">
              History
            </button>
          </div>
        </div>
        
        {/* File content placeholder */}
        <div className="p-4 font-mono text-sm overflow-auto max-h-96 bg-gray-50">
          {/* Placeholder for file content - in a real implementation this would be code with syntax highlighting */}
          <div className="space-y-2">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-1"></div>
            </div>
            <div className="animate-pulse mt-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
            </div>
            <div className="animate-pulse mt-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-1"></div>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            This is a placeholder for the file content. In a real implementation, this would display the actual file content with syntax highlighting.
          </p>
        </div>
      </div>
      
      {/* File metadata and statistics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">File Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-600 mb-2">Repository: <span className="font-medium">{repoName}</span></p>
            <p className="text-gray-600 mb-2">Path: <span className="font-medium">{fullFilePath}</span></p>
            <p className="text-gray-600 mb-2">Size: <span className="font-medium">Unknown</span></p>
          </div>
          <div>
            <p className="text-gray-600 mb-2">Lines: <span className="font-medium">Unknown</span></p>
            <p className="text-gray-600 mb-2">MIME Type: <span className="font-medium">Unknown</span></p>
            <p className="text-gray-600 mb-2">Last Commit: <span className="font-medium">Unknown</span></p>
          </div>
        </div>
      </div>
    </div>
  );
} 