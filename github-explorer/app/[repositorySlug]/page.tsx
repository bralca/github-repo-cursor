import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseRepositorySlug } from '@/lib/url-utils';
import { getRepositoryByGithubId } from '@/lib/server-api/repositories';
import RepositoryContent from '../../components/repository/RepositoryContent';

// Define types for the page props
interface RepositoryPageProps {
  params: Promise<{
    repositorySlug: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Define metadata generation function for SEO
export async function generateMetadata({ params }: RepositoryPageProps): Promise<Metadata> {
  // Await params before accessing properties
  const { repositorySlug } = await params;
  
  // Extract the GitHub ID from the slug
  const slugInfo = parseRepositorySlug(repositorySlug);
  
  if (!slugInfo) {
    return {
      title: 'Repository Not Found',
      description: 'The requested repository could not be found.',
    };
  }
  
  // Fetch the repository data using our function
  const repository = await getRepositoryByGithubId(slugInfo.githubId);
  
  if (!repository) {
    return {
      title: 'Repository Not Found',
      description: 'The requested repository could not be found.',
    };
  }
  
  // Generate metadata based on repository information
  return {
    title: repository.full_name || repository.name,
    description: repository.description || `Explore ${repository.name} on GitHub Explorer`,
    openGraph: {
      title: repository.full_name || repository.name,
      description: repository.description || `Explore ${repository.name} on GitHub Explorer`,
      type: 'website',
      images: [
        {
          url: 'https://github-explorer.example.com/og-image.png',
          width: 1200,
          height: 630,
          alt: repository.full_name || repository.name,
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: repository.full_name || repository.name,
      description: repository.description || `Explore ${repository.name} on GitHub Explorer`,
    },
    // Add canonical URL to prevent duplicate content issues
    alternates: {
      canonical: `https://github-explorer.example.com/${repositorySlug}`,
    },
    // Add structured data for search engines
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        name: repository.full_name || repository.name,
        description: repository.description || `Explore ${repository.name} on GitHub Explorer`,
        codeRepository: `https://github.com/${repository.full_name || repository.name}`,
        programmingLanguage: {
          '@type': 'ComputerLanguage',
          name: repository.primary_language || 'Unknown',
        },
        dateModified: repository.last_updated ? new Date(repository.last_updated).toISOString() : new Date().toISOString(),
        license: repository.license || 'Unknown',
        creator: {
          '@type': 'Organization',
          name: repository.full_name?.split('/')[0] || 'Unknown',
        },
        interactionStatistic: [
          {
            '@type': 'InteractionCounter',
            interactionType: {
              '@type': 'LikeAction',
            },
            userInteractionCount: repository.stars || 0,
          },
          {
            '@type': 'InteractionCounter',
            interactionType: {
              '@type': 'ForkAction',
            },
            userInteractionCount: repository.forks || 0,
          },
        ],
      }),
    },
  };
}

/**
 * Repository Page Component
 * This server component fetches repository data and renders the repository page
 */
export default async function RepositoryPage({ params }: RepositoryPageProps) {
  // Await params before accessing properties
  const { repositorySlug } = await params;
  
  // Extract the GitHub ID from the slug
  const slugInfo = parseRepositorySlug(repositorySlug);
  
  if (!slugInfo) {
    notFound();
  }
  
  // Fetch the repository data using our function
  const repository = await getRepositoryByGithubId(slugInfo.githubId);
  
  if (!repository) {
    notFound();
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{repository.full_name || repository.name}</h1>
        {repository.description && (
          <p className="text-lg text-gray-600 mb-4">{repository.description}</p>
        )}
        
        <div className="flex flex-wrap gap-4 mb-6">
          {repository.stars !== undefined && (
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              <span>{repository.stars?.toLocaleString() || 0} stars</span>
            </div>
          )}
          
          {repository.forks !== undefined && (
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
              <span>{repository.forks?.toLocaleString() || 0} forks</span>
            </div>
          )}
          
          {repository.open_issues_count !== undefined && (
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
              <span>{repository.open_issues_count?.toLocaleString() || 0} open issues</span>
            </div>
          )}
          
          {repository.last_updated && (
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
              </svg>
              <span>Updated {new Date(repository.last_updated).toLocaleDateString()}</span>
            </div>
          )}
          
          {repository.primary_language && (
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
              <span>{repository.primary_language}</span>
            </div>
          )}
          
          {repository.license && (
            <div className="flex items-center">
              <svg className="w-5 h-5 text-purple-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd"></path>
              </svg>
              <span>{repository.license}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Client Component for interactive content */}
      <RepositoryContent repository={{
        id: repository.id,
        github_id: repository.github_id.toString(),
        name: repository.name,
        full_name: repository.full_name,
        description: repository.description || undefined,
        stars: repository.stars || undefined,
        forks: repository.forks || undefined,
        open_issues_count: repository.open_issues_count || undefined,
        last_updated: repository.last_updated || undefined,
        primary_language: repository.primary_language || undefined,
        license: repository.license || undefined
      }} />
    </div>
  );
} 