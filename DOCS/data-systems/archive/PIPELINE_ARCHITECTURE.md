# GitHub Explorer Data Pipeline Architecture

This document describes the architecture of the data pipeline used in the GitHub Explorer application to process GitHub data and store it in the Supabase database.

## Overview

The data pipeline is responsible for:

1. Extracting entities from GitHub API data
2. Enriching entities with additional data
3. Persisting entities to the Supabase database

The pipeline is designed to be modular, extensible, and resilient, with features such as:

- Batch processing
- Error handling and retry logic
- Checkpointing
- Performance monitoring
- Configurable stages

## Core Components

### Pipeline Context

The `PipelineContext` class is the central data store for the pipeline execution. It:

- Stores the raw data and extracted entities
- Tracks statistics and errors
- Manages the pipeline state
- Provides checkpointing capabilities

### Pipeline

The `Pipeline` class orchestrates the execution of pipeline stages. It:

- Manages the sequence of stage execution
- Handles errors and retries
- Supports batch processing
- Provides configuration options

### Base Stage

The `BaseStage` class is the foundation for all pipeline stages. It:

- Defines the interface for stage execution
- Provides common utilities for logging, validation, and error handling
- Supports batch processing and retry logic

### Pipeline Factory

The `PipelineFactory` class manages pipeline definitions and stage registrations. It:

- Registers pipeline stages and definitions
- Creates pipeline instances
- Provides methods to run pipelines

## Processors

### Entity Extractor

The `EntityExtractorProcessor` extracts entities from raw GitHub data:

- Repositories
- Contributors
- Merge Requests
- Commits

### Data Enricher

The `DataEnricherProcessor` enriches entities with additional data from the GitHub API:

- Fetches detailed repository information
- Retrieves contributor details
- Gets complete merge request data
- Fetches commit details

### Database Writer

The `DatabaseWriterProcessor` persists entities to the Supabase database:

- Writes repositories
- Writes contributors
- Writes merge requests
- Writes commits
- Manages relationships between entities

## Pipeline Stages

### Webhook Processor Pipeline

The webhook processor pipeline is a predefined pipeline that processes GitHub webhook payloads:

1. Extract entities from the webhook payload
2. Enrich entities with additional data from the GitHub API
3. Persist entities to the Supabase database

## Data Flow

1. GitHub webhook payload is received by the webhook endpoint
2. The payload is passed to the webhook processor pipeline
3. The pipeline extracts entities from the payload
4. The pipeline enriches entities with additional data
5. The pipeline persists entities to the Supabase database
6. The pipeline returns a summary of the execution

## Usage

### Processing a Webhook Payload

```javascript
import { processWebhookPayload } from '../pipeline/stages/webhook-processor-pipeline.js';

// Process a webhook payload
const result = await processWebhookPayload(webhookPayload);
console.log('Pipeline execution completed', result);
```

### Processing Multiple Webhook Payloads

```javascript
import { processWebhookPayloads } from '../pipeline/stages/webhook-processor-pipeline.js';

// Process multiple webhook payloads in batches
const result = await processWebhookPayloads(webhookPayloads, 10);
console.log('Batch processing completed', result);
```

### Creating a Custom Pipeline

```javascript
import { Pipeline, PipelineContext } from '../pipeline/core/index.js';
import { EntityExtractorProcessor } from '../pipeline/processors/index.js';

// Create a custom pipeline
const pipeline = new Pipeline({
  name: 'custom-pipeline',
  stages: [
    new EntityExtractorProcessor()
  ],
  config: {
    maxConcurrency: 2,
    retryCount: 3
  }
});

// Run the pipeline
const context = await pipeline.run({ rawData: [data] });
console.log('Pipeline execution completed', context.getSummary());
```

## Error Handling

The pipeline includes comprehensive error handling:

- Each stage can be configured to abort on error or continue
- Errors are recorded in the pipeline context
- Retry logic is available for transient errors
- Error details are included in the execution summary

## Performance Considerations

- Batch processing is used to optimize database operations
- Concurrency is configurable to manage API rate limits
- Checkpointing allows for resuming pipeline execution
- Performance metrics are tracked in the pipeline context

## Future Enhancements

- Add support for more GitHub event types
- Implement more sophisticated entity extraction
- Add more data enrichment capabilities
- Improve performance monitoring and optimization
- Add support for other data sources 