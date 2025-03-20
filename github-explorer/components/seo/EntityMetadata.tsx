'use client';

import { Metadata } from 'next';

interface EntityMetadataProps {
  entityType: 'repository' | 'contributor' | 'mergeRequest' | 'commit';
  data: any;
}

/**
 * Generates metadata for different entity types
 * This is a mock implementation that doesn't rely on database access
 */
export function generateEntityMetadata({ entityType, data }: EntityMetadataProps) {
  // Base metadata object
  const baseMetadata = {
    title: 'GitHub Explorer',
    description: 'Explore GitHub repositories, contributors, merge requests, and commits',
    openGraph: {
      title: 'GitHub Explorer',
      description: 'Explore GitHub repositories, contributors, merge requests, and commits',
      type: 'website',
      url: 'https://github-explorer.example.com',
      images: [{
        url: 'https://github-explorer.example.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'GitHub Explorer'
      }]
    }
  };

  // Generate metadata based on entity type
  switch (entityType) {
    case 'repository':
      return {
        title: data?.name ? `${data.name} | GitHub Explorer` : 'Repository | GitHub Explorer',
        description: data?.description || 'Repository details',
        openGraph: {
          ...baseMetadata.openGraph,
          title: data?.name ? `${data.name} | GitHub Explorer` : 'Repository | GitHub Explorer',
          description: data?.description || 'Repository details',
          type: 'website',
          url: `https://github-explorer.example.com/${data?.name || 'repository'}`
        }
      };

    case 'contributor':
      return {
        title: data?.name ? `${data.name} | Contributor | GitHub Explorer` : 'Contributor | GitHub Explorer',
        description: data?.bio || 'Contributor profile and activity',
        openGraph: {
          ...baseMetadata.openGraph,
          title: data?.name ? `${data.name} | Contributor | GitHub Explorer` : 'Contributor | GitHub Explorer',
          description: data?.bio || 'Contributor profile and activity',
          type: 'profile',
          url: `https://github-explorer.example.com/contributors/${data?.username || 'contributor'}`
        }
      };

    case 'mergeRequest':
      return {
        title: data?.title ? `${data.title} | Merge Request | GitHub Explorer` : 'Merge Request | GitHub Explorer',
        description: data?.description || 'Merge request details and changes',
        openGraph: {
          ...baseMetadata.openGraph,
          title: data?.title ? `${data.title} | Merge Request | GitHub Explorer` : 'Merge Request | GitHub Explorer',
          description: data?.description || 'Merge request details and changes',
          type: 'article',
          url: `https://github-explorer.example.com/merge-requests/${data?.id || 'merge-request'}`
        }
      };

    case 'commit':
      return {
        title: data?.message ? `${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''} | Commit | GitHub Explorer` : 'Commit | GitHub Explorer',
        description: `Commit by ${data?.author_name || 'Unknown'}: ${data?.message?.substring(0, 100) || 'No message'}`,
        openGraph: {
          ...baseMetadata.openGraph,
          title: data?.message ? `${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''} | Commit | GitHub Explorer` : 'Commit | GitHub Explorer',
          description: `Commit by ${data?.author_name || 'Unknown'}: ${data?.message?.substring(0, 100) || 'No message'}`,
          type: 'article',
          url: `https://github-explorer.example.com/commits/${data?.sha || 'commit'}`
        }
      };

    default:
      return baseMetadata;
  }
} 