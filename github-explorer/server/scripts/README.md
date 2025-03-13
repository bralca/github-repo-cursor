# GitHub Explorer Scripts

This directory contains utility scripts for managing the GitHub Explorer application.

## Data Migration Scripts

### Update Contributor IDs Script

The `update-contributor-id-in-batches.js` script is designed to update the `contributor_id` field in the `commits` table without running into timeout issues in Supabase. It processes records in small batches to ensure the operation can complete successfully.

#### Prerequisites

1. Make sure you have the required environment variables set in your `.env` file:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (requires write access)

2. Install dependencies if you haven't already:
   ```
   npm install
   ```

#### How to Run

Execute the script using Node.js:

```bash
node scripts/update-contributor-id-in-batches.js
```

#### What the Script Does

1. Connects to your Supabase database using the provided credentials
2. Processes commits in batches of 100 to avoid timeouts
3. For each commit:
   - Looks up the corresponding contributor by username or name
   - Updates the commit's `contributor_id` field to link it to the contributor
4. Provides progress information as it runs
5. Handles both regular commits and placeholder author commits separately

#### Troubleshooting

If you encounter issues:

1. Check your Supabase credentials
2. Ensure your database has the required tables and columns
3. Look for error messages in the console output
4. Adjust the `BATCH_SIZE` constant in the script if needed (smaller batches are slower but less likely to timeout)

## Other Scripts

[Additional scripts will be documented here as they are added] 