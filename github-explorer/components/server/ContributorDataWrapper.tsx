import { getContributorBySlug, getContributorSEODataBySlug } from '@/lib/database/contributors';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';

interface ContributorDataWrapperProps {
  contributorSlug: string;
  children: (data: Awaited<ReturnType<typeof getContributorBySlug>>) => ReactNode;
  showNotFound?: boolean;
}

/**
 * Server Component for fetching contributor data
 * 
 * This wrapper component fetches contributor data and passes it to its children.
 * If the contributor is not found, it renders a not found error or returns null.
 */
export async function ContributorDataWrapper({
  contributorSlug,
  children,
  showNotFound = true,
}: ContributorDataWrapperProps) {
  const contributor = await getContributorBySlug(contributorSlug);
  
  if (!contributor) {
    if (showNotFound) {
      notFound();
    }
    return null;
  }
  
  return <>{children(contributor)}</>;
}

interface ContributorSEODataWrapperProps {
  contributorSlug: string;
  children: (data: Awaited<ReturnType<typeof getContributorSEODataBySlug>>) => ReactNode;
  showNotFound?: boolean;
}

/**
 * Server Component for fetching contributor SEO data
 * 
 * This wrapper fetches only the SEO-relevant data for the contributor,
 * which is more lightweight than the full contributor data.
 */
export async function ContributorSEODataWrapper({
  contributorSlug,
  children,
  showNotFound = true,
}: ContributorSEODataWrapperProps) {
  const seoData = await getContributorSEODataBySlug(contributorSlug);
  
  if (!seoData) {
    if (showNotFound) {
      notFound();
    }
    return null;
  }
  
  return <>{children(seoData)}</>;
} 