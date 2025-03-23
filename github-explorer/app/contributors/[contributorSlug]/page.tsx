import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseContributorSlug } from '@/lib/url-utils';
import { getContributorSEODataByGithubId, ContributorSEOData } from '@/lib/database/contributors';
import ContributorContent from '@/components/contributor/ContributorContent';
import { ContributorDetailData } from '@/lib/client/fetchContributorData';

// Define types for the page props
interface ContributorPageProps {
  params: Promise<{
    contributorSlug: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Convert the SEO data to the format expected by the client component
function mapToContributorDetailData(contributor: ContributorSEOData): ContributorDetailData {
  return {
    ...contributor,
    github_id: contributor.github_id.toString(), // Convert number to string
  };
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
    const contributor = await getContributorSEODataByGithubId(slugInfo.githubId);
    
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

// Default export for the page component
export default async function ContributorPage({ params }: ContributorPageProps) {
  // Await params before accessing properties
  const { contributorSlug } = await params;
  
  // Extract the GitHub ID from the slug
  const slugInfo = parseContributorSlug(contributorSlug);
  
  if (!slugInfo) {
    notFound();
  }
  
  // Fetch initial data server-side
  try {
    const seoData = await getContributorSEODataByGithubId(slugInfo.githubId);
    
    if (!seoData) {
      notFound();
    }
    
    // Convert the SEO data to the format expected by the client component
    const contributor = mapToContributorDetailData(seoData);
    
    // Pass the initial data to the client component
    return <ContributorContent contributor={contributor} />;
  } catch (error) {
    console.error('Error fetching contributor data:', error);
    throw error; // Let Next.js error boundary handle this
  }
} 