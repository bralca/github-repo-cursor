# GitHub Explorer Server

Node.js pipeline server for the GitHub Explorer application. This server processes GitHub API data and stores it in a database for the frontend to access.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Copy `.env.example` to `.env` and update the values:

- `NODE_ENV`: Environment mode (development, production)
- `PORT`: Port to run the server on
- `GITHUB_TOKEN`: GitHub Personal Access Token
- `CORS_ORIGIN`: Frontend URL for CORS

See `.env.example` for all available options.

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

## API Endpoints

- `GET /health`: Health check endpoint
- `GET /api/v1/health`: Detailed health check
- Additional endpoints coming soon

## Features

- GitHub API data processing
- Rate limiting and resilience
- Structured logging
- Error handling

## License

MIT 