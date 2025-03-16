# GitHub Explorer Data Pipeline Architecture

This document provides a comprehensive overview of the data pipeline architecture implemented in the GitHub Explorer application. The pipeline is responsible for fetching, processing, enriching, and analyzing GitHub data to power the application's visualizations and insights.

## Table of Contents

- [Overview](#overview)
- [Pipeline Components](#pipeline-components)
  - [GitHub Data Synchronization](#github-data-synchronization)
  - [Raw Data Processing](#raw-data-processing)
  - [Data Enrichment](#data-enrichment)
  - [Contributor-Repository Relationship Updates](#contributor-repository-relationship-updates)
  - [Analytics Calculations](#analytics-calculations)
- [Pipeline Flow](#pipeline-flow)
- [Component Details](#component-details)
- [Error Handling and Recovery](#error-handling-and-recovery)
- [Scalability Considerations](#scalability-considerations)
- [Performance Optimization](#performance-optimization)
- [Integration with Database Schema](#integration-with-database-schema)
- [Scheduled Jobs](#scheduled-jobs)

## Overview

The GitHub Explorer data pipeline is an ETL (Extract, Transform, Load) process that:

1. Extracts data from the GitHub API via edge functions
2. Transforms raw data into structured entities (repositories, contributors, merge requests, commits)
3. Loads the processed data into the application's SQLite database
4. Enriches entities with additional metadata and analytics
5. Maintains relationships between entities for efficient querying

The pipeline is designed to be fault-tolerant, scalable, and optimized for the specific data access patterns needed by the application's UI components.

## Pipeline Components

### GitHub Data Synchronization

**Purpose**: Extract data from GitHub API and store it in raw format for later processing

**Input**: GitHub API responses (repositories, pull requests, commits, users)
**Output**: Raw JSON data stored in the `closed_merge_requests_raw` table

**Dependencies**: 
- GitHub API (external)
- GitHub API token (environment variable)
- SQLite database

**Execution Frequency**: 
- On-demand via admin panel
- Scheduled background jobs (configurable frequency)

### Raw Data Processing

**Purpose**: Transform raw GitHub API data into structured application entities

**Input**: Raw JSON data from `closed_merge_requests_raw` table
**Output**: Populated entities in respective tables:
- `repositories`
- `contributors`
- `merge_requests`
- `commits`

**Dependencies**:
- Raw data from GitHub Data Synchronization
- SQLite database functions

**Execution Frequency**:
- Automatically after GitHub Data Synchronization
- On-demand via admin panel

### Data Enrichment

**Purpose**: Enhance entities with additional metadata, analytics, and derived fields

**Input**: Basic entity data from core tables
**Output**: Enriched entities with additional fields:
- Repository health metrics
- Contributor impact scores
- Merge request complexity analysis
- Commit analysis and categorization

**Dependencies**:
- Processed entity data
- Optional: AI analysis services for certain enrichments

**Execution Frequency**:
- Scheduled background jobs
- On-demand via admin panel

### Contributor-Repository Relationship Updates

**Purpose**: Maintain many-to-many relationships between contributors and repositories

**Input**: Processed commit data with author and repository information
**Output**: Updated `contributor_repository` junction table with contribution counts

**Dependencies**:
- Processed commits data
- Contributor and repository entities

**Execution Frequency**:
- Automatically after Raw Data Processing
- On-demand via admin panel

### Analytics Calculations

**Purpose**: Generate pre-computed analytics for dashboards and visualizations

**Input**: Enriched entity data
**Output**: Analytics views and materialized data:
- Contribution trends over time
- Repository activity metrics
- Contributor performance metrics

**Dependencies**:
- Enriched entity data
- SQLite functions for complex calculations

**Execution Frequency**:
- Scheduled background jobs
- On-demand via admin panel or specific UI interactions

## Pipeline Flow

```
+----------------+     +-------------------+     +------------------+
| GitHub API     | --> | Raw Data Storage  | --> | Data Processing  |
| (Edge Function)|     | (closed_merge_requests_raw) |     | (Process Edge Fn)|
+----------------+     +-------------------+     +------------------+
                                                          |
                                                          v
+------------------+     +-----------------------+     +------------------+
| Analytics        | <-- | Contributor-Repo      | <-- | Data Enrichment  |
| Calculations     |     | Relationship Updates  |     | (Enrich Edge Fn) |
+------------------+     +-----------------------+     +------------------+
```

## Component Details

### GitHub Data Synchronization (Edge Function)

**Pseudo-code**:

```
function extractAndSaveData():
    // Initialize clients
    initialize SQLite connection
    initialize Octokit client with GitHub token
    
    // Fetch recent merged pull requests
    mergedPRs = getRecentMergedPullRequests()
    
    for each event in mergedPRs:
        // Extract repository and pull request data
        repository = extract repository data from event
        pullRequest = extract pull request data from event
        
        // Get additional data
        mergedBy = getContributorInfo(pullRequest.merged_by.login)
        commits = getPrCommits(repository.owner, repository.name, pullRequest.number)
        
        // Process each commit
        commitData = []
        for each commit in commits:
            authorInfo = getContributorInfo(commit.author.login)
            commitContent = getCommitContent(repository.owner, repository.name, commit.sha)
            
            // Add to commit data array
            commitData.push({
                sha: commit.sha,
                author: authorInfo,
                message: commit.commit.message,
                content: commitContent
            })
        
        // Calculate lines changed
        linesChanged = 0
        addedLines = []
        deletedLines = []
        
        for each commit in commitData:
            for each file in commit.content:
                if file has patch:
                    parse patch to count added and deleted lines
                    add to linesChanged, addedLines, deletedLines
        
        // Store data in closed_merge_requests_raw table
        create record in closed_merge_requests_raw with:
            repo_id = event.repo.id
            repo_name = event.repo.name
            pr_number = pullRequest.number
            data = {
                repository: repository details,
                pull_request: pull request details including commits
            }
            processed = false
        
    return { success: true, message: "Processed ${mergedPRs.length} pull requests" }

// Helper functions
function getRecentMergedPullRequests():
    fetch public events from GitHub API
    filter to only PullRequestEvent with action='closed' and merged=true
    return filtered events

function getContributorInfo(username):
    fetch user details from GitHub API
    return { id, avatar_url, email }

function getPrCommits(owner, repo, prNumber):
    fetch commits for PR from GitHub API
    return commits array

function getCommitContent(owner, repo, commitSha):
    fetch commit details from GitHub API
    for each file in commit:
        if file doesn't have patch and file isn't removed:
            fetch file content from GitHub API
    return files with patches and/or content
```

### Raw Data Processing (Edge Function)

**Pseudo-code**:

```
function processRawData(requestItems?, batchSize = 100):
    // Fetch unprocessed items if not provided
    if requestItems not provided:
        rawItems = fetch up to batchSize unprocessed records from closed_merge_requests_raw
    else:
        rawItems = requestItems
    
    // Initialize tracking variables
    processed = 0
    errors = 0
    errorDetails = []
    repoBatch = []
    mrBatch = []
    contributorBatch = []
    commitBatch = []
    processedIds = []
    
    // Process each raw data item
    for each item in rawItems:
        try:
            rawData = item.data
            
            // Process repository
            if rawData has repository:
                repo = extract repository data
                repoBatch.push(repo)
            
            // Process merge request
            if rawData has pull_request:
                result = processMergeRequest(rawData)
                mrBatch.push(result)
            
            // Process contributor (repository owner)
            if rawData has repository.owner:
                contributorData = extract contributor data
                contributorBatch.push(contributorData)
            
            // Process commit
            if rawData has commit or head.commit:
                commit = extract commit
                repoId = extract repository ID
                mrId = extract merge request ID
                commitBatch.push({ commit, repoId, mrId })
            
            // Mark as processed
            processedIds.push(item.id)
            processed++
        catch (error):
            errors++
            errorDetails.push({ type, item, error })
    
    // Batch insert repositories
    if repoBatch not empty:
        upsert repoBatch into repositories table
    
    // Batch insert contributors
    if contributorBatch not empty:
        upsert contributorBatch into contributors table
        
        // Create contributor-repository relationships
        extract and upsert contributor-repository relationships
    
    // Batch process commits
    if commitBatch not empty:
        for each commitItem in commitBatch:
            processCommit(commitItem.commit, commitItem.repoId, commitItem.mrId)
    
    // Mark items as processed
    if processedIds not empty:
        update closed_merge_requests_raw set processed=true where id in processedIds
    
    return {
        success: true,
        processed,
        errors,
        message: "Processed ${processed} items with ${errors} errors",
        errorDetails
    }

// Helper function for processing merge requests
function processMergeRequest(rawData):
    // Extract data from pull_request object
    // Transform into format for merge_requests table
    return transformedMergeRequest

// Helper function for processing commits
function processCommit(commit, repoId, mrId):
    // Extract commit data
    // Transform into format for commits table
    // Handle contributor data for commit author
    // Build diff from patches
    upsert into commits table
    return commitHash
```

### Data Enrichment (Edge Function)

**Pseudo-code**:

```
function enrichData(offset = 0, batchSize = 5):
    // Initialize counters for results
    processed = 0
    remaining = {
        repositories: 0,
        contributors: 0,
        merge_requests: 0,
        commits: 0
    }
    
    // 1. Enrich repositories
    repoResults = enrichRepositories(offset, batchSize)
    processed += repoResults.processed
    remaining.repositories = repoResults.remaining
    
    // 2. Enrich contributors
    if repoResults.processed < batchSize:
        // Use remaining quota from batch for contributors
        contributorOffset = offset
        contributorBatchSize = batchSize - repoResults.processed
        contributorResults = enrichContributors(contributorOffset, contributorBatchSize)
        processed += contributorResults.processed
        remaining.contributors = contributorResults.remaining
    else:
        // Count remaining contributors
        remaining.contributors = countUnenrichedContributors()
    
    // 3. Enrich merge requests
    if (repoResults.processed + contributorResults.processed) < batchSize:
        // Use remaining quota for merge requests
        mrOffset = offset
        mrBatchSize = batchSize - (repoResults.processed + contributorResults.processed)
        mrResults = enrichMergeRequests(mrOffset, mrBatchSize)
        processed += mrResults.processed
        remaining.merge_requests = mrResults.remaining
    else:
        // Count remaining merge requests
        remaining.merge_requests = countUnenrichedMergeRequests()
    
    // 4. Enrich commits
    if (repoResults.processed + contributorResults.processed + mrResults.processed) < batchSize:
        // Use remaining quota for commits
        commitOffset = offset
        commitBatchSize = batchSize - (repoResults.processed + contributorResults.processed + mrResults.processed)
        commitResults = enrichCommits(commitOffset, commitBatchSize)
        processed += commitResults.processed
        remaining.commits = commitResults.remaining
    else:
        // Count remaining commits
        remaining.commits = countUnenrichedCommits()
    
    // Return results
    return {
        success: true,
        processed,
        remaining,
        offset: offset + processed,
        message: `Processed ${processed} items with ${totalRemaining} remaining`
    }

// Helper functions for enriching specific entities
function enrichRepositories(offset, batchSize):
    fetch unenriched repositories with offset/limit
    for each repository:
        fetch additional data from GitHub API:
            languages, license, topics, etc.
        calculate health percentage based on various metrics
        update repository with enriched data
    return { processed: count, remaining: total - count }

function enrichContributors(offset, batchSize):
    fetch unenriched contributors with offset/limit
    for each contributor:
        fetch detailed profile from GitHub API
        analyze contribution patterns from commits
        determine role classification based on activity
        update contributor with enriched data
    return { processed: count, remaining: total - count }

function enrichMergeRequests(offset, batchSize):
    fetch unenriched merge requests with offset/limit
    for each merge request:
        analyze complexity based on:
            lines changed, files changed, commits count, etc.
        calculate cycle time and review time metrics
        update merge request with enriched data
    return { processed: count, remaining: total - count }

function enrichCommits(offset, batchSize):
    fetch unenriched commits with offset/limit
    for each commit:
        parse and analyze diff content
        extract detailed statistics
        update commit with enriched data
    return { processed: count, remaining: total - count }
```

### Contributor-Repository Relationship Updates (Database Function)

**Pseudo-code**:

```
function updateContributorRepositoryDirect():
    // Get count before update
    beforeCount = count records in contributor_repository
    
    // Clear existing data
    truncate contributor_repository table
    
    // Insert relationships based on commit data
    insert into contributor_repository (contributor_id, repository_id, contribution_count)
    select
        author as contributor_id,
        repository_id,
        count(*) as contribution_count
    from commits
    where
        author is not null
        and repository_id is not null
    group by
        author, repository_id
    
    // Get count after update
    afterCount = count records in contributor_repository
    
    // Return results
    return {
        success: true,
        before_count: beforeCount,
        after_count: afterCount,
        difference: afterCount - beforeCount
    }
```

## Error Handling and Recovery

The pipeline implements several error handling and recovery mechanisms:

1. **Batch Processing with Transaction Isolation**:
   - Data is processed in configurable batch sizes
   - Each batch operation is isolated, preventing cascading failures
   - Failed items are logged but don't block the entire pipeline

2. **Automatic Retry Logic**:
   - Edge functions implement retries for transient errors
   - Exponential backoff is applied to avoid overwhelming external APIs

3. **Detailed Error Logging**:
   - Each pipeline component logs detailed error information
   - Error details are stored with failed items for debugging

4. **Resumable Operations**:
   - Pipeline state is tracked in the `pipeline_runs` table
   - Operations can be resumed from the last successful point
   - Current enrichment offset is stored for long-running processes

5. **Skip-and-Continue Strategy**:
   - Invalid or problematic items are flagged but skipped
   - Processing continues with valid items

**Pseudo-code for Error Handling**:

```
try:
    process item
    mark as processed
catch (error):
    log detailed error information
    if error is transient (network, rate limit):
        queue for retry with backoff
    else:
        mark as failed
        store error details
    continue with next item
```

## Scalability Considerations

The data pipeline architecture is designed with scalability in mind:

1. **Horizontal Processing**:
   - Batch processing enables horizontal scaling
   - Independent stages can be run in parallel

2. **Configurable Batch Sizes**:
   - Batch sizes can be adjusted based on:
     - Available system resources
     - Data volume
     - Processing complexity

3. **Incremental Processing**:
   - Only new or changed data is processed
   - Enrichment focuses on unenriched entities
   - Historical data is preserved but not reprocessed

4. **Resource Optimization**:
   - GitHub API requests are batched to minimize calls
   - Database operations use bulk inserts/updates
   - Processing is designed to be memory-efficient

5. **Database Optimization**:
   - Indexed queries for efficient data retrieval
   - Bulk operations for data insertion/updates
   - Selective data loading to reduce memory pressure

## Performance Optimization

Several performance optimization strategies are implemented:

1. **Query Optimization**:
   - SQL queries use appropriate indexes
   - Joins are minimized where possible
   - Pagination and offsets used for large result sets

2. **Batch Processing**:
   - Data is processed in optimal batch sizes
   - Large operations are split into manageable chunks
   - Batching reduces database round-trips

3. **Caching**:
   - GitHub API responses are cached where appropriate
   - Redundant API calls are avoided

4. **Selective Processing**:
   - Only modified data is updated
   - Incremental processing focuses on new items
   - Enrichment targets only unenriched entities

5. **Asynchronous Processing**:
   - Resource-intensive operations run asynchronously
   - UI is decoupled from pipeline processing
   - Background tasks handle long-running operations

**Performance Metrics**:

| Component | Metric | Target |
|-----------|--------|--------|
| GitHub Sync | API Calls per Operation | < 500 |
| GitHub Sync | Items Processed per Minute | > 300 |
| Raw Data Processing | Items Processed per Second | > 50 |
| Data Enrichment | Items Enriched per Minute | > 20 |
| Contributor-Repo Updates | Update Duration | < 30 seconds |

## Integration with Database Schema

The data pipeline heavily integrates with the application's database schema:

1. **Raw Data Storage**:
   - The `closed_merge_requests_raw` table stores JSON blobs from GitHub API
   - Processed flag tracks pipeline progress
   - Repository and PR information links to structured tables

2. **Entity Tables**:
   - Pipeline populates core entity tables:
     - `repositories`
     - `contributors`
     - `merge_requests`
     - `commits`

3. **Relationship Management**:
   - Maintains relationships between entities:
     - `contributor_repository` - Many-to-many relationship between contributors and repositories
     - Foreign keys in `commits` linking to repositories and merge requests
     - Foreign keys in `merge_requests` linking to repositories

4. **Enrichment Flags**:
   - `is_enriched` boolean columns track enrichment status
   - `is_analyzed` flags track analysis status for commits

5. **Pipeline State**:
   - `pipeline_runs` table tracks execution status
   - Progress flags for each pipeline stage
   - Error storage for debugging

## Scheduled Jobs

The pipeline includes several scheduled jobs for automated data processing:

1. **GitHub Data Synchronization** (Daily):
   - Fetches latest data from GitHub API
   - Scheduled via cron job to run daily at off-peak hours
   - Configurable to run more frequently for active projects

2. **Data Processing** (Hourly):
   - Processes any unprocessed raw data
   - Runs hourly to ensure data is available for analysis quickly

3. **Enrichment Job** (Daily):
   - Enriches entities with additional metadata
   - Runs daily due to API rate limits and processing intensity

4. **Contributor-Repository Update** (Daily):
   - Updates contributor-repository relationships
   - Runs after data processing to ensure accurate contribution counts

5. **Analytics Calculations** (Weekly):
   - Generates pre-computed analytics for dashboards
   - Updates materialized views and aggregations
   - Weekly schedule balances freshness with performance

**Cron Job Configuration**:

```sql
-- Daily GitHub data sync at 1:00 AM
SELECT cron.schedule(
  'github-data-sync-daily',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url:='https://yhdbdgkxnhwqowiigblq.supabase.co/functions/v1/github-data-sync',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZGJkZ2t4bmh3cW93aWlnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNzU4MTksImV4cCI6MjA1NTc1MTgxOX0.3i4VuHH09WC9MCr_GLumu0HCyioy1YOdT3ovdWqIpHU"}'::jsonb,
    body:='{"batchProcessing": true}'::jsonb
  ) as request_id;
  $$
);

-- Hourly data processing
SELECT cron.schedule(
  'process-github-data-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://yhdbdgkxnhwqowiigblq.supabase.co/functions/v1/process-github-data',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZGJkZ2t4bmh3cW93aWlnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNzU4MTksImV4cCI6MjA1NTc1MTgxOX0.3i4VuHH09WC9MCr_GLumu0HCyioy1YOdT3ovdWqIpHU"}'::jsonb,
    body:='{"batchSize": 100}'::jsonb
  ) as request_id;
  $$
);

-- Daily data enrichment at 2:00 AM
SELECT cron.schedule(
  'enrich-data-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url:='https://yhdbdgkxnhwqowiigblq.supabase.co/functions/v1/enrich-data',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZGJkZ2t4bmh3cW93aWlnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNzU4MTksImV4cCI6MjA1NTc1MTgxOX0.3i4VuHH09WC9MCr_GLumu0HCyioy1YOdT3ovdWqIpHU"}'::jsonb,
    body:='{"batchSize": 20, "offset": 0}'::jsonb
  ) as request_id;
  $$
);

-- Daily contributor-repository update at 3:00 AM
SELECT cron.schedule(
  'update-contributor-repository-daily',
  '0 3 * * *',
  $$
  SELECT update_contributor_repository_direct();
  $$
);
```

This configuration ensures that all pipeline components run regularly, maintaining up-to-date data while respecting system resources and external API constraints.
