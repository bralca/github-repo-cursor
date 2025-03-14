## Pipeline Management Tables

### pipeline_schedules

Stores cron schedules for different pipeline types.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| pipeline_type | text | Type of pipeline (github_sync, data_processing, data_enrichment, ai_analysis) |
| cron_expression | text | Cron expression for scheduling |
| is_active | boolean | Whether the schedule is active |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

### pipeline_history

Tracks execution history of pipeline runs.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| pipeline_type | text | Type of pipeline (github_sync, data_processing, data_enrichment, ai_analysis) |
| started_at | timestamp with time zone | When the pipeline run started |
| completed_at | timestamp with time zone | When the pipeline run completed (null if still running) |
| status | text | Status of the run (running, completed, failed) |
| items_processed | integer | Number of items processed in this run |
| error_message | text | Error message if the run failed |
| created_at | timestamp with time zone | Creation timestamp | 