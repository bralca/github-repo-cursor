import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseContributorSlug } from '@/lib/url-utils';
import { getContributorSEODataByGithubId } from '@/lib/database/contributors';
import ContributorContent from '@/components/contributor/ContributorContent';
import Image from 'next/image';

// Interface for the page's props
interface ContributorPageProps {
  params: {
    contributorSlug: string;
  };
}

// Interface for contributor data that matches the client component's expected format
interface ContributorData {
  id: string;
  github_id: string; // Note: client component expects string
  name: string | null;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  repositories: number | null;
  impact_score: number | null;
  role_classification: string | null;
}

/**
 * Generate metadata for the contributor page
 */
export async function generateMetadata({
  params,
}: ContributorPageProps): Promise<Metadata> {
  // Properly await params before using its properties
  const contributorSlug = (await params).contributorSlug;
  
  // Parse the slug to extract the GitHub ID
  const slugInfo = parseContributorSlug(contributorSlug);
  
  if (!slugInfo) {
    return {
      title: 'Contributor Not Found',
      description: 'This contributor page does not exist.',
    };
  }
  
  // Fetch contributor data for SEO
  const contributor = await getContributorSEODataByGithubId(slugInfo.githubId);
  
  if (!contributor) {
    return {
      title: 'Contributor Not Found',
      description: 'This contributor page does not exist.',
    };
  }

  // Base metadata
  const title = contributor.name 
    ? `${contributor.name} (${contributor.username || 'No Username'}) - GitHub Developer Profile`
    : `${contributor.username || 'Developer'} - GitHub Developer Profile`;
  
  const description = contributor.bio 
    ? `${contributor.bio.slice(0, 150)}${contributor.bio.length > 150 ? '...' : ''}`
    : `View ${contributor.name || contributor.username || 'this GitHub developer'}'s profile, including repositories, contributions, impact score, and more.`;

  // Prepare OpenGraph data
  const ogImage = contributor.avatar 
    ? [{ url: contributor.avatar, width: 400, height: 400, alt: contributor.name || 'Developer avatar' }] 
    : [];

  // Add structured data for better search engine results
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: contributor.name || contributor.username || 'GitHub Developer',
    description: contributor.bio || description,
    image: contributor.avatar || undefined,
    identifier: contributor.github_id,
    sameAs: contributor.username ? `https://github.com/${contributor.username}` : undefined,
    memberOf: contributor.company || undefined,
    location: contributor.location || undefined,
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CreateAction',
        userInteractionCount: contributor.repositories || 0,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ReceiveAction',
        userInteractionCount: 0, // This would be followers if available
      },
    ],
  };

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: contributor.avatar ? [contributor.avatar] : [],
    },
    other: {
      'application-name': 'GitHub Explorer',
    },
    alternates: {
      canonical: `/contributors/${contributorSlug}`,
    },
    // Add structured data
    robots: {
      index: true,
      follow: true,
    },
    // @ts-ignore - structured data is valid but TypeScript doesn't know about it
    structuredData,
  };
}

/**
 * Server Component for the contributor page
 */
export default async function ContributorPage({
  params,
}: ContributorPageProps) {
  // Properly await params before using its properties
  const contributorSlug = (await params).contributorSlug;
  
  // Parse the slug to extract the GitHub ID
  const slugInfo = parseContributorSlug(contributorSlug);
  
  if (!slugInfo) {
    notFound();
  }
  
  // Fetch contributor data
  const contributor = await getContributorSEODataByGithubId(slugInfo.githubId);
  
  if (!contributor) {
    notFound();
  }

  // Convert to expected format for client component
  const contributorData: ContributorData = {
    ...contributor,
    github_id: contributor.github_id.toString() // Convert number to string
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            {contributor.avatar ? (
              <Image
                src={contributor.avatar}
                alt={contributor.name || 'Contributor profile'}
                width={150}
                height={150}
                className="rounded-full"
              />
            ) : (
              <div className="w-[150px] h-[150px] bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {contributor.name || 'GitHub Developer'}
            </h1>
            
            {contributor.username && (
              <p className="text-gray-600 mb-4">@{contributor.username}</p>
            )}
            
            {contributor.bio && (
              <p className="text-gray-700 mb-4">{contributor.bio}</p>
            )}
            
            <div className="flex flex-wrap gap-4 mb-4">
              {contributor.company && (
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{contributor.company}</span>
                </div>
              )}
              
              {contributor.location && (
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{contributor.location}</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {contributor.repositories !== null && (
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-700">{contributor.repositories}</div>
                  <div className="text-sm text-blue-600">Repositories</div>
                </div>
              )}
              
              {contributor.impact_score !== null && (
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-700">{contributor.impact_score}</div>
                  <div className="text-sm text-green-600">Impact Score</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Render the client component with the contributor data */}
      <ContributorContent contributor={contributorData} />
    </main>
  );
} 