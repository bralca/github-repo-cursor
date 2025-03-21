import { MetadataRoute } from 'next';
import { withDb } from '@/lib/database/connection';
import { buildRepositoryUrl } from '@/lib/url-utils';

interface RepositoryEntry {
  id: string;
  github_id: string;
  name: string;
  updated_at: string;
}

/**
 * Database query to get all repositories with pagination
 * Limits to 49,000 items per sitemap (under Google's 50K limit)
 */
async function getRepositoriesForSitemap(page = 1, limit = 49000): Promise<RepositoryEntry[]> {
  return withDb(async (db) => {
    const offset = (page - 1) * limit;
    
    const repositories = await db.all(`
      SELECT id, github_id, name, updated_at
      FROM repositories
      ORDER BY updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
    
    return repositories;
  });
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://github-explorer.example.com';
  
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
      changeFrequency: 'weekly',
      priority: 0.8,
    };
  }) as MetadataRoute.Sitemap;
}

/**
 * Get the current page number for a specific entity sitemap
 */
async function getCurrentSitemapPage(entityType: string): Promise<number> {
  return withDb(async (db) => {
    // Check if sitemap_metadata table exists
    const tableExists = await db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='sitemap_metadata'
    `);
    
    // Create the table if it doesn't exist
    if (!tableExists) {
      await db.run(`
        CREATE TABLE sitemap_metadata (
          entity_type TEXT PRIMARY KEY,
          current_page INTEGER NOT NULL DEFAULT 1,
          url_count INTEGER NOT NULL DEFAULT 0,
          last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Get the current page for this entity type
    const metadata = await db.get(`
      SELECT current_page FROM sitemap_metadata 
      WHERE entity_type = ?
    `, [entityType]);
    
    // If no record exists, create it and return page 1
    if (!metadata) {
      await db.run(`
        INSERT INTO sitemap_metadata (entity_type, current_page, url_count)
        VALUES (?, 1, 0)
      `, [entityType]);
      
      return 1;
    }
    
    return metadata.current_page;
  });
} 