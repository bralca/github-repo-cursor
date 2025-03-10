
# Secret Management in GitHub Explorer

This document provides a comprehensive overview of all secrets used in the GitHub Explorer application, their storage locations, access methods, and naming conventions.

## Overview

GitHub Explorer uses Supabase Edge Functions for secure backend operations. These edge functions require various API keys and secrets to authenticate with external services, particularly the GitHub API. These secrets are stored securely in Supabase and are not exposed to the client-side code.

## Secret Storage

All secrets are stored in the Supabase Edge Function secrets system, which provides a secure environment for sensitive credentials. 

**Storage Location:** Supabase Edge Function Secrets
**Access URL:** [Supabase Edge Function Secrets Dashboard](https://supabase.com/dashboard/project/yhdbdgkxnhwqowiigblq/settings/functions)

## Secret Keys

Below is a comprehensive list of all secret keys used in the application:

### 1. GitHub Token

| Attribute | Value |
|-----------|-------|
| **Secret Name** | `GITHUB_TOKEN` |
| **Usage** | Authenticates requests to the GitHub API |
| **Required For** | All GitHub data operations in edge functions |
| **Format** | A GitHub Personal Access Token with appropriate scopes |
| **Used In** | `github-data-sync`, `enrich-data` edge functions |

### 2. Supabase URL

| Attribute | Value |
|-----------|-------|
| **Secret Name** | `SUPABASE_URL` |
| **Usage** | Base URL for Supabase project |
| **Required For** | Edge functions to connect to Supabase |
| **Format** | URL (e.g., `https://yhdbdgkxnhwqowiigblq.supabase.co`) |
| **Used In** | All edge functions |

### 3. Supabase Anon Key

| Attribute | Value |
|-----------|-------|
| **Secret Name** | `SUPABASE_ANON_KEY` |
| **Usage** | Public key for Supabase client |
| **Required For** | Anonymous access to allowed Supabase resources |
| **Format** | JWT token string |
| **Used In** | Client-side Supabase initialization |

### 4. Supabase Service Role Key

| Attribute | Value |
|-----------|-------|
| **Secret Name** | `SUPABASE_SERVICE_ROLE_KEY` |
| **Usage** | Privileged access to Supabase resources |
| **Required For** | Administrative operations in edge functions |
| **Format** | JWT token string |
| **Used In** | All edge functions for database operations |

### 5. Supabase Database URL

| Attribute | Value |
|-----------|-------|
| **Secret Name** | `SUPABASE_DB_URL` |
| **Usage** | Direct connection to PostgreSQL database |
| **Required For** | Advanced database operations in edge functions |
| **Format** | PostgreSQL connection string |
| **Used In** | Edge functions requiring direct database access |

### 6. Screenshot API Key

| Attribute | Value |
|-----------|-------|
| **Secret Name** | `SCREENSHOT_API_KEY` |
| **Usage** | Authentication for external screenshot service |
| **Required For** | Generating repository preview images |
| **Format** | API key string |
| **Used In** | Not currently implemented in edge functions |

## How to Access Secrets

### In Edge Functions

Edge functions can access these secrets directly as environment variables:

```typescript
// Example of accessing secrets in an edge function
const githubToken = Deno.env.get('GITHUB_TOKEN');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Initialize clients with these secrets
const octokit = new Octokit({ auth: githubToken });
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
```

### In Frontend Code

The frontend does not and should not directly access most of these secrets. Only the public Supabase URL and anon key are used in the client code through the initialized Supabase client:

```typescript
// This is already set up in src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://yhdbdgkxnhwqowiigblq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZGJkZ2t4bmh3cW93aWlnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNzU4MTksImV4cCI6MjA1NTc1MTgxOX0.3i4VuHH09WC9MCr_GLumu0HCyioy1YOdT3ovdWqIpHU";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

## Setting Up Secrets

To set up these secrets for a new deployment:

1. Navigate to the [Supabase Edge Function Secrets Dashboard](https://supabase.com/dashboard/project/yhdbdgkxnhwqowiigblq/settings/functions)
2. Click "Add Secret"
3. Enter the secret name exactly as listed above (e.g., `GITHUB_TOKEN`)
4. Enter the secret value
5. Click "Save"

## Rotating Secrets

For security best practices, secrets should be rotated periodically:

1. Generate new credentials from the respective service (e.g., GitHub)
2. Update the secret in the Supabase Edge Function Secrets Dashboard
3. No application restart is needed; new edge function invocations will use the updated secret

## Security Considerations

- Never commit secrets to the repository or hardcode them in the application
- Limit the scopes and permissions of tokens to the minimum required
- Rotate secrets regularly according to security best practices
- Monitor usage of secrets through service dashboards to detect unusual activity

## Secret Dependencies Between Edge Functions

| Edge Function | Required Secrets |
|---------------|-----------------|
| `github-data-sync` | `GITHUB_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `process-github-data` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `enrich-data` | `GITHUB_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `update-contributor-repository` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `check-contributors` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `manage-cron-jobs` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` |

## Troubleshooting

If edge functions fail with authentication or permission errors:

1. Verify that all required secrets are set correctly in the Supabase dashboard
2. Check that token scopes are sufficient for the operations being performed
3. Ensure tokens have not expired
4. Review edge function logs for specific error messages related to authentication
5. For GitHub API issues, confirm rate limit status using the GitHub API dashboard

## Next Steps & Recommendations

- Implement secret rotation automation
- Set up monitoring for secret usage and expiration
- Consider using a more robust secrets management system for larger scale deployments
