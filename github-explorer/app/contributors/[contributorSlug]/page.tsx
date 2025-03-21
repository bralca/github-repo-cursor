import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContributorSEODataByGithubId } from '@/lib/database/contributors';
import { parseContributorSlug } from '@/lib/url-utils';
import ContributorContent from '@/components/contributor/ContributorContent';
import Image from 'next/image';

// Interface for the page's props
export interface ContributorPageProps {
  params: Promise<{ contributorSlug: string }>;
}

// Interface for contributor data that matches the client component's expected format
export interface ContributorData {
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
export async function generateMetadata(
  { params }: ContributorPageProps
): Promise<Metadata> {
  const { contributorSlug } = await params;
  
  // Parse the slug to extract the GitHub ID
  const slugInfo = parseContributorSlug(contributorSlug);
  
  if (!slugInfo) {
    return {
      title: 'Contributor Not Found',
      description: 'The contributor you are looking for does not exist.',
    };
  }
  
  // Fetch contributor data for SEO
  const contributor = await getContributorSEODataByGithubId(slugInfo.githubId);
  
  if (!contributor) {
    return {
      title: 'Contributor Not Found',
      description: 'The contributor you are looking for does not exist.',
    };
  }
  
  // Create title and description based on contributor data
  const title = `${contributor.name || contributor.username || 'Contributor'} | GitHub Explorer`;
  const description = contributor.bio 
    ? `${contributor.bio.substring(0, 150)}${contributor.bio.length > 150 ? '...' : ''}`
    : `View ${contributor.name || contributor.username || 'this contributor'}'s profile, repositories, and impact on GitHub.`;
  
  // Build open graph and structured data
  const openGraph = {
    title,
    description,
    images: contributor.avatar ? [{ url: contributor.avatar }] : undefined,
  };
  
  // JSON-LD structured data for search engines
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: contributor.name || contributor.username,
    description: contributor.bio || description,
    image: contributor.avatar || undefined,
    affiliation: contributor.company || undefined,
    location: contributor.location || undefined,
  };
  
  return {
    title,
    description,
    openGraph,
    other: {
      'application-name': 'GitHub Explorer',
      'structured-data': JSON.stringify(structuredData),
    },
  };
}

/**
 * Server Component for the contributor page
 */
export default async function ContributorPage({ params }: ContributorPageProps) {
  const { contributorSlug } = await params;
  
  // Parse the slug to extract the GitHub ID
  const slugInfo = parseContributorSlug(contributorSlug);
  
  if (!slugInfo) {
    // Invalid slug format, show 404
    notFound();
  }
  
  // Fetch contributor data
  const contributor = await getContributorSEODataByGithubId(slugInfo.githubId);
  
  if (!contributor) {
    // Contributor not found, show 404
    notFound();
  }
  
  // Convert to the expected format for the client component
  const contributorData = {
    ...contributor,
    // Ensure values match the expected types in ContributorDetailData
    id: contributor.id,
    github_id: contributor.github_id.toString(),
    name: contributor.name,
    username: contributor.username,
    avatar: contributor.avatar,
    bio: contributor.bio,
    company: contributor.company,
    location: contributor.location,
    repositories: contributor.repositories,
    impact_score: contributor.impact_score,
    role_classification: contributor.role_classification
  };
  
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Header Section with Avatar */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="shrink-0">
            {contributor.avatar ? (
              <div className="relative h-48 w-48 overflow-hidden rounded-lg border-4 border-primary/20">
                <Image
                  src={contributor.avatar}
                  alt={contributor.name || contributor.username || 'Contributor'}
                  width={192}
                  height={192}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 text-4xl font-bold">
                {(contributor.name?.[0] || contributor.username?.[0] || 'C').toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-3xl font-bold text-center md:text-left">
              {contributor.name || 'Anonymous Contributor'}
            </h1>
            
            {contributor.username && (
              <p className="text-xl text-muted-foreground mt-1">@{contributor.username}</p>
            )}
            
            {contributor.bio && (
              <p className="mt-4 text-center md:text-left text-gray-600 dark:text-gray-300">
                {contributor.bio}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-6 mt-6">
              {contributor.company && (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                  <span>{contributor.company}</span>
                </div>
              )}
              
              {contributor.location && (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{contributor.location}</span>
                </div>
              )}
              
              {contributor.repositories !== null && (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 10-2 0v1H8a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                  </svg>
                  <span>{contributor.repositories} Repositories</span>
                </div>
              )}
              
              {contributor.impact_score !== null && (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>Impact Score: {contributor.impact_score?.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content Section */}
        <ContributorContent contributor={contributorData} />
      </div>
    </div>
  );
} 