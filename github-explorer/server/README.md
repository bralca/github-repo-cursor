# GitHub Explorer Server

This is the server component of the GitHub Explorer application, responsible for processing GitHub data and providing analytics.

## Architecture

The server is built with a modular pipeline architecture that processes GitHub data through various stages:

1. **Entity Extraction**: Extracts entities like repositories, contributors, merge requests, and commits from GitHub webhook data.
2. **Data Enrichment**: Enriches extracted entities with additional data from the GitHub API.
3. **Repository Processing**: Computes statistics and metrics for repositories, including commit frequency, star history, fork statistics, contributor counts, and language breakdown.
4. **Database Writing**: Persists processed data to the Supabase database.

## Key Components

### Pipeline Core

- **Pipeline Factory**: Manages pipeline registration and execution.
- **Base Stage**: Abstract base class for all pipeline stages.

### Pipeline Processors

- **Entity Extractor**: Extracts entities from GitHub webhook data.
- **Data Enricher**: Enriches entities with additional data.
- **Repository Processor**: Computes repository statistics and metrics.
- **Database Writer**: Writes processed data to the database.

### Pipeline Stages

- **Webhook Processor Pipeline**: Processes GitHub webhook data.
- **Repository Processor Pipeline**: Processes repository data to compute statistics.

## Repository Processor

The Repository Processor is responsible for computing various statistics and metrics for GitHub repositories:

- **Commit Frequency**: Analyzes commit patterns to determine daily, weekly, and monthly averages, as well as distribution by weekday.
- **Star History**: Tracks star growth over time and calculates growth rates.
- **Fork Statistics**: Analyzes fork activity and calculates fork-to-star ratio.
- **Contributor Counts**: Tracks contributor activity and identifies core contributors.
- **Language Breakdown**: Analyzes the distribution of programming languages in the repository.
- **Health Score**: Calculates an overall health score based on various metrics.

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/github-explorer.git

# Navigate to the server directory
cd github-explorer/server

# Install dependencies
npm install

# Create a .env file with the following variables
GITHUB_TOKEN=your_github_token
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
PORT=3001
```

### Running the Server

```bash
# Start the server
npm start

# Start the server in development mode
npm run dev
```

### Testing

```bash
# Run the pipeline test
npm test

# Test the repository processor
npm run test:repo
```

## API Endpoints

- `GET /health`: Health check endpoint
- `POST /api/webhooks/github`: Webhook endpoint for GitHub events
- `POST /api/repositories/:id/process`: Process a repository to compute statistics

## Environment Variables

- `GITHUB_TOKEN`: GitHub API token for authentication
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase API key
- `PORT`: Server port (default: 3001)
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

## License

MIT 