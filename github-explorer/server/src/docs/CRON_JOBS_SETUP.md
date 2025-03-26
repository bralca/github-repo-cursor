# Cron Jobs Setup Documentation

This document outlines the cron jobs setup for the GitHub Explorer application.

## Overview

The application has five essential pipeline types that are executed on a schedule:

1. **Data Processing** (`data_processing`): Pulls closed merge requests from GitHub API
2. **Entity Extraction** (`entity_extraction`): Extracts entities from raw data
3. **Data Enrichment** (`data_enrichment`): Enriches entities with additional data from GitHub API
4. **Sitemap Generation** (`sitemap_generation`): Generates XML sitemaps for SEO
5. **Developer Rankings** (`contributor_rankings`): Generates and updates developer rankings

## Cron Schedule

Each pipeline type is scheduled to run at specific intervals:

| Pipeline Type | Cron Expression | Schedule | Description |
|---------------|----------------|----------|-------------|
| `data_processing` | `*/1 * * * *` | Every minute | Pulls closed merge requests from GitHub API |
| `entity_extraction` | `*/1 * * * *` | Every minute | Extracts entities from raw data |
| `data_enrichment` | `*/5 * * * *` | Every 5 minutes | Enriches entities with additional data from GitHub API |
| `sitemap_generation` | `0 * * * *` | Every hour (at minute 0) | Generates XML sitemaps for SEO |
| `contributor_rankings` | `*/10 * * * *` | Every 10 minutes | Generates and updates developer rankings |

## Setup Process

The setup process involves two main steps:

1. **Pipeline Initialization**: Registers all pipeline types and their respective stages with the pipeline factory
2. **Cron Jobs Setup**: Creates scheduler entries for each pipeline type with the appropriate cron expression

## Required Files

The following files are essential for the cron jobs setup:

### Pipeline Registration Files

- `github-explorer/server/src/pipeline/stages/data-processing-pipeline.js`: Registers the data processing pipeline
- `github-explorer/server/src/pipeline/stages/entity-extraction-pipeline.js`: Registers the entity extraction pipeline
- `github-explorer/server/src/pipeline/stages/data-enrichment-pipeline.js`: Registers the data enrichment pipeline
- `github-explorer/server/src/pipeline/stages/sitemap-generation-pipeline.js`: Registers the sitemap generation pipeline
- `github-explorer/server/src/pipeline/stages/contributor-rankings-pipeline.js`: Registers the contributor rankings pipeline

### Initialization Files

- `github-explorer/server/src/pipeline/initialize-pipelines.js`: Central file for initializing all required pipelines
- `github-explorer/server/src/scripts/setup-required-cron-jobs.js`: Script for setting up the required cron jobs
- `github-explorer/server/src/bin/initialize-and-setup-cron-jobs.js`: Script to run both initialization and setup

## Running the Setup

To initialize the pipelines and set up the cron jobs, run:

```bash
node src/bin/initialize-and-setup-cron-jobs.js
```

This command will:
1. Initialize all required pipeline types
2. Set up cron jobs for each pipeline type
3. Display the current active schedules

## Modifying Schedules

To modify the schedule for a pipeline type:

1. Update the cron expression in `github-explorer/server/src/scripts/setup-required-cron-jobs.js`
2. Re-run the initialization and setup script

## Troubleshooting

If a pipeline is not running as expected:

1. Check that the pipeline type is registered correctly in the corresponding registration file
2. Verify that the pipeline type is initialized in `initialize-pipelines.js`
3. Confirm that the cron job is set up with the correct cron expression in `setup-required-cron-jobs.js`
4. Check the logs for any errors during pipeline execution 