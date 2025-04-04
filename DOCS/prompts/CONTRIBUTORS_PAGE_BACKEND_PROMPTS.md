# Contributors Page Backend Implementation Prompts

This document contains detailed AI prompts for implementing the backend API endpoints needed for the Contributors Page. Each prompt is designed to help implement a specific task from the Contributors Page Backend Epic.

## Story 1: Contributor Profile API

### Task 1.1: Implement Contributor By ID Endpoint

```
I need to implement a backend API endpoint to fetch comprehensive contributor profile data by ID for the Contributors Page.

The endpoint should:
- Follow the pattern `/api/contributors/id/:id`
- Return all profile information (name, username, avatar, bio, etc.)
- Include activity metrics (commit counts, lines added/removed)
- Include top languages data
- Return organization affiliations if available
- Calculate years active based on first contribution

CRITICAL RULES:
1. We are building a production-ready MVP, all data must be real
2. Follow existing API patterns from API_REFERENCE.md
3. Handle errors properly and provide clear error messages
4. Keep implementation simple while accomplishing all requirements
5. Write deterministic code that gets the job done

Database context:
- Primary data is in the `contributors` table
- Activity metrics are in the `contributor_repository` table
- You may need to join with other tables for complete data

Please implement:
1. The controller method in server/src/controllers/api/contributors.js
2. Efficient database queries using our established patterns
3. Proper error handling for all scenarios (not found, server error)
4. Unit tests for the endpoint

When implementing, think step by step about what database queries are needed and how to structure the response to match our API conventions.
```

### Task 1.2: Implement Contributor By Username Endpoint

```
I need to implement a backend API endpoint to fetch comprehensive contributor profile data by username for the Contributors Page.

The endpoint should:
- Follow the pattern `/api/contributors/:username`
- Return the same data structure as the ID endpoint
- Properly handle the case where username doesn't exist
- Use the same logic as the ID endpoint but lookup by username first

CRITICAL RULES:
1. We are building a production-ready MVP, all data must be real
2. Follow existing API patterns from API_REFERENCE.md
3. Handle errors properly and provide clear error messages
4. Keep implementation simple while accomplishing all requirements
5. Write deterministic code that gets the job done

Implementation approach:
- Reuse query logic from the ID endpoint to avoid duplication
- Add username lookup logic to find the contributor ID
- Ensure proper indexes exist for username lookups
- Handle case sensitivity appropriately

Please implement:
1. The controller method in server/src/controllers/api/contributors.js
2. Username lookup query with proper indexing
3. Proper error handling for all scenarios
4. Unit tests for the endpoint

Think step by step about how to efficiently look up a contributor by username and then reuse the existing ID-based logic.
```

## Story 2: Contributor Activity Data API

### Task 2.1: Design Activity Data Structure

```
I need to design an optimized data structure for the contributor activity heatmap calendar visualization.

The data structure should:
- Support daily commit counts suitable for a calendar heatmap
- Include proper date formatting for frontend display
- Support different timeframe queries (year, 6 months, etc.)
- Be documented for frontend consumption
- Be efficient to generate from our database

CRITICAL RULES:
1. We are building a production-ready MVP, all data must be real
2. Keep the data structure as simple as possible while being complete
3. Optimize for frontend rendering performance
4. Consider the performance implications of large datasets

Expected output:
1. A JSON schema for the activity data structure
2. SQL query example to generate this data structure
3. Documentation for the frontend team
4. Performance considerations for large datasets

Think step by step about what data is needed for a calendar heatmap, how dates should be formatted, and how to efficiently query this from our commits table.
```

### Task 2.2: Implement Activity Data Endpoint

```
I need to implement a backend API endpoint to fetch a contributor's activity data for the calendar heatmap visualization.

The endpoint should:
- Follow the pattern `/api/contributors/:id/activity`
- Support timeframe parameter (default: 1 year, options: 6months, 3months, 1month)
- Return activity data in the designed format
- Handle empty data gracefully
- Be optimized for performance

CRITICAL RULES:
1. We are building a production-ready MVP, all data must be real
2. Follow existing API patterns from API_REFERENCE.md
3. Handle errors properly and provide clear error messages
4. Keep implementation simple while accomplishing all requirements
5. Write deterministic code that gets the job done

Database context:
- Commit data is in the `commits` table
- Each commit has a `committed_at` timestamp
- You'll need to group by date for daily counts

Please implement:
1. The controller method in server/src/controllers/api/contributors.js
2. Efficient date-based queries with proper grouping
3. Timeframe parameter handling
4. Proper error handling
5. Unit tests for the endpoint

Think step by step about how to efficiently query commit data by date and group it for the calendar visualization.
```

## Story 3: Contributor Repositories API

### Task 3.1: Implement Contributed Repositories Endpoint

```
I need to implement a backend API endpoint to fetch repositories a contributor has contributed to.

The endpoint should:
- Follow the pattern `/api/contributors/:id/repositories`
- Return repository data with contributor-specific metrics
- Support pagination and sorting options
- Include repository popularity metrics (stars, forks)
- Include contributor-specific stats (commits, lines added/removed)

CRITICAL RULES:
1. We are building a production-ready MVP, all data must be real
2. Follow existing API patterns from API_REFERENCE.md
3. Handle errors properly and provide clear error messages
4. Keep implementation simple while accomplishing all requirements
5. Write deterministic code that gets the job done

Database context:
- `contributor_repository` junction table links contributors to repositories
- `repositories` table contains the repository details
- You'll need to join these tables for complete data

Please implement:
1. The controller method in server/src/controllers/api/contributors.js
2. Efficient JOIN queries to get all required data
3. Pagination implementation following our standards
4. Sorting options (by stars, most recent contribution, etc.)
5. Proper error handling
6. Unit tests for the endpoint

Think step by step about how to structure the query to get all repository data with contributor-specific metrics efficiently.
```

## Story 4: Contributor Merge Requests API

### Task 4.1: Implement Merge Requests Endpoint

```
I need to implement a backend API endpoint to fetch a contributor's merge requests for the Contributors Page.

The endpoint should:
- Follow the pattern `/api/contributors/:id/merge-requests`
- Return merge request data with repository context
- Support filtering by state (open, closed, merged)
- Support pagination
- Include PR impact metrics (lines added/removed, files changed)
- Sort by most recent by default

CRITICAL RULES:
1. We are building a production-ready MVP, all data must be real
2. Follow existing API patterns from API_REFERENCE.md
3. Handle errors properly and provide clear error messages
4. Keep implementation simple while accomplishing all requirements
5. Write deterministic code that gets the job done

Database context:
- `merge_requests` table contains PR data
- `repositories` table provides repository context
- Filter by `author_id` to get contributor's PRs

Please implement:
1. The controller method in server/src/controllers/api/contributors.js
2. Efficient queries with proper JOINs
3. Filter parameter handling
4. Pagination implementation
5. Proper error handling
6. Unit tests for the endpoint

Think step by step about how to structure the query for efficient filtering and pagination of merge requests.
```

## Story 5: Contributor Recent Activity API

### Task 5.1: Implement Recent Activity Endpoint

```
I need to implement a backend API endpoint to fetch a contributor's recent activity for a timeline display.

The endpoint should:
- Follow the pattern `/api/contributors/:id/recent-activity`
- Return recent commits with timestamps and repository context
- Support pagination
- Format data for timeline visualization
- Order by date descending (most recent first)
- Include commit details (message, hash, etc.)

CRITICAL RULES:
1. We are building a production-ready MVP, all data must be real
2. Follow existing API patterns from API_REFERENCE.md
3. Handle errors properly and provide clear error messages
4. Keep implementation simple while accomplishing all requirements
5. Write deterministic code that gets the job done

Database context:
- `commits` table contains the activity data
- Join with `repositories` table for repository context
- Filter by `contributor_id`

Please implement:
1. The controller method in server/src/controllers/api/contributors.js
2. Efficient queries for recent activity
3. Pagination implementation
4. Proper error handling
5. Unit tests for the endpoint

Think step by step about how to efficiently query recent activity and structure it for a timeline display.
```

## Story 6: Contributor Rankings and Metrics API

### Task 6.1: Implement Contributor Rankings Endpoint

```
I need to implement a backend API endpoint to fetch a contributor's ranking and score metrics.

The endpoint should:
- Follow the pattern `/api/contributors/:id/rankings`
- Return ranking data including scores for all metrics
- Include percentile information if available
- Return all the score components (code_volume_score, code_efficiency_score, etc.)
- Include the global rank position

CRITICAL RULES:
1. We are building a production-ready MVP, all data must be real
2. Follow existing API patterns from API_REFERENCE.md
3. Handle errors properly and provide clear error messages
4. Keep implementation simple while accomplishing all requirements
5. Write deterministic code that gets the job done

Database context:
- `contributor_rankings` table contains the scoring data
- Query the most recent calculation timestamp
- Include all score components in the response

Please implement:
1. The controller method in server/src/controllers/api/contributors.js
2. Efficient query for ranking data
3. Proper error handling
4. Unit tests for the endpoint

Think step by step about how to retrieve the latest ranking data and structure it for the frontend.
```

## Story 7: Test and Optimize API Performance

### Task 7.1: Implement API Tests

```
I need to implement comprehensive tests for all the new Contributors Page API endpoints.

The tests should:
- Cover all endpoint functionality
- Test error cases and edge conditions
- Verify response formats
- Check pagination behavior
- Test performance for large datasets where relevant

CRITICAL RULES:
1. We are building a production-ready MVP, tests must be thorough
2. Use real test data, not mock data
3. Follow existing testing patterns in the codebase
4. Keep tests simple but comprehensive
5. Include performance assertions for critical endpoints

Please implement:
1. Unit tests for each new endpoint
2. Test cases for all major functionality
3. Error case tests
4. Timing assertions for performance-critical endpoints

Think step by step about what scenarios need to be tested for each endpoint and how to structure the tests efficiently.
```

### Task 7.2: Optimize Query Performance

```
I need to review and optimize the database queries used by the new Contributors Page API endpoints.

The optimization should:
- Ensure all queries complete within acceptable time limits
- Add indexes for frequently queried fields
- Analyze and optimize query plans
- Consider caching for expensive operations
- Document performance characteristics

CRITICAL RULES:
1. We are building a production-ready MVP, performance matters
2. Optimize for real-world data sizes and access patterns
3. Keep optimizations simple but effective
4. Document any performance trade-offs

Please implement:
1. Query analysis for each endpoint
2. Index additions where needed
3. Query refactoring for better performance
4. Caching strategy for expensive operations
5. Documentation of performance characteristics

Think step by step about how to analyze each query, identify bottlenecks, and implement appropriate optimizations.
```

### Task 7.3: Update API Documentation

```
I need to update the API documentation to include all new Contributors Page API endpoints.

The documentation updates should:
- Add entries for all new endpoints to API_REFERENCE.md
- Include request parameters and response formats
- Provide examples of typical usage
- Document any special behavior or edge cases
- Follow the existing documentation format

CRITICAL RULES:
1. We are building a production-ready MVP, documentation must be complete
2. Follow existing documentation patterns
3. Be thorough but concise
4. Include realistic examples

Please implement:
1. Documentation entries for each new endpoint
2. Request/response format descriptions
3. Example requests and responses
4. Notes on special behavior or requirements

Think step by step about what information developers would need to use these endpoints effectively.
``` 