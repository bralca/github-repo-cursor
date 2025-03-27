import { MetadataRoute } from 'next';
import { fetchFromServerApi } from '@/lib/server-api/server-fetch';
import { buildRepositoryUrl } from '@/lib/url-utils';

interface RepositoryEntry {
  id: string;
  github_id: string;
  name: string;
  updated_at: string;
}

// just some comments
/**
 * API query to get all repositories for sitemap
 * Limits to 49,000 items per sitemap (under Google's 50K limit)
 */
async function getRepositoriesForSitemap(page = 1, limit = 49000): Promise<RepositoryEntry[]> {
  try {
    const data = await fetchFromServerApi<RepositoryEntry[]>('repositories/sitemap', 'GET', {
      page: page.toString(),
      limit: limit.toString()
    });
    return data || [];
  } catch (error) {
    console.error('Error fetching repositories for sitemap:', error);
    return [];
  }
}

/**
 * Get the current page number for a specific entity sitemap
 */
async function getCurrentSitemapPage(entityType: string): Promise<number> {
  try {
    const data = await fetchFromServerApi<{ current_page: number }>('sitemap/metadata', 'GET', {
      entity_type: entityType
    });
    return data?.current_page || 1;
  } catch (error) {
    console.error(`Error fetching sitemap page for ${entityType}:`, error);
    return 1;
  }
}

/**
 * Generates a sitemap for repositories with pagination
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get current page number from sitemap metadata or default to page 1
  const page = await getCurrentSitemapPage('repositories');
  
  // Get repositories for current page
  const repositories = await getRepositoriesForSitemap(page);
  
  // Base URL for the application
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://github-explorer.example.com';
  
  // Generate sitemap entries for each repository
  return repositories.map((repo) => {
    // Format the URL using our SEO-friendly structure
    const url = `${baseUrl}${buildRepositoryUrl({ 
      id: repo.id, 
      github_id: repo.github_id, 
      name: repo.name 
    })}`;
    
    // Use the repository's updated_at date for lastModified
    const lastModified = repo.updated_at ? new Date(repo.updated_at).toISOString() : new Date().toISOString();
    
    return {
      url,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    };
  });
} 