import { withDb } from '@/lib/database/connection';

// Entity types that have sitemaps
export type EntityType = 'repositories' | 'contributors' | 'merge-requests' | 'commits';

// Maximum URLs per sitemap (Google limit is 50,000)
const MAX_URLS_PER_SITEMAP = 49000;

/**
 * Updates the sitemap metadata when a new entity is added
 * 
 * This function:
 * 1. Increments the URL count for the entity type
 * 2. Creates a new sitemap page if the current one is full
 * 3. Updates the last_updated timestamp
 * 
 * @param entityType The type of entity being added
 * @returns The current page number for this entity type
 */
export async function updateSitemapMetadata(entityType: EntityType): Promise<number> {
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
    
    // Get the current metadata for this entity type
    const metadata = await db.get(`
      SELECT current_page, url_count FROM sitemap_metadata 
      WHERE entity_type = ?
    `, [entityType]);
    
    let currentPage = 1;
    let urlCount = 1;
    
    if (metadata) {
      currentPage = metadata.current_page;
      urlCount = metadata.url_count + 1;
      
      // Check if we need to create a new sitemap page
      if (urlCount > MAX_URLS_PER_SITEMAP) {
        currentPage += 1;
        urlCount = 1;
      }
      
      // Update the metadata
      await db.run(`
        UPDATE sitemap_metadata 
        SET current_page = ?, url_count = ?, last_updated = CURRENT_TIMESTAMP
        WHERE entity_type = ?
      `, [currentPage, urlCount, entityType]);
    } else {
      // Insert new metadata
      await db.run(`
        INSERT INTO sitemap_metadata (entity_type, current_page, url_count, last_updated)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, [entityType, currentPage, urlCount]);
    }
    
    return currentPage;
  });
}

/**
 * Gets the current metadata for an entity type
 * 
 * @param entityType The type of entity
 * @returns Object with current_page and url_count
 */
export async function getSitemapMetadata(entityType: EntityType): Promise<{ 
  current_page: number; 
  url_count: number;
  last_updated: string;
} | null> {
  return withDb(async (db) => {
    // Check if sitemap_metadata table exists
    const tableExists = await db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='sitemap_metadata'
    `);
    
    if (!tableExists) {
      return null;
    }
    
    // Get the metadata
    const metadata = await db.get(`
      SELECT current_page, url_count, last_updated FROM sitemap_metadata 
      WHERE entity_type = ?
    `, [entityType]);
    
    return metadata || null;
  });
}

/**
 * Resets the sitemap metadata for an entity type
 * Useful when regenerating sitemaps from scratch
 * 
 * @param entityType The type of entity
 */
export async function resetSitemapMetadata(entityType: EntityType): Promise<void> {
  return withDb(async (db) => {
    // Check if sitemap_metadata table exists
    const tableExists = await db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='sitemap_metadata'
    `);
    
    if (!tableExists) {
      return;
    }
    
    // Reset the metadata
    await db.run(`
      UPDATE sitemap_metadata 
      SET current_page = 1, url_count = 0, last_updated = CURRENT_TIMESTAMP
      WHERE entity_type = ?
    `, [entityType]);
  });
} 