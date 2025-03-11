# GitHub Explorer Server

A Node.js server for the GitHub Explorer application. This server is responsible for fetching data from the GitHub API, processing it, and storing it in a Supabase database.

## Features

- Fetch repository data from GitHub API
- Fetch contributor data from GitHub API
- Fetch pull request data from GitHub API
- Fetch commit data from GitHub API
- Process and transform GitHub data
- Store transformed data in Supabase

## Prerequisites

- Node.js 18.0.0 or higher
- GitHub Personal Access Token
- Supabase account with project setup

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your credentials
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with auto-reload
- `npm test` - Run test suite
- `npm run test:github-api` - Test GitHub API client

## API Endpoints

### GitHub Data

- `GET /github/repos/:owner/:repo` - Get repository details
- `GET /github/repos/:owner/:repo/contributors` - Get repository contributors
- `GET /github/repos/:owner/:repo/pulls` - Get repository pull requests
- `GET /github/repos/:owner/:repo/commits` - Get repository commits
- `GET /github/rate-limit` - Get GitHub API rate limit information

### System

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health status

## Environment Variables

The server requires the following environment variables:

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development, production, test)
- `GITHUB_TOKEN` - GitHub Personal Access Token
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase API key (anon)
- `SUPABASE_SERVICE_KEY` - Supabase service role key

## Architecture

This server follows a modular architecture:

- `src/index.js` - Main entry point
- `src/controllers/` - Request handlers
- `src/routes/` - API routes
- `src/services/` - Business logic
- `src/utils/` - Utility functions
- `src/middleware/` - Express middleware
- `src/config/` - Configuration files

## Deployment

This server is designed for easy deployment to Heroku. See [HEROKU-DEPLOYMENT.md](./HEROKU-DEPLOYMENT.md) for detailed instructions.

Basic deployment steps:

1. Create a Heroku app
2. Set environment variables
3. Deploy using Git

```bash
heroku create
heroku config:set GITHUB_TOKEN=your_token
git push heroku main
```

## License

MIT 