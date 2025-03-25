import { getRepositoryBySlug, getRepositorySEODataBySlug } from '@/lib/server-api/repositories';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';

interface RepositoryDataWrapperProps {
  repositorySlug: string;
  children: (data: Awaited<ReturnType<typeof getRepositoryBySlug>>) => ReactNode;
  showNotFound?: boolean;
}

/**
 * Server Component for fetching repository data
 * 
 * This wrapper component fetches repository data and passes it to its children.
 * If the repository is not found, it renders a not found error or returns null.
 */
export async function RepositoryDataWrapper({
  repositorySlug,
  children,
  showNotFound = true,
}: RepositoryDataWrapperProps) {
  const repository = await getRepositoryBySlug(repositorySlug);
  
  if (!repository) {
    if (showNotFound) {
      notFound();
    }
    return null;
  }
  
  return <>{children(repository)}</>;
}

interface RepositorySEODataWrapperProps {
  repositorySlug: string;
  children: (data: Awaited<ReturnType<typeof getRepositorySEODataBySlug>>) => ReactNode;
  showNotFound?: boolean;
}

/**
 * Server Component for fetching repository SEO data
 * 
 * This wrapper fetches only the SEO-relevant data for the repository,
 * which is more lightweight than the full repository data.
 */
export async function RepositorySEODataWrapper({
  repositorySlug,
  children,
  showNotFound = true,
}: RepositorySEODataWrapperProps) {
  const seoData = await getRepositorySEODataBySlug(repositorySlug);
  
  if (!seoData) {
    if (showNotFound) {
      notFound();
    }
    return null;
  }
  
  return <>{children(seoData)}</>;
} 