import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';
import { cacheOrCompute, generateCacheKey } from '../../utils/cache.js';
import { setupLogger } from '../../utils/logger.js';

// Setup component logger
const logger = setupLogger('entity-counts-controller');

// Cache prefix for entity counts
const CACHE_PREFIX = 'entity-counts';

// Default TTL for entity counts (1 hour)
const ENTITY_COUNTS_TTL = 3600; // seconds

/**
 * Get counts of all entity types
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getEntityCounts(req, res) {
  try {
    // Generate cache key based on any query parameters
    const cacheKey = generateCacheKey(CACHE_PREFIX, req.query);
    
    // Use cache-or-compute pattern
    const results = await cacheOrCompute(
      cacheKey,
      async () => {
        logger.info('Cache miss - fetching entity counts from database');
        return await fetchEntityCountsFromDb();
      },
      ENTITY_COUNTS_TTL
    );
    
    return res.json(results);
  } catch (error) {
    logger.error('Error getting entity counts:', { error });
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Helper function to fetch entity counts from database
 * @returns {Promise<object>} Entity counts
 */
async function fetchEntityCountsFromDb() {
  let db = null;
  try {
    db = await openSQLiteConnection();
    
    // Basic entity counts
    const repositories = await db.get('SELECT COUNT(*) as count FROM repositories');
    const contributors = await db.get('SELECT COUNT(*) as count FROM contributors');
    const mergeRequests = await db.get('SELECT COUNT(*) as count FROM merge_requests');
    const commits = await db.get('SELECT COUNT(*) as count FROM commits');
    
    // Card 1: Count of all items in the closed_merge_requests_raw table
    const closedMergeRequestsRaw = await db.get(`
      SELECT COUNT(*) as count FROM closed_merge_requests_raw
    `).catch(() => ({ count: 0 }));
    
    // Card 2: Count of all items in the closed_merge_requests_raw table where is_processed is false
    const unprocessedMergeRequests = await db.get(`
      SELECT COUNT(*) as count FROM closed_merge_requests_raw
      WHERE is_processed = 0 OR is_processed IS NULL
    `).catch(() => ({ count: 0 }));
    
    // Card 3: Count of all items in all entities tables where is_enriched = false
    const unenrichedRepositories = await db.get(`
      SELECT COUNT(*) as count FROM repositories 
      WHERE is_enriched = 0 OR is_enriched IS NULL
    `).catch(() => ({ count: 0 }));
    
    const unenrichedContributors = await db.get(`
      SELECT COUNT(*) as count FROM contributors 
      WHERE is_enriched = 0 OR is_enriched IS NULL
    `).catch(() => ({ count: 0 }));
    
    const unenrichedMergeRequests = await db.get(`
      SELECT COUNT(*) as count FROM merge_requests 
      WHERE is_enriched = 0 OR is_enriched IS NULL
    `).catch(() => ({ count: 0 }));
    
    // Calculate total unenriched entities
    const totalUnenriched = 
      unenrichedRepositories.count + 
      unenrichedContributors.count + 
      unenrichedMergeRequests.count;
    
    // Get enriched counts for context
    const enrichedRepositories = await db.get(`
      SELECT COUNT(*) as count FROM repositories 
      WHERE is_enriched = 1
    `).catch(() => ({ count: 0 }));
    
    const enrichedContributors = await db.get(`
      SELECT COUNT(*) as count FROM contributors 
      WHERE is_enriched = 1
    `).catch(() => ({ count: 0 }));
    
    const enrichedMergeRequests = await db.get(`
      SELECT COUNT(*) as count FROM merge_requests 
      WHERE is_enriched = 1
    `).catch(() => ({ count: 0 }));
    
    logger.debug('Database query results:', {
      repositories: repositories.count,
      contributors: contributors.count,
      mergeRequests: mergeRequests.count,
      commits: commits.count,
      closedMergeRequestsRaw: closedMergeRequestsRaw.count,
      unprocessedMergeRequests: unprocessedMergeRequests.count,
      totalUnenriched
    });
    
    return {
      // Basic counts
      repositories: repositories.count,
      contributors: contributors.count,
      mergeRequests: mergeRequests.count,
      commits: commits.count,
      
      // Enriched counts
      enrichedRepositories: enrichedRepositories.count,
      enrichedContributors: enrichedContributors.count,
      enrichedMergeRequests: enrichedMergeRequests.count,
      
      // Unenriched counts
      unenrichedRepositories: unenrichedRepositories.count,
      unenrichedContributors: unenrichedContributors.count,
      unenrichedMergeRequests: unenrichedMergeRequests.count,
      
      // Pipeline-specific counts for cards
      closedMergeRequestsRaw: closedMergeRequestsRaw.count,
      unprocessedMergeRequests: unprocessedMergeRequests.count,
      totalUnenriched: totalUnenriched
    };
  } catch (error) {
    logger.error('Error fetching entity counts from database:', { error });
    throw error;
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
} 