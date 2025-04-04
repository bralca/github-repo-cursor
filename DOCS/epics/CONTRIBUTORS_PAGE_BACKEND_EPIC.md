# Epic: Contributors Page Backend Implementation

## Overview

This epic covers the backend implementation required to support the Contributors Page. Based on the design and architecture requirements, we need to build several API endpoints to provide the necessary data for the frontend components.

## Acceptance Criteria

1. All required API endpoints are implemented and follow established patterns
2. Endpoints return real data from the database (no mock data)
3. Performance is optimized for the data size
4. All endpoints include proper error handling
5. Documentation is updated to reflect new endpoints
6. Tests are implemented for all endpoints

## Stories

### Story 1: Contributor Profile API

Implement endpoints to fetch comprehensive contributor profile data.

#### Task 1.1: Implement Contributor By ID Endpoint

**Description:**  
Create an API endpoint to fetch a contributor's complete profile data by ID.

**Acceptance Criteria:**
- Endpoint follows the pattern `/api/contributors/id/:id`
- Returns all profile information (name, username, avatar, bio, etc.)
- Includes activity metrics (commit counts, lines added/removed)
- Includes top languages data

**Implementation Notes:**
- Use the `contributors` table as the primary data source
- Join with `contributor_repository` table for activity metrics
- Format the response according to established API patterns

**Implementation Prompt:**
```
Review the existing implementation of getContributorById in contributors.js to ensure it meets all requirements.
If necessary, enhance the implementation to include:
1. Complete profile information from the contributors table
2. Activity metrics (commits, merge requests) through proper joins
3. Repository associations through the contributor_repository table
4. Proper error handling following established patterns

Follow established patterns for database queries, result formatting, and error responses.
Verify the API route is properly defined in api-routes.js.
```

#### Task 1.2: Implement Contributor By Username Endpoint

**Description:**  
Create an API endpoint to fetch a contributor's complete profile data by username.

**Acceptance Criteria:**
- Endpoint follows the pattern `/api/contributors/:username`
- Returns the same data structure as the ID endpoint
- Properly handles case where username doesn't exist

**Implementation Notes:**
- Reuse query logic from the ID endpoint
- Add username lookup logic
- Ensure proper indexing for username lookups

**Implementation Prompt:**
```
Review the existing implementation of getContributorByLogin in contributors.js to ensure it meets all requirements.
If necessary, enhance the implementation to:
1. Handle both numeric GitHub IDs and text usernames in the same endpoint
2. Use the same data structure as the ID endpoint for consistency
3. Include proper error responses for non-existent usernames
4. Log lookup operations for debugging purposes

Follow established patterns for parameter validation, error handling, and response formatting.
Verify the API route is properly defined in api-routes.js.
```

### Story 2: Contributor Activity Data API

Implement endpoints to provide activity data for the heatmap visualization.

#### Task 2.1: Design Activity Data Structure

**Description:**  
Design an optimized data structure for the activity heatmap calendar visualization.

**Acceptance Criteria:**
- Data structure supports daily commit counts
- Includes date formatting suitable for calendar display
- Supports different timeframe queries (year, 6 months, etc.)
- Structure is documented for frontend consumption

**Implementation Notes:**
- Review existing calendar visualizations in the codebase
- Consider performance for large datasets
- Document the structure in API_REFERENCE.md

**Implementation Prompt:**
```
Design a JSON structure for contributor activity data that will power the heatmap visualization, following these guidelines:
1. Structure should group commits by date for easy rendering in a calendar view
2. Each date entry should include the formatted date (ISO) and activity count
3. The structure should support filtering by different timeframes (30 days to all-time)
4. Format the response to be consistent with other API endpoints

Create a detailed specification that includes:
- Sample JSON response format
- Field descriptions and data types
- Query parameter options for timeframes
- Performance considerations for large datasets

Add this documentation to API_REFERENCE.md following the established format.
```

#### Task 2.2: Implement Activity Data Endpoint

**Description:**  
Create an API endpoint to fetch a contributor's activity data.

**Acceptance Criteria:**
- Endpoint follows the pattern `/api/contributors/:id/activity`
- Supports timeframe parameter (default: 1 year)
- Returns activity data in the designed format
- Handles empty data gracefully

**Implementation Notes:**
- Query the `commits` table with date-based filters
- Group by date for the heatmap format
- Optimize query performance with proper indexing

**Implementation Prompt:**
```
Implement a new getContributorActivity function in the contributors.js controller that:
1. Accepts a contributor ID and timeframe parameter
2. Queries the commits table to get commit counts grouped by date
3. Supports filtering by timeframe (30days, 90days, 6months, 1year, all) with 1year as default
4. Returns data in the format designed in Task 2.1
5. Handles edge cases like no data found or invalid parameters

The implementation should:
- Follow established database query patterns
- Include proper error handling
- Be optimized for performance with appropriate indexing
- Return real data (no mocks)

Update api-routes.js to add the new endpoint route: GET /api/contributors/:id/activity
```

#### Task 2.3: Implement Code Impact Metrics Endpoint

**Description:**  
Create an API endpoint to provide code impact metrics for visualization.

**Acceptance Criteria:**
- Endpoint follows the pattern `/api/contributors/:id/impact`
- Returns metrics for lines added, removed, and total
- Includes percentage calculations for visualization
- Handles empty data gracefully

**Implementation Notes:**
- Query the `commits` table for code change statistics
- Calculate percentages for additions vs deletions
- Optimize query performance with proper indexing

**Implementation Prompt:**
```
Implement a new getContributorImpact function in the contributors.js controller that:
1. Accepts a contributor ID as a parameter
2. Queries the commits table to calculate:
   - Total lines added
   - Total lines removed
   - Combined total lines modified
   - Percentage ratio of additions vs deletions
3. Returns formatted data with all metrics needed for visualization:
   {
     "added": 8423,
     "removed": 3127,
     "total": 11550,
     "ratio": {
       "additions": 73,
       "deletions": 27
     }
   }
4. Handles edge cases like no data found or invalid parameters
5. Includes proper error handling following established patterns

The implementation should be optimized for performance with appropriate indexing and caching.

Update api-routes.js to add the new endpoint route: GET /api/contributors/:id/impact
```

### Story 3: Contributor Repositories API

Implement endpoints to fetch repositories a contributor has worked on.

#### Task 3.1: Implement Contributed Repositories Endpoint

**Description:**  
Create an API endpoint to fetch repositories a contributor has contributed to.

**Acceptance Criteria:**
- Endpoint follows the pattern `/api/contributors/:id/repositories`
- Returns repository data with contributor-specific metrics
- Supports pagination and sorting
- Includes repository popularity metrics

**Implementation Notes:**
- Join `contributor_repository` with `repositories` table
- Include contributor-specific stats (commits, lines added/removed)
- Implement standard pagination parameters

**Implementation Prompt:**
```
Implement a new getContributorRepositories function in the contributors.js controller that:
1. Accepts a contributor ID as a parameter
2. Fetches repositories the contributor has worked on
3. Includes contributor-specific metrics (commit count, lines added/removed)
4. Supports standard pagination parameters (limit/offset or page/limit)
5. Supports sorting by different fields (stars, commit_count, etc.)

The implementation should:
- Query the contributor_repository junction table joined with repositories
- Calculate contributor-specific metrics for each repository
- Format the response consistently with other API endpoints
- Include proper pagination metadata in the response
- Follow established error handling patterns

Update api-routes.js to add the new endpoint route: GET /api/contributors/:id/repositories
```

### Story 4: Contributor Merge Requests API

Implement endpoints to fetch a contributor's merge request history.

#### Task 4.1: Implement Merge Requests Endpoint

**Description:**  
Create an API endpoint to fetch a contributor's merge requests.

**Acceptance Criteria:**
- Endpoint follows the pattern `/api/contributors/:id/merge-requests`
- Returns merge request data with repository context
- Supports filtering by state (open, closed, merged)
- Supports pagination
- Includes PR impact metrics

**Implementation Notes:**
- Query `merge_requests` table filtered by contributor
- Include repository data for context
- Use standard pagination and filtering patterns

**Implementation Prompt:**
```
Implement a new getContributorMergeRequests function in the contributors.js controller that:
1. Accepts a contributor ID as a parameter
2. Fetches merge requests authored by the contributor
3. Includes repository context information for each merge request
4. Supports filtering by state (open, closed, merged)
5. Includes standard pagination (limit/offset or page/limit)
6. Calculates and includes PR impact metrics (lines changed, files modified)

The implementation should:
- Query the merge_requests table joined with repositories
- Handle filter parameters consistently with other endpoints
- Format the response according to established patterns
- Include proper error handling
- Be optimized for performance

Update api-routes.js to add the new endpoint route: GET /api/contributors/:id/merge-requests
```

### Story 5: Contributor Recent Activity API

Implement endpoints to fetch a contributor's recent activity timeline.

#### Task 5.1: Implement Recent Activity Endpoint

**Description:**  
Create an API endpoint to fetch a contributor's recent activity for a timeline display.

**Acceptance Criteria:**
- Endpoint follows the pattern `/api/contributors/:id/recent-activity`
- Returns recent commits with timestamps and repository context
- Supports pagination
- Data is formatted for timeline visualization

**Implementation Notes:**
- Query `commits` table for recent entries
- Include repository data for context
- Limit results to reasonable timeframe
- Order by date descending

**Implementation Prompt:**
```
Implement a new getContributorRecentActivity function in the contributors.js controller that:
1. Accepts a contributor ID as a parameter
2. Fetches recent commit activity for the timeline visualization
3. Includes repository context for each activity item
4. Supports standard pagination parameters
5. Orders results by date (most recent first)

The implementation should:
- Query the commits table for recent entries by the contributor
- Join with repositories table to include repository context
- Format the response specifically for timeline visualization
- Handle edge cases like no recent activity
- Follow established patterns for error handling and response formatting

Update api-routes.js to add the new endpoint route: GET /api/contributors/:id/recent-activity
```

### Story 6: Contributor Rankings and Metrics API

Implement endpoints to fetch a contributor's ranking and calculated metrics.

#### Task 6.1: Implement Contributor Rankings Endpoint

**Description:**  
Create an API endpoint to fetch a contributor's ranking and score metrics.

**Acceptance Criteria:**
- Endpoint follows the pattern `/api/contributors/:id/rankings`
- Returns ranking data including scores for all metrics
- Includes percentile information if available

**Implementation Notes:**
- Query `contributor_rankings` table
- Include all score components (code_volume_score, etc.)
- Join with other tables if additional context is needed

**Implementation Prompt:**
```
Implement a new getContributorRankings function in the contributors.js controller that:
1. Accepts a contributor ID as a parameter
2. Fetches the contributor's ranking data from the contributor_rankings table
3. Includes all score components (code_volume_score, code_efficiency_score, etc.)
4. Calculates percentile information relative to other contributors
5. Returns a comprehensive metrics profile

The implementation should:
- Query the contributor_rankings table for the specific contributor
- Format the response to highlight key metrics
- Calculate relative ranking information if not already stored
- Handle the case where a contributor has no ranking data
- Follow established patterns for error handling and response formatting

Update api-routes.js to add the new endpoint route: GET /api/contributors/:id/rankings
```

### Story 7: Contributor Profile Metadata API

Implement endpoints to fetch a contributor's profile metadata for display in the UI.

#### Task 7.1: Implement Profile Metadata Endpoint

**Description:**  
Create an API endpoint to provide developer profile metadata.

**Acceptance Criteria:**
- Endpoint follows the pattern `/api/contributors/:id/profile-metadata`
- Returns active time period calculation
- Includes organizations the contributor belongs to
- Returns top programming languages used
- Handles empty data gracefully

**Implementation Notes:**
- Calculate active time period from first and last contributions
- Analyze commit data to determine top languages
- Query organization membership data if available

**Implementation Prompt:**
```
Implement a new getContributorProfileMetadata function in the contributors.js controller that:
1. Accepts a contributor ID as a parameter
2. Calculates active time period based on first and last contribution dates
3. Queries for organizations the contributor belongs to
4. Analyzes commit data to determine top programming languages
5. Returns formatted data with:
   {
     "active_period": {
       "duration": "almost 3 years",
       "first_contribution": "2021-04-15T00:00:00Z",
       "last_contribution": "2024-03-28T00:00:00Z"
     },
     "organizations": [
       { "name": "Microsoft", "id": "123" },
       { "name": "Google", "id": "456" },
       { "name": "Meta", "id": "789" }
     ],
     "top_languages": [
       { "name": "TypeScript", "percentage": 45 },
       { "name": "JavaScript", "percentage": 30 },
       { "name": "Python", "percentage": 15 },
       { "name": "Go", "percentage": 10 }
     ]
   }
6. Handles edge cases like no data or invalid parameters

The implementation should follow established patterns for error handling and response formatting.

Update api-routes.js to add the new endpoint route: GET /api/contributors/:id/profile-metadata
```

### Story 8: Test and Optimize API Performance

Ensure the API endpoints are thoroughly tested and optimized for performance.

#### Task 8.1: Implement API Tests

**Description:**  
Create comprehensive tests for all new API endpoints.

**Acceptance Criteria:**
- Unit tests for each endpoint
- Tests for error cases and edge conditions
- Performance tests for queries on large datasets

**Implementation Notes:**
- Follow established testing patterns
- Use realistic test data
- Include timing assertions for performance-critical endpoints

**Implementation Prompt:**
```
Create comprehensive tests for all the new contributor API endpoints:
1. Write unit tests for each endpoint function (getContributorActivity, getContributorRepositories, etc.)
2. Include tests for successful responses and error conditions
3. Test edge cases like empty results, invalid parameters, etc.
4. Create performance tests for endpoints that process large datasets

The tests should:
- Follow the existing testing patterns in the codebase
- Use test database fixtures with realistic data
- Validate response structure and content
- Verify correct error handling
- Include timing assertions for performance-critical endpoints

Create test files in the appropriate test directory following the established naming convention.
```

#### Task 8.2: Optimize Query Performance

**Description:**  
Review and optimize the database queries used by the new endpoints.

**Acceptance Criteria:**
- All queries complete within acceptable time limits
- Indexes are created for frequently queried fields
- Query plans are analyzed and optimized

**Implementation Notes:**
- Use database tools to analyze query plans
- Add indexes where appropriate
- Consider query caching for expensive operations

**Implementation Prompt:**
```
Review and optimize the database queries used by all contributor endpoints:
1. Analyze query execution plans using database tools
2. Identify slow or inefficient queries
3. Create appropriate indexes for frequently queried fields
4. Refactor queries to improve performance
5. Consider caching strategies for expensive operations

The optimization should:
- Focus on endpoints that handle large datasets or complex joins
- Measure performance before and after optimization
- Ensure optimizations don't break existing functionality
- Document any new indexes created
- Follow established database access patterns

Create a migration script if new indexes are needed.
```

#### Task 8.3: Update API Documentation

**Description:**  
Update API documentation to include the new endpoints.

**Acceptance Criteria:**
- API_REFERENCE.md is updated with all new endpoints
- Documentation includes request/response formats
- Examples are provided for common use cases

**Implementation Notes:**
- Follow existing documentation format
- Include comprehensive examples
- Document any special parameters or behaviors

**Implementation Prompt:**
```
Update the API_REFERENCE.md document to include all new contributor endpoints:
1. Add detailed documentation for each new endpoint:
   - /api/contributors/:id/activity
   - /api/contributors/:id/impact
   - /api/contributors/:id/repositories
   - /api/contributors/:id/merge-requests
   - /api/contributors/:id/recent-activity
   - /api/contributors/:id/rankings
   - /api/contributors/:id/profile-metadata
2. Include complete request parameter descriptions
3. Document response formats with JSON examples
4. Add examples for common use cases and parameter combinations
5. Note any performance considerations or limitations

The documentation should:
- Follow the existing format and style in API_REFERENCE.md
- Be comprehensive enough for frontend developers to use without questions
- Include clear examples of how to call each endpoint
- Document all query parameters and their effect
- Note any error responses specific to these endpoints

Ensure all new endpoints are properly documented in the API reference.
```

## Implementation Dependencies

- Existing database schema must support all required data
- API patterns from API_REFERENCE.md must be followed
- Database access patterns from DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md must be followed

## Timeline

The estimated timeline for this epic is 1-2 weeks, depending on the complexity of the data and any schema modifications required. 