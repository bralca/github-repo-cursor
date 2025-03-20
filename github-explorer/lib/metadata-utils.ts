import { Metadata } from 'next';
import { Database } from '../types/database';
import * as urlUtils from './url-utils';

/**
 * Metadata generation utilities for SEO optimization
 * 
 * These functions generate standardized metadata for Next.js pages
 * including title, description, OpenGraph tags, and structured data.
 */

// Base interfaces for SEO data for each entity type
export interface RepositorySEOData {
  name: string;
  full_name?: string;
  description?: string;
  stars?: number;
  forks?: number;
  primary_language?: string;
  github_id: number | string;
  url?: string;
}

export interface ContributorSEOData {
  name?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  contributions?: number;
  repositories?: number;
  github_id: number | string;
}

export interface MergeRequestSEOData {
  title: string;
  description?: string;
  state?: string;
  repository_name?: string;
  repository_id?: number | string;
  author_name?: string;
  created_at?: string | Date;
  github_id: number | string;
}

export interface CommitSEOData {
  sha: string;
  message: string;
  author_name?: string;
  repository_name?: string;
  file_name?: string;
  committed_at?: string | Date;
  github_id: string;
}

// Default descriptions when entity data is incomplete
const DEFAULT_DESCRIPTIONS = {
  repository: 'GitHub repository details, statistics, contributors, and activity.',
  contributor: 'GitHub contributor profile, contributions, and activity.',
  mergeRequest: 'Merge request details, changes, and discussion.',
  commit: 'Commit details, changes, and related information.',
  notFound: 'The requested item could not be found.',
};

/**
 * Generate standardized page title
 * @param parts Array of title parts, will be joined with a separator
 * @returns Formatted page title
 */
export function generateTitle(parts: string[]): string {
  const validParts = parts.filter(Boolean);
  if (!validParts.length) return 'GitHub Explorer';
  
  return validParts.join(' | ') + ' | GitHub Explorer';
}

/**
 * Generate repository metadata for Next.js
 * @param data Repository SEO data
 * @returns Next.js metadata object
 */
export function generateRepositoryMetadata(data: RepositorySEOData | null): Metadata {
  if (!data) {
    return {
      title: 'Repository Not Found | GitHub Explorer',
      description: DEFAULT_DESCRIPTIONS.notFound,
    };
  }
  
  const title = generateTitle([data.name, data.full_name || '']);
  const description = data.description || 
    `${data.name} repository${data.stars ? ` with ${data.stars} stars` : ''}${data.primary_language ? ` written in ${data.primary_language}` : ''}. ${DEFAULT_DESCRIPTIONS.repository}`;
  
  // Generate canonical URL
  const slug = urlUtils.generateRepositorySlug(data.name, data.github_id.toString());
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}${urlUtils.buildRepositoryUrl({
    name: data.name,
    github_id: data.github_id.toString(),
    id: '' // Not used but required by the interface
  })}`;
  
  // Create metadata object
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    // Structured data for repositories
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        name: data.name,
        description: data.description,
        programmingLanguage: data.primary_language,
        codeRepository: data.url,
      }),
    },
  };
}

/**
 * Generate contributor metadata for Next.js
 * @param data Contributor SEO data
 * @returns Next.js metadata object
 */
export function generateContributorMetadata(data: ContributorSEOData | null): Metadata {
  if (!data) {
    return {
      title: 'Contributor Not Found | GitHub Explorer',
      description: DEFAULT_DESCRIPTIONS.notFound,
    };
  }
  
  const displayName = data.name || data.username || 'GitHub Contributor';
  const title = generateTitle([displayName, 'GitHub Contributor']);
  const description = data.bio || 
    `${displayName}${data.repositories ? ` with contributions to ${data.repositories} repositories` : ''}. ${DEFAULT_DESCRIPTIONS.contributor}`;
  
  // Generate canonical URL
  const slug = urlUtils.generateContributorSlug(data.name, data.username, data.github_id.toString());
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}${urlUtils.buildContributorUrl({
    name: data.name,
    username: data.username,
    github_id: data.github_id.toString(),
    id: '' // Not used but required by the interface
  })}`;
  
  // Create metadata object
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: canonicalUrl,
      images: data.avatar ? [{ url: data.avatar, alt: displayName }] : undefined,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    // Structured data for contributors
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: displayName,
        description: data.bio,
        image: data.avatar,
      }),
    },
  };
}

/**
 * Generate merge request metadata for Next.js
 * @param data Merge request SEO data
 * @param repository Repository SEO data
 * @returns Next.js metadata object
 */
export function generateMergeRequestMetadata(data: MergeRequestSEOData | null, repository?: RepositorySEOData): Metadata {
  if (!data) {
    return {
      title: 'Merge Request Not Found | GitHub Explorer',
      description: DEFAULT_DESCRIPTIONS.notFound,
    };
  }
  
  const repoName = repository?.name || data.repository_name || 'Repository';
  const title = generateTitle([data.title, `PR #${data.github_id}`, repoName]);
  const description = data.description || 
    `${data.title} - Pull request #${data.github_id} in ${repoName}${data.author_name ? ` by ${data.author_name}` : ''}. ${DEFAULT_DESCRIPTIONS.mergeRequest}`;
  
  // We need both repository and merge request data for the canonical URL
  let canonicalUrl = '';
  if (repository) {
    canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}${urlUtils.buildMergeRequestUrl(
      {
        name: repository.name,
        github_id: repository.github_id.toString(),
        id: '' // Not used but required by the interface
      },
      {
        title: data.title,
        github_id: data.github_id.toString(),
        repository_id: '',
        repository_github_id: '',
        id: '' // Not used but required by the interface
      }
    )}`;
  }
  
  // Create metadata object
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalUrl || undefined,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: canonicalUrl || undefined,
    },
    // Structured data for merge requests
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: data.title,
        description: data.description,
        creator: data.author_name,
        dateCreated: data.created_at,
      }),
    },
  };
}

/**
 * Generate commit metadata for Next.js
 * @param data Commit SEO data
 * @param repository Repository SEO data
 * @returns Next.js metadata object
 */
export function generateCommitMetadata(data: CommitSEOData | null, repository?: RepositorySEOData): Metadata {
  if (!data) {
    return {
      title: 'Commit Not Found | GitHub Explorer',
      description: DEFAULT_DESCRIPTIONS.notFound,
    };
  }
  
  const shortSha = data.sha.substring(0, 7);
  const repoName = repository?.name || data.repository_name || 'Repository';
  const title = generateTitle([shortSha, data.message.split('\n')[0], repoName]);
  
  const description = 
    `Commit ${shortSha}${data.file_name ? ` affecting ${data.file_name}` : ''}${data.author_name ? ` by ${data.author_name}` : ''}. ${data.message.split('\n')[0]}`;
  
  // Create metadata object - canonical URL would need the full route information which we don't have here
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    // Structured data for commits
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: data.message.split('\n')[0],
        identifier: data.sha,
        creator: data.author_name,
        dateCreated: data.committed_at,
      }),
    },
  };
}

/**
 * Generate not found metadata for any entity type
 * @param entityType Type of entity that was not found
 * @returns Next.js metadata object
 */
export function generateNotFoundMetadata(entityType: 'repository' | 'contributor' | 'mergeRequest' | 'commit'): Metadata {
  const entityNames = {
    repository: 'Repository',
    contributor: 'Contributor',
    mergeRequest: 'Merge Request',
    commit: 'Commit',
  };
  
  const title = `${entityNames[entityType]} Not Found | GitHub Explorer`;
  
  return {
    title,
    description: DEFAULT_DESCRIPTIONS.notFound,
    robots: {
      index: false,
      follow: false,
    },
  };
} 