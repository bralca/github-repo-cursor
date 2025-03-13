
# Edge Functions Documentation

## Overview

The GitHub Explorer application leverages Supabase Edge Functions to handle backend operations that require secure API interactions, complex data processing, and scheduled tasks. These serverless functions form the backbone of the data pipeline that powers the application's analytics features, allowing for secure GitHub API integration, data processing, and enrichment without exposing sensitive credentials to the client.

The key edge functions in the application include:

1. **github-data-sync**: Fetches data from GitHub API and stores it in the database
2. **process-github-data**: Transforms raw GitHub data into structured entities
3. **enrich-data**: Enhances stored entities with additional metadata from GitHub
4. **update-contributor-repository**: Maintains contributor-repository relationships
5. **check-contributors**: Validates contributor data and fixes inconsistencies
6. **manage-cron-jobs**: Sets up and manages scheduled pipeline operations

This document provides a comprehensive reference for each function, including purpose, inputs, outputs, workflows, and integration points within the application.

## Core Data Pipeline Functions

### 1. github-data-sync

**File Path**: `/supabase/functions/github-data-sync/index.ts`

#### Purpose
Serves as the entry point for fetching data from the GitHub API, specifically focusing on pull requests (merge requests). The function securely communicates with GitHub using stored credentials and batches the results for further processing.

#### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `batchProcessing` | boolean | No | When true, processes data in batches to avoid timeouts |
| `maxBatchSize` | number | No | Maximum number of items per batch (default: 500) |
| `repoIds` | number[] | No | Specific repository IDs to sync (default: predefined list) |
| `startPage` | number | No | Page number to start from (default: 1) |
| `forceFull` | boolean | No | Force a full sync ignoring previous sync state (default: false) |

#### Output Format

```json
{
  "success": true,
  "items": [
    { /* Raw GitHub pull request data */ },
    ...
  ],
  "processedCount": 123,
  "message": "Successfully fetched 123 items from GitHub"
}
```

#### Workflow

```typescript
// Pseudo-code for github-data-sync workflow
function handleRequest(request) {
  // Parse request parameters
  const { batchProcessing, maxBatchSize, repoIds, startPage, forceFull } = parseRequestBody(request);
  
  // Initialize Octokit client with GitHub token
  const octokit = createOctokitClient(GITHUB_TOKEN);
  
  // Determine target repositories to fetch data from
  const targetRepos = repoIds || DEFAULT_REPO_LIST;
  
  // For each repository, fetch pull requests
  for (const repoId of targetRepos) {
    // Get repository details
    const repo = await getRepositoryDetails(repoId);
    
    // Fetch pull requests with pagination
    let page = startPage;
    let hasMorePages = true;
    
    while (hasMorePages) {
      // Check for GitHub API rate limits
      await handleRateLimits(octokit);
      
      // Fetch pull requests for current page
      const pullRequests = await octokit.pulls.list({
        owner: repo.owner,
        repo: repo.name,
        state: "all",
        per_page: 100,
        page: page
      });
      
      // Process each pull request
      for (const pr of pullRequests.data) {
        // Get additional details for each PR (commits, reviews, etc.)
        const enrichedPR = await getAdditionalPRDetails(pr, octokit);
        
        // Format data for database storage
        const formattedData = formatPRForStorage(enrichedPR, repo);
        
        // Store raw data in database
        await storeRawData(formattedData);
      }
      
      // Check if there are more pages
      hasMorePages = pullRequests.data.length === 100;
      page++;
      
      // Optional early exit if not batch processing
      if (!batchProcessing && page > startPage + 1) {
        break;
      }
    }
  }
  
  // Return success response with counts
  return createSuccessResponse();
}
```

#### Error Handling
- Implements exponential backoff for GitHub API rate limiting
- Catches and logs exceptions with detailed error context
- Continues processing other repositories if one fails
- Returns appropriate HTTP status codes for different error scenarios

#### Security Considerations
- Requires the `GITHUB_TOKEN` secret for GitHub API authentication
- Implements CORS headers to restrict access based on origin
- Does not expose sensitive data in responses

#### Database Interactions
- Writes raw GitHub data to `github_raw_data` table
- Updates `repositories` table with basic repository information
- Checks existing data to avoid duplicates

#### Integration with Frontend
The function is called from the admin dashboard using the `useGitHubSync` hook, which provides a user interface for triggering and monitoring the sync process:

```typescript
// Example call from frontend
const { isSyncing, triggerGitHubSync, stopGitHubSync } = useGitHubSync();

// Trigger sync function
await triggerGitHubSync();
```

### 2. process-github-data

**File Path**: `/supabase/functions/process-github-data/index.ts`

#### Purpose
Transforms raw GitHub data into structured entities in the database. This function parses the JSON data stored in the `github_raw_data` table and creates or updates records in the entity tables (repositories, contributors, merge_requests, commits).

#### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `items` | Array | No | Specific items to process instead of fetching from database |
| `batchSize` | number | No | Number of items to process in a batch (default: 100) |

#### Output Format

```json
{
  "success": true,
  "processed": 42,
  "errors": 0,
  "message": "Processed 42 items with 0 errors",
  "errorDetails": []
}
```

#### Workflow

```typescript
// Pseudo-code for process-github-data workflow
async function processRawData(requestItems, batchSize = 100) {
  // Determine items to process (from request or database)
  let rawItems = [];
  if (requestItems) {
    rawItems = requestItems;
  } else {
    // Fetch unprocessed items from database
    rawItems = await fetchUnprocessedItems(batchSize);
  }
  
  // Initialize tracking variables
  let processed = 0;
  let errors = 0;
  
  // Prepare batch containers
  const repoBatch = [];
  const mrBatch = [];
  const contributorBatch = [];
  const commitBatch = [];
  const processedIds = [];
  
  // Process each raw data item
  for (const item of rawItems) {
    try {
      const rawData = item.data;
      
      // Extract repository data if available
      if (rawData.repository) {
        repoBatch.push(extractRepositoryData(rawData.repository));
      }
      
      // Extract merge request data if available
      if (rawData.pull_request) {
        mrBatch.push(await processMergeRequest(rawData));
      }
      
      // Extract contributor data if available
      if (rawData.repository?.owner) {
        contributorBatch.push(extractContributorData(rawData));
      }
      
      // Extract commit data if available
      if (rawData.commit || rawData.head?.commit) {
        commitBatch.push(extractCommitData(rawData));
      }
      
      // Mark as processed
      processedIds.push(item.id);
      processed++;
    } catch (err) {
      errors++;
      // Log and track error
    }
  }
  
  // Batch insert/update repositories
  if (repoBatch.length > 0) {
    await batchUpsertRepositories(repoBatch);
  }
  
  // Batch insert/update contributors
  if (contributorBatch.length > 0) {
    await batchUpsertContributors(contributorBatch);
  }
  
  // Batch insert/update merge requests
  if (mrBatch.length > 0) {
    await batchUpsertMergeRequests(mrBatch);
  }
  
  // Process commits individually due to complexity
  if (commitBatch.length > 0) {
    await processCommitBatch(commitBatch);
  }
  
  // Mark processed items in the database
  if (processedIds.length > 0 && !requestItems) {
    await markItemsAsProcessed(processedIds);
  }
  
  // Return processing results
  return {
    success: true,
    processed,
    errors,
    message: `Processed ${processed} items with ${errors} errors`
  };
}
```

#### Error Handling
- Implements per-item error handling to prevent batch failure
- Tracks failed items with detailed error information
- Continues processing valid items even if some fail
- Returns comprehensive error reports for debugging

#### Security Considerations
- Operates with database service role permissions
- Implements input validation to prevent injection attacks
- Uses parameterized queries for all database operations

#### Database Interactions
- Reads from `github_raw_data` table
- Writes to `repositories`, `contributors`, `merge_requests`, and `commits` tables
- Updates `contributor_repository` table for relationships
- Updates processed flag in `github_raw_data` table

#### Integration with Frontend
The function is called from the admin dashboard using the `usePipelineControls` hook, specifically the `triggerDataProcessing` method:

```typescript
// Example call from frontend
const { isProcessing, triggerDataProcessing, stopDataProcessing } = usePipelineControls();

// Trigger data processing
await triggerDataProcessing();
```

### 3. enrich-data

**File Path**: `/supabase/functions/enrich-data/index.ts`

#### Purpose
Enhances stored entities with additional details from the GitHub API. This function fetches deeper information for repositories, contributors, and merge requests that is not included in the initial synchronization.

#### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `offset` | string | No | Offset for pagination (default: "0") |
| `batchSize` | string | No | Number of items to process (default: "5") |
| `entityType` | string | No | Type of entity to enrich ("repositories", "contributors", "merge_requests", or all if not specified) |

#### Output Format

```json
{
  "success": true,
  "processed": 5,
  "skipped": 0,
  "remaining": {
    "repositories": 42,
    "contributors": 18,
    "merge_requests": 37
  },
  "rate_limited": false,
  "rate_limit_reset": null
}
```

#### Workflow

```typescript
// Pseudo-code for enrich-data workflow
async function enrichData(offset = 0, batchSize = 5, entityType = null) {
  // Initialize GitHub API client
  const octokit = createOctokitClient(GITHUB_TOKEN);
  
  // Check rate limits before starting
  const rateLimits = await checkRateLimits(octokit);
  if (isRateLimited(rateLimits)) {
    return createRateLimitResponse(rateLimits);
  }
  
  // Get counts of unenriched entities
  const unenrichedCounts = await getUnenrichedCounts();
  
  // Determine which entity types to process
  const entitiesToProcess = entityType 
    ? [entityType] 
    : ["repositories", "contributors", "merge_requests"];
  
  let processed = 0;
  let skipped = 0;
  
  // Process each entity type
  for (const entityType of entitiesToProcess) {
    // Get batch of unenriched entities
    const entities = await fetchUnenrichedEntities(entityType, offset, batchSize);
    
    // Process each entity
    for (const entity of entities) {
      try {
        // Check rate limits before each API call
        await checkAndHandleRateLimits(octokit);
        
        // Enrich based on entity type
        switch (entityType) {
          case "repositories":
            await enrichRepository(entity, octokit);
            break;
          case "contributors":
            await enrichContributor(entity, octokit);
            break;
          case "merge_requests":
            await enrichMergeRequest(entity, octokit);
            break;
        }
        
        // Mark as enriched in database
        await markEntityAsEnriched(entityType, entity.id);
        processed++;
      } catch (error) {
        // Check if rate limited
        if (isRateLimitError(error)) {
          return createRateLimitResponse(error);
        }
        
        skipped++;
        // Log error and continue
      }
    }
  }
  
  // Get updated counts
  const remainingCounts = await getUnenrichedCounts();
  
  // Return results
  return {
    success: true,
    processed,
    skipped,
    remaining: remainingCounts,
    rate_limited: false
  };
}
```

#### Error Handling
- Detects and manages GitHub API rate limits
- Returns remaining counts even if processing is interrupted
- Tracks skipped items for retry
- Provides detailed error logging for failed enrichment

#### Security Considerations
- Requires the `GITHUB_TOKEN` secret for GitHub API authentication
- Implements CORS protection
- Validates inputs to prevent injection attacks

#### Database Interactions
- Reads from `repositories`, `contributors`, and `merge_requests` tables
- Updates the same tables with enriched data
- Sets `is_enriched` flag to `true` for processed entities

#### Integration with Frontend
The function is called from two places in the admin dashboard:
1. The `triggerDataEnrichment` method in the `usePipelineControls` hook for single batch enrichment
2. The `ContinuousEnrichment` component for multi-batch processing:

```typescript
// Example call from frontend (single batch)
const { isEnriching, triggerDataEnrichment } = usePipelineControls();
await triggerDataEnrichment();

// Example call from ContinuousEnrichment component (multiple batches)
const invokeBatchEnrichment = async (offset, batchSize, entityType) => {
  const { data } = await supabase.functions.invoke("enrich-data", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    body: { offset, batchSize, entityType }
  });
  return data;
};
```

### 4. update-contributor-repository

**File Path**: `/supabase/functions/update-contributor-repository/index.ts`

#### Purpose
Maintains the relationships between contributors and repositories by analyzing commit data. This function ensures that the `contributor_repository` junction table is kept up-to-date with the latest contribution information.

#### Input Parameters
This function does not require input parameters, as it operates on the entire dataset.

#### Output Format

```json
{
  "success": true,
  "processed": 423,
  "totalContributors": 156,
  "totalRelationships": 423,
  "missingRelationships": 0
}
```

#### Workflow

```typescript
// Pseudo-code for update-contributor-repository workflow
async function updateContributorRepository() {
  // Get all contributors with valid IDs
  const contributors = await fetchAllContributors();
  
  // Get all repositories with valid IDs
  const repositories = await fetchAllRepositories();
  
  // Initialize tracking
  let processedRelationships = 0;
  let missingRelationships = 0;
  
  // Fetch current contributor-repository relationships
  const existingRelationships = await fetchExistingRelationships();
  
  // Create a map for quick lookups
  const relationshipMap = createRelationshipMap(existingRelationships);
  
  // Get commit-based contributor-repository counts
  const commitBasedCounts = await getContributorRepositoryCounts();
  
  // Process each relationship from commit data
  for (const relationship of commitBasedCounts) {
    const { contributor_id, repository_id, count } = relationship;
    
    // Validate that both entities exist
    const contributorExists = contributors.has(contributor_id);
    const repositoryExists = repositories.has(repository_id);
    
    if (contributorExists && repositoryExists) {
      // Update or insert relationship
      await upsertRelationship(contributor_id, repository_id, count);
      processedRelationships++;
    } else {
      missingRelationships++;
      // Log missing relationship
    }
  }
  
  // Return results
  return {
    success: true,
    processed: processedRelationships,
    totalContributors: contributors.size,
    totalRelationships: processedRelationships,
    missingRelationships
  };
}
```

#### Error Handling
- Validates entity existence before creating relationships
- Logs all errors with detailed context
- Tracks missing relationships for diagnosis
- Uses transaction when possible to ensure data consistency

#### Security Considerations
- Implements CORS protection
- Uses service role access for database operations
- Validates database constraints to prevent invalid data

#### Database Interactions
- Reads from `commits`, `contributors`, and `repositories` tables
- Writes to `contributor_repository` junction table
- Performs `UPSERT` operations to handle existing relationships

#### Integration with Frontend
The function is called from the admin dashboard using the `updateContributorRepository` method in the `usePipelineControls` hook:

```typescript
// Example call from frontend
const { updateContributorRepository, isUpdatingContributorRepo } = usePipelineControls();

// Trigger the update
await updateContributorRepository();
```

## Utility Functions

### 5. check-contributors

**File Path**: `/supabase/functions/check-contributors/index.ts`

#### Purpose
Validates the integrity of contributor data and fixes inconsistencies. This function ensures that all contributors referenced in commits exist in the contributors table and have correct metadata.

#### Input Parameters
This function accepts no parameters as it is designed to run as a maintenance operation.

#### Output Format

```json
{
  "success": true,
  "checked": 1205,
  "created": 37,
  "updated": 12,
  "errors": 0
}
```

#### Workflow

```typescript
// Pseudo-code for check-contributors workflow
async function checkContributors() {
  // Fetch all unique contributor IDs from commits
  const commitContributors = await fetchUniqueContributorIdsFromCommits();
  
  // Fetch existing contributors
  const existingContributors = await fetchExistingContributors();
  
  // Create a set of existing contributor IDs for quick lookup
  const existingContributorIds = new Set(existingContributors.map(c => c.id));
  
  // Track operation counts
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  // Process each contributor from commits
  for (const contributorId of commitContributors) {
    try {
      if (!existingContributorIds.has(contributorId)) {
        // Contributor doesn't exist, create it
        const contributorData = await createMinimalContributorRecord(contributorId);
        await insertContributor(contributorData);
        created++;
      } else {
        // Contributor exists, check if it needs updating
        const contributor = existingContributors.find(c => c.id === contributorId);
        if (needsUpdate(contributor)) {
          await updateContributor(contributorId, getUpdatedFields(contributor));
          updated++;
        }
      }
    } catch (error) {
      errors++;
      // Log error details
    }
  }
  
  // Return results
  return {
    success: true,
    checked: commitContributors.length,
    created,
    updated,
    errors
  };
}
```

#### Error Handling
- Implements per-contributor error handling
- Continues processing even if individual contributors fail
- Logs detailed error information for diagnosis
- Returns comprehensive error statistics

#### Security Considerations
- Implements CORS protection
- Uses service role for database operations
- Validates input data before database insertion

#### Database Interactions
- Reads from `commits` table to find contributor references
- Reads and writes to `contributors` table
- Performs `INSERT` and `UPDATE` operations as needed

#### Integration with Frontend
This function is typically not called directly from the frontend but is instead run as part of the data pipeline:

```typescript
// Example of how it might be called in a full pipeline process
const runFullDataPipeline = async () => {
  await triggerGitHubSync();
  await triggerDataProcessing();
  await supabase.functions.invoke("check-contributors");
  await triggerDataEnrichment();
};
```

### 6. manage-cron-jobs

**File Path**: `/supabase/functions/manage-cron-jobs/index.ts`

#### Purpose
Sets up and manages scheduled pipeline operations using Postgres' `pg_cron` extension. This function allows creating, updating, and deleting cron jobs for automated data processing.

#### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | Action to perform: "setup", "list", "delete" |
| `jobName` | string | No | Name of specific job (for delete action) |
| `schedule` | string | No | Cron schedule expression (for setup action) |

#### Output Format

```json
{
  "success": true,
  "action": "setup",
  "jobs": [
    {
      "jobid": 123,
      "jobname": "sync-github-data-daily",
      "schedule": "0 0 * * *",
      "command": "SELECT invoke_function('github-data-sync')"
    }
  ]
}
```

#### Workflow

```typescript
// Pseudo-code for manage-cron-jobs workflow
async function manageCronJobs(action, jobName, schedule) {
  // Connect to database with admin privileges
  const client = await connectToDatabaseWithAdminRole();
  
  try {
    switch (action) {
      case "setup":
        // Set up standard cron jobs
        await setupStandardJobs(client, schedule);
        break;
        
      case "list":
        // List all existing cron jobs
        const jobs = await listCronJobs(client);
        return {
          success: true,
          action: "list",
          jobs
        };
        
      case "delete":
        // Delete specific job or all jobs
        if (jobName) {
          await deleteJob(client, jobName);
        } else {
          await deleteAllJobs(client);
        }
        break;
        
      default:
        throw new Error("Invalid action specified");
    }
    
    // Get updated job list after changes
    const updatedJobs = await listCronJobs(client);
    
    return {
      success: true,
      action,
      jobs: updatedJobs
    };
  } finally {
    // Close database connection
    await client.end();
  }
}

// Helper function to set up standard jobs
async function setupStandardJobs(client, customSchedule) {
  // Default schedules
  const schedules = {
    daily: "0 0 * * *", // At midnight every day
    hourly: "0 * * * *", // At the start of every hour
    weekly: "0 0 * * 0"  // At midnight on Sunday
  };
  
  // Use custom schedule if provided, otherwise use daily
  const schedule = customSchedule || schedules.daily;
  
  // Create GitHub sync job
  await createCronJob(
    client,
    "sync-github-data-daily",
    schedule,
    "SELECT invoke_function('github-data-sync')"
  );
  
  // Create data processing job (30 minutes after sync)
  await createCronJob(
    client,
    "process-github-data-daily",
    schedule.replace("0 0", "30 0"),
    "SELECT invoke_function('process-github-data')"
  );
  
  // Create contributor-repository update job (1 hour after sync)
  await createCronJob(
    client,
    "update-contributor-repository-daily",
    schedule.replace("0 0", "0 1"),
    "SELECT invoke_function('update-contributor-repository')"
  );
}
```

#### Error Handling
- Validates input actions and parameters
- Provides detailed error messages for invalid inputs
- Implements database operation error handling
- Ensures clean database connection closure

#### Security Considerations
- Requires elevated database privileges to manage cron jobs
- Implements strict CORS protection
- Validates cron schedules to prevent injection
- Uses parameterized queries for all database operations

#### Database Interactions
- Interacts with `cron.job` table through database functions
- Uses database function `invoke_function` to trigger edge functions
- Requires `pg_cron` extension to be enabled

#### Integration with Frontend
The function is called from the admin dashboard for setting up automated pipeline processes:

```typescript
// Example call from frontend
const setupCronJobs = async (schedule) => {
  const { data, error } = await supabase.functions.invoke("manage-cron-jobs", {
    method: "POST",
    body: {
      action: "setup",
      schedule
    }
  });
  
  if (error) {
    console.error("Failed to set up cron jobs:", error);
    return;
  }
  
  console.log("Cron jobs set up successfully:", data.jobs);
};
```

## Integration Patterns

### Edge Function Dependencies

The edge functions in GitHub Explorer form a cohesive data pipeline with dependencies between functions:

```
github-data-sync → process-github-data → check-contributors → update-contributor-repository → enrich-data
```

Each function in the pipeline operates on the output of the previous function:

1. `github-data-sync` fetches raw data from GitHub and stores it in the `github_raw_data` table
2. `process-github-data` transforms this raw data into structured entity records
3. `check-contributors` ensures data integrity for contributor records
4. `update-contributor-repository` maintains relationships between contributors and repositories
5. `enrich-data` enhances all entities with additional metadata from GitHub

The `manage-cron-jobs` function can schedule any of these operations to run automatically.

### Performance Optimization Techniques

Several optimization techniques are employed across these edge functions:

1. **Batch Processing**: All functions implement batch processing to handle large datasets efficiently without timeouts.

2. **Pagination**: Functions that interact with GitHub API or read large database tables use pagination to break work into manageable chunks.

3. **Incremental Processing**: The pipeline is designed for incremental updates, only processing new or changed data to minimize resource usage.

4. **Rate Limit Handling**: GitHub API rate limits are detected and respected, with processing automatically paused and resumed.

5. **Database Optimizations**:
   - Bulk upserts for efficient database writes
   - Selective column fetching to minimize data transfer
   - Strategic use of indexes for query performance
   - JSONB storage for flexible schema evolution

6. **Parallel Processing**:
   - Different entity types are processed in parallel where appropriate
   - Promise.all is used for concurrent non-dependent operations

### Deployment and Versioning

Edge functions in GitHub Explorer follow these deployment practices:

1. **Version Control Integration**: All edge functions are stored in the application repository under the `/supabase/functions` directory, ensuring they are versioned alongside the rest of the codebase.

2. **Automated Deployment**: Functions are automatically deployed when changes are pushed to the main branch using Supabase CLI integration with the CI/CD pipeline.

3. **Environment Isolation**: Separate function deployments exist for development, staging, and production environments, with environment-specific configuration.

4. **Secrets Management**: Sensitive credentials like the GitHub token are stored as Supabase secrets and accessed via environment variables within functions.

5. **Logging Strategy**: Structured logging is implemented in all functions, with logs available in the Supabase dashboard for monitoring and debugging.

### Error Handling Strategy

A comprehensive error handling strategy is implemented across all edge functions:

1. **Graceful Degradation**: Functions continue partial processing even when errors occur with some items.

2. **Detailed Error Reporting**: Errors include context about the operation, input data, and failure reason.

3. **Status Tracking**: The pipeline maintains state tracking for operations, allowing for resumption after errors.

4. **Rate Limit Handling**: Special handling for GitHub API rate limits includes automatic detection and scheduled resumption.

5. **Validation**: Input data is validated before processing to catch errors early.

6. **Transaction Support**: Database operations use transactions where appropriate to maintain consistency.

## Conclusion

The edge functions in GitHub Explorer form a robust backend system that powers the application's data pipeline. These functions enable secure GitHub API interactions, complex data processing, and automated maintenance tasks without exposing sensitive credentials to the client.

By leveraging Supabase's serverless infrastructure, the application achieves scalability, security, and maintainability while providing rich data analytics features to users.

Future enhancements to these functions could include:
- Enhanced error recovery mechanisms
- More sophisticated scheduling options
- Additional data sources beyond GitHub
- AI-powered data enrichment and analysis
- Real-time notification systems for pipeline events
