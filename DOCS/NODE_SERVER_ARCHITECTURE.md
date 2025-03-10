
# Node.js Server Architecture for GitHub Analytics

This document outlines the simplified architecture of the Node.js server component for the GitHub Analytics application, focusing primarily on running the data pipeline.

## Overview

The Node.js server acts as a dedicated pipeline processor that runs on Heroku. It has a focused purpose:

1. Process GitHub API data through scheduled and on-demand pipelines
2. Handle long-running data processing tasks
3. Manage GitHub API rate limits effectively
4. Update the Supabase database with processed data

The Next.js frontend communicates directly with Supabase for data retrieval and visualization, keeping the architecture clean and decoupled.

## Server Structure

```
server/
├── src/                    # Source code
│   ├── api/                # Simple API endpoints
│   │   ├── routes/         # Route definitions
│   │   └── middleware/     # Express middleware
│   ├── pipeline/           # Pipeline processing
│   │   ├── github/         # GitHub API integration
│   │   ├── processors/     # Data processors
│   │   └── db/             # Database operations
│   ├── utils/              # Utility functions
│   ├── jobs/               # Scheduled jobs
│   └── index.ts            # Entry point
├── dist/                   # Compiled JavaScript
├── node_modules/           # Dependencies
├── package.json            # Dependencies and scripts
└── .env                    # Environment variables
```

## Key Components

### 1. Pipeline Processors

These handle the core data processing tasks:

```typescript
// src/pipeline/processors/repository-processor.ts
import { Octokit } from '@octokit/rest';
import { createClient } from '@supabase/supabase-js';

export class RepositoryProcessor {
  private octokit: Octokit;
  private supabase: ReturnType<typeof createClient>;
  
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  
  async processRepository(owner: string, repo: string) {
    // Fetch repository data from GitHub
    const { data: repoData } = await this.octokit.repos.get({
      owner,
      repo
    });
    
    // Process and store in Supabase
    const { data, error } = await this.supabase
      .from('repositories')
      .upsert({
        id: repoData.id,
        name: repoData.full_name,
        description: repoData.description,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count
      });
      
    if (error) throw error;
    return data;
  }
}
```

### 2. API Routes

Simple endpoints to trigger pipeline jobs and check status:

```typescript
// src/api/routes/pipeline.ts
import express from 'express';
import { RepositoryProcessor } from '../../pipeline/processors/repository-processor';

const router = express.Router();
const repoProcessor = new RepositoryProcessor();

router.post('/process-repository', async (req, res) => {
  try {
    const { owner, repo } = req.body;
    if (!owner || !repo) {
      return res.status(400).json({ error: 'Owner and repo are required' });
    }
    
    const result = await repoProcessor.processRepository(owner, repo);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### 3. Scheduled Jobs

Handle periodic data syncing using a job scheduler:

```typescript
// src/jobs/sync-scheduler.ts
import cron from 'node-cron';
import { RepositoryProcessor } from '../pipeline/processors/repository-processor';

export function setupScheduledJobs() {
  // Process repositories daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    const processor = new RepositoryProcessor();
    const repos = [
      { owner: 'facebook', repo: 'react' },
      { owner: 'vercel', repo: 'next.js' }
      // Add more repositories as needed
    ];
    
    for (const { owner, repo } of repos) {
      try {
        await processor.processRepository(owner, repo);
        console.log(`Processed ${owner}/${repo} successfully`);
      } catch (error) {
        console.error(`Error processing ${owner}/${repo}:`, error);
      }
    }
  });
}
```

## Integration with Next.js

The Next.js frontend doesn't communicate with the Node.js server for routine data access. Instead:

1. The Next.js app directly queries Supabase for all data visualization and display
2. For pipeline triggers or status checks, the frontend can optionally call the Node.js API endpoints

```typescript
// Example of Next.js directly querying Supabase
// (This code would live in the Next.js application, not the Node.js server)

async function getRepositories() {
  const { data, error } = await supabase
    .from('repositories')
    .select('*')
    .order('stars', { ascending: false });
    
  if (error) throw error;
  return data;
}
```

## Deployment on Heroku

The server is designed to be deployed on Heroku with minimal configuration:

1. **Procfile**:
   ```
   web: npm start
   ```

2. **Environment Variables** configured in Heroku dashboard:
   - `GITHUB_TOKEN`: For GitHub API access
   - `SUPABASE_URL`: Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for database operations
   - `PORT`: Set automatically by Heroku

3. **Resource Requirements**:
   - Standard 1X dyno for basic processing needs
   - Additional worker dyno for background processing (optional)

## Conclusion

This simplified Node.js server architecture focuses solely on running the data pipeline processes. By having the Next.js frontend communicate directly with Supabase for data retrieval, we maintain a clean separation of concerns:

- **Node.js Server**: Handles data processing pipeline and GitHub API integration
- **Next.js Frontend**: Manages UI rendering and data visualization 
- **Supabase**: Serves as the central data store accessed directly by the frontend

This architecture reduces complexity and leverages Heroku for simple deployment and scaling.
