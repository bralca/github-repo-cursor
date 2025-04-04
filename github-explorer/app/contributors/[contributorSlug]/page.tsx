import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseContributorSlug } from '@/lib/url-utils';
import { getContributorByGithubId } from '@/lib/server-api/contributors';
import ContributorContent from '@/components/contributor/ContributorContent';
import { ContributorDetailData } from '@/lib/client/fetchContributorData';
import { ProfileMetadata } from '@/types/contributor';
import { RepositoriesResponse } from '@/hooks/entity/use-contributor-repositories';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

// Allow dynamic parameters
export const dynamicParams = true;

// Define types for the page props
interface ContributorPageProps {
  params: Promise<{
    contributorSlug: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// This function helps Next.js understand our dynamic route structure in production
export function generateStaticParams() {
  // We don't need to pre-generate specific paths, but this function
  // signals to Next.js that this is a dynamic route that should be handled
  // Return an empty array since we don't want to statically generate any paths
  return [];
}

async function fetchContributorData(githubId: string) {
  try {
    // Main contributor data (SSR)
    const contributorRes = await fetch(`${process.env.API_URL}/api/contributors/id/${githubId}`);
    if (!contributorRes.ok) throw new Error('Failed to fetch contributor data');
    const contributor = await contributorRes.json();
    
    // Profile metadata (SSR)
    const metadataRes = await fetch(`${process.env.API_URL}/api/contributors/${githubId}/profile-metadata`);
    if (!metadataRes.ok) throw new Error('Failed to fetch profile metadata');
    const metadata = await metadataRes.json();
    
    // First page of repositories (SSR)
    const reposRes = await fetch(`${process.env.API_URL}/api/contributors/${githubId}/repositories?limit=5&offset=0`);
    if (!reposRes.ok) throw new Error('Failed to fetch repositories');
    const repositories = await reposRes.json();
    
    return {
      contributor,
      metadata,
      repositories
    };
  } catch (error) {
    console.error("Error fetching contributor data:", error);
    throw error;
  }
}

// Define metadata generation function for SEO
export async function generateMetadata({ params }: ContributorPageProps): Promise<Metadata> {
  // Await params before accessing properties
  const { contributorSlug } = await params;
  
  // Extract the GitHub ID from the slug
  const slugInfo = parseContributorSlug(contributorSlug);
  
  if (!slugInfo) {
    return {
      title: 'Contributor Not Found',
      description: 'The requested contributor could not be found.',
    };
  }
  
  // Fetch the contributor data using our SEO-specific function
  try {
    const contributor = await getContributorByGithubId(slugInfo.githubId);
    
    if (!contributor) {
      return {
        title: 'Contributor Not Found',
        description: 'The requested contributor could not be found.',
      };
    }
    
    const displayName = contributor.name || contributor.username || `Contributor ${contributor.github_id}`;
    
    return {
      title: `${displayName} | GitHub Explorer`,
      description: contributor.bio || `View ${displayName}'s GitHub contributions, repositories, and activity.`,
      openGraph: {
        title: `${displayName} | GitHub Explorer`,
        description: contributor.bio || `View ${displayName}'s GitHub contributions, repositories, and activity.`,
        images: contributor.avatar ? [{ url: contributor.avatar }] : undefined,
      },
    };
  } catch (error) {
    console.error('Error generating metadata for contributor page:', error);
    return {
      title: 'Contributor | GitHub Explorer',
      description: 'View contributor details on GitHub Explorer.',
    };
  }
}

// Helper function to map API response to ContributorDetailData
function mapToContributorDetailData(data: any): ContributorDetailData {
  return {
    id: data.id,
    github_id: data.github_id.toString(),
    name: data.name || null,
    username: data.username || null,
    avatar: data.avatar || null,
    bio: data.bio || null,
    company: data.company || null,
    location: data.location || null,
    repositories: data.repositories || null,
    impact_score: data.impact_score || null,
    role_classification: data.role_classification || null
  };
}

// Default export for the page component
export default async function ContributorPage({ params }: ContributorPageProps) {
  // Await params before accessing properties
  const { contributorSlug } = await params;
  
  console.log(`[ContributorPage Debug] Received contributorSlug: ${contributorSlug}`);
  
  // Extract the GitHub ID from the slug
  const slugInfo = parseContributorSlug(contributorSlug);
  
  console.log(`[ContributorPage Debug] Result of parseContributorSlug:`, slugInfo);
  
  if (!slugInfo) {
    console.log(`[ContributorPage Debug] No slug info extracted, returning 404`);
    notFound();
  }
  
  // Debug logging for troubleshooting
  console.log(`[ContributorPage Debug] Processing contributor slug: ${contributorSlug}`);
  console.log(`[ContributorPage Debug] Extracted GitHub ID: ${slugInfo.githubId}`);
  console.log(`[ContributorPage Debug] Extracted name: ${slugInfo.name}`);
  console.log(`[ContributorPage Debug] Extracted username: ${slugInfo.username}`);
  
  // Fetch initial data server-side
  try {
    console.log(`[ContributorPage Debug] Calling getContributorByGithubId with ID: ${slugInfo.githubId}`);
    const seoData = await getContributorByGithubId(slugInfo.githubId);
    
    console.log(`[ContributorPage Debug] getContributorByGithubId response:`, seoData);
    
    if (!seoData) {
      console.log(`[ContributorPage Debug] No contributor data found for GitHub ID: ${slugInfo.githubId}`);
      notFound();
    }

    // Create contributor data object with proper typing
    const contributorData = mapToContributorDetailData(seoData);

    // Fetch additional data for SSR
    try {
      const additionalData = await fetchContributorData(slugInfo.githubId);
      
      // Pass the initial data to the client component
      return (
        <ContributorContent 
          contributor={contributorData} 
          metadata={additionalData.metadata as ProfileMetadata}
          initialRepositories={additionalData.repositories as RepositoriesResponse}
          contributorId={slugInfo.githubId}
        />
      );
    } catch (error) {
      console.error('[ContributorPage Debug] Error fetching additional data:', error);
      
      // Even if additional data fails, we can still render with basic data
      return (
        <ContributorContent 
          contributor={contributorData}
          contributorId={slugInfo.githubId}
        />
      );
    }
  } catch (error) {
    console.error('[ContributorPage Debug] Error fetching contributor data:', error);
    throw error; // Let Next.js error boundary handle this
  }
} 