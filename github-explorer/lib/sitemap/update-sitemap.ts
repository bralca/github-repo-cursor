// This file is no longer needed as we've moved sitemap generation
// to the backend server. This stub is kept for reference only.

// Entity types that have sitemaps
export type EntityType = 'repositories' | 'contributors' | 'merge_requests';

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
  console.warn(`updateSitemapMetadata called for ${entityType}, but this is now handled by the backend`);
  return 0;
}

/**
 * Gets the current metadata for an entity type
 * 
 * @param entityType The type of entity
 * @returns Object with current_page and url_count
 */
export async function getSitemapMetadata(entityType: EntityType): Promise<{
  currentPage: number;
  urlCount: number;
  lastUpdated: string | null;
}> {
  console.warn(`getSitemapMetadata called for ${entityType}, but this is now handled by the backend`);
  return {
    currentPage: 0,
    urlCount: 0,
    lastUpdated: null
  };
}

/**
 * Resets the sitemap metadata for an entity type
 * Useful when regenerating sitemaps from scratch
 * 
 * @param entityType The type of entity
 */
export async function resetSitemapMetadata(entityType: EntityType): Promise<void> {
  console.warn(`resetSitemapMetadata called for ${entityType}, but this is now handled by the backend`);
} 