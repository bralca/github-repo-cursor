# Caching Strategy Documentation

## Overview

This document details the comprehensive caching strategy implemented for the GitHub Explorer application. The caching system is designed to significantly improve performance by reducing database load and API response times, particularly for expensive queries that power the homepage and contributor pages.

## Caching Architecture

### Server-Side In-Memory Cache

- **Implementation**: Uses `node-cache` library
- **Pattern**: Singleton cache instance shared across the application
- **Default TTL**: 1 hour (3600 seconds) for most cached data
- **Check Period**: 120 seconds (checks for expired keys every 2 minutes)
- **Max Keys**: 1000 (to prevent memory issues)
- **Use Clones**: Set to false for better performance
- **Utility Location**: `server/src/utils/cache.js`

### Key Utility Functions

- `cacheOrCompute(key, computeFn, ttl)`: Core function that implements the cache-or-compute pattern
- `generateCacheKey(prefix, params)`: Creates consistent cache keys based on prefix and parameters
- `invalidateCache(keyPattern)`: Invalidates specific cache entries
- `invalidateCacheByPrefix(prefix)`: Invalidates all cache entries with a specific prefix
- `clearCache()`: Completely clears the cache
- `getCacheStats()`: Returns statistics about the current cache state

### Cache Monitoring

The caching system includes basic monitoring functionality:

- Event listeners for cache operations (expired, deleted, flushed)
- Logging of cache hits, misses, and operation times
- Cache statistics tracking (hits, misses, key counts, memory usage)
- Optional cache monitor integration for more detailed analytics

## Cached Endpoints

| Endpoint | Controller | Cache Key Params | TTL | Description |
|----------|------------|-----------------|-----|-------------|
| `/api/entity-counts` | `entity-counts.js` | N/A | 3600s | Aggregate counts for dashboard metrics |
| `/api/contributor-rankings` | `contributor-rankings.js` | `timeframe` | 3600s | Ranked list of contributors |
| `/api/repositories` | `repositories.js` | `page`, `limit` | 3600s | Paginated repository list |
| `/api/merge-requests` | `merge-requests.js` | `page`, `limit`, `repositoryId`, `authorId`, `state` | 3600s | Filtered and paginated merge requests |
| `/api/contributors/:id` | `contributors.js` | `id` | 3600s | Contributor profile data |
| `/api/contributors/:id/activity` | `contributors.js` | `id` | 3600s | Contributor activity metrics |
| `/api/contributors/:id/repositories` | `contributors.js` | `id` | 3600s | Contributor repository contributions |
| `/api/contributors/:id/impact` | `contributors.js` | `id` | 3600s | Contributor impact metrics |

## GitHub API Caching

GitHub API calls are cached to reduce rate limit usage and improve response times when fetching external data:

- **Implementation**: Uses the same `node-cache` mechanism
- **Cache Key Pattern**: `github-api:${endpoint}`
- **TTL**: Typically 1 hour (3600 seconds)
- **Rate Limit Handling**: Cache invalidation is delayed when approaching rate limits

Examples of cached GitHub API requests:
- Repository data: `/repos/{owner}/{repo}`
- Commit details: `/repos/{owner}/{repo}/commits/{commit_sha}`
- User information: `/users/{username}`

This caching layer is critical since GitHub imposes strict rate limits (5000 requests/hour for authenticated requests). The logs show numerous GitHub API calls for commit fetching that benefit from this caching.

## Cache Key Strategy

Cache keys are generated using a consistent pattern to ensure proper cache hits and to facilitate targeted invalidation:

```javascript
generateCacheKey(prefix, params)
```

Where:
- `prefix`: String identifier for the endpoint (e.g., 'repositories', 'contributors')
- `params`: Object containing query parameters that affect the result

Example:
```javascript
const cacheKey = generateCacheKey('merge-requests', { 
  page, 
  limit, 
  repositoryId, 
  authorId, 
  state 
});
```

For object parameters, the function stringifies the object to create a consistent key:
```javascript
// Implementation from cache.js
export function generateCacheKey(prefix, params = '') {
  if (typeof params === 'object' && params !== null) {
    return `${prefix}:${JSON.stringify(params)}`;
  }
  
  return `${prefix}:${params}`;
}
```

## Cache Implementation Example

The standard pattern used across controllers:

```javascript
export async function getData(req, res) {
  try {
    // Generate cache key
    const cacheKey = generateCacheKey(CACHE_PREFIX, { 
      // Parameters that affect the result
      param1: req.query.param1,
      param2: req.query.param2
    });
    
    // Use cache-or-compute pattern
    const result = await cacheOrCompute(
      cacheKey,
      async () => {
        logger.info('Cache miss - fetching data from database');
        // Database query logic here
        return data;
      },
      TTL_VALUE
    );
    
    res.json(result);
  } catch (error) {
    logger.error('Error fetching data:', error);
    handleDbError(error, res);
  }
}
```

The `cacheOrCompute` function is the core of our caching strategy:

```javascript
// Simplified version of the implementation in cache.js
export async function cacheOrCompute(key, computeFn, ttl = DEFAULT_TTL) {
  // Try to get from cache first
  const cachedValue = getCacheValue(key);
  
  if (cachedValue !== undefined) {
    return cachedValue;
  }
  
  // Compute the value if not in cache
  const computedValue = await computeFn();
  
  // Store in cache
  setCacheValue(key, computedValue, ttl);
  
  return computedValue;
}
```

## Cache Invalidation Strategy

The cache invalidation strategy follows two approaches:

1. **Time-Based Invalidation**: All cached data has a TTL (Time To Live), typically 1 hour.
2. **Explicit Invalidation**: When data is modified through the application, relevant caches are explicitly invalidated.

Key invalidation points:

- **GitHub Data Sync**: When new data is fetched from GitHub, related caches are invalidated.
- **Pipeline Processing**: After data enrichment processes, affected entity caches are cleared.
- **Admin Operations**: When admins trigger data operations, related caches are cleared.

Example invalidation code:

```javascript
// Invalidate specific contributor
invalidateCache(`contributors:${contributorId}`);

// Invalidate all contributor rankings (using the prefix-based invalidation)
invalidateCacheByPrefix('contributor-rankings');

// Invalidate all repository data (using the prefix-based invalidation)
invalidateCacheByPrefix('repositories');

// Clear the entire cache (rarely used except for major data changes)
clearCache();
```

## Sitemap Generation Caching

The sitemap generation process, which processes thousands of URLs, is also cached:

- **Implementation**: File-based caching with regeneration on schedule
- **Default Schedule**: Daily regeneration via cron job
- **Location**: `/server/public/sitemaps/`
- **Files Generated**: 
  - `repositories.xml`: Contains all repository URLs
  - `contributors.xml`: Contains all contributor URLs
  - `merge_requests.xml`: Contains all merge request URLs
  - `commits.xml`: Contains all commit URLs
  - `sitemap.xml`: Index of all the above sitemaps

This caching approach prevents regenerating the sitemap on every request, which would be extremely resource-intensive given the large number of entities (over 35,000 URLs in total).

## Frontend Caching Strategy

In addition to the server-side caching, the frontend implements:

1. **Next.js Data Cache**: Built-in caching for server components with revalidation settings:
   ```javascript
   const data = await fetch('/api/endpoint', { next: { revalidate: 3600 } });
   ```

2. **Image Optimization**: 
   - Configured in `next.config.js` to use WebP format
   - 31-day minimum cache TTL (2678400 seconds)
   - Loading optimizations for better UX

3. **Middleware Caching**:
   - Custom middleware for setting proper cache headers
   - Especially targeting image routes with long-lived caches
   - Sets `Cache-Control` headers with `stale-while-revalidate` directives
   - Configured in `middleware.ts`

## Monitoring and Debugging

Caching includes comprehensive logging to help monitor performance and diagnose issues:

- **Cache Hit/Miss Logging**: Every cache operation logs whether it was a hit or miss
- **Performance Metrics**: Database query time is logged for cache misses
- **Cache Statistics**: Available via `getCacheStats()` function
- **Error Handling**: Failed cache operations are logged with detailed error information

Example monitoring data:
```javascript
// Cache statistics output
{
  keys: 42,        // Number of keys currently in cache
  hits: 1503,      // Number of cache hits
  misses: 198,     // Number of cache misses
  ksize: 4208,     // Size of keys in bytes
  vsize: 1542680   // Size of values in bytes
}
```

## Performance Impact

The implemented caching strategy significantly improves application performance:

- **Homepage**: First visit may be slow while cache populates, but subsequent visits load almost instantly
- **Database Load**: Reduced by ~50%+ for common queries
- **API Response Times**: Cache hits respond in milliseconds instead of seconds for complex queries
- **GitHub API Usage**: More efficient use of rate limits by caching responses

## Future Optimizations

Potential future optimizations to the caching system:

1. **Redis Integration**: Move from in-memory to Redis for distributed caching
2. **Cache Warming**: Proactive cache population during off-peak hours
3. **Tiered Caching**: Different TTLs for different types of data based on change frequency
4. **Cache Analytics**: More detailed statistics on cache performance
5. **Prefetching**: Intelligent prefetching of related data for common access patterns

## Maintenance Guidelines

When working with or modifying cached endpoints:

1. Always maintain the cache key generation pattern for consistency
2. Add appropriate cache invalidation calls when modifying data
3. Consider the implications of changing TTL values on data freshness
4. Monitor cache hit rates to identify opportunities for optimization
5. Add new cached endpoints to this documentation 