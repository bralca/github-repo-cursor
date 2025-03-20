import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseContributorSlug } from '@/lib/url-utils';

// Define types for the page props
interface ContributorPageProps {
  params: {
    contributorSlug: string;
  };
}

// Define metadata generation function
export async function generateMetadata({ params }: ContributorPageProps): Promise<Metadata> {
  // Extract the GitHub ID from the slug
  const slugInfo = parseContributorSlug(params.contributorSlug);
  
  if (!slugInfo) {
    return {
      title: 'Contributor Not Found',
      description: 'The requested contributor could not be found.',
    };
  }
  
  // In a real implementation, we would fetch the contributor data from the database
  // For now, we'll return basic metadata based on the slug info
  const { name, username, githubId } = slugInfo;
  const displayName = name || username || 'Contributor';
  
  return {
    title: `${displayName} | GitHub Explorer`,
    description: `View ${displayName}'s contributions and statistics on GitHub Explorer.`,
    openGraph: {
      title: `${displayName} | GitHub Explorer`,
      description: `View ${displayName}'s contributions, repositories, and statistics.`,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${displayName} | GitHub Explorer`,
      description: `View ${displayName}'s contributions, repositories, and statistics.`,
    },
  };
}

/**
 * Contributor Page Component
 * This server component renders the contributor page with SEO metadata
 */
export default async function ContributorPage({ params }: ContributorPageProps) {
  // Extract the GitHub ID from the slug
  const slugInfo = parseContributorSlug(params.contributorSlug);
  
  if (!slugInfo) {
    notFound();
  }
  
  // In a real implementation, we would fetch the contributor data from the database
  // For now, we'll use the slug information to render a basic page
  const { name, username, githubId } = slugInfo;
  const displayName = name || username || 'Contributor';
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{displayName}</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-6">
          {/* Placeholder avatar */}
          <div className="w-20 h-20 bg-gray-200 rounded-full mr-6"></div>
          
          <div>
            {name && <p className="text-xl font-semibold">{name}</p>}
            {username && <p className="text-gray-600">@{username}</p>}
            <p className="text-gray-500 mt-1">GitHub ID: {githubId}</p>
          </div>
        </div>
        
        {/* Placeholder stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-600">Repositories</p>
            <p className="text-2xl font-semibold">--</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-600">Contributions</p>
            <p className="text-2xl font-semibold">--</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-600">Impact Score</p>
            <p className="text-2xl font-semibold">--</p>
          </div>
        </div>
        
        <p className="text-gray-500 text-sm">
          This is a placeholder for the contributor page. In a complete implementation, 
          this would display detailed information about the contributor's activity, 
          including repositories they've contributed to, timelines of their contributions, 
          and statistics about their impact.
        </p>
      </div>
      
      {/* Placeholder for client component */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
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
          This is a placeholder for the client-side rendered contributor activity feed.
        </p>
      </div>
    </div>
  );
} 