# Deploying to Heroku

This guide provides steps to deploy the GitHub Explorer server to Heroku.

## Prerequisites

1. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
2. Heroku account
3. Git repository with your code

## Deployment Steps

### 1. Login to Heroku

```bash
heroku login
```

### 2. Create a Heroku application

```bash
# Navigate to the server directory
cd github-explorer/server

# Create a new Heroku app
heroku create github-explorer-server
```

### 3. Configure environment variables

Set all required environment variables in Heroku:

```bash
heroku config:set NODE_ENV=production
heroku config:set CORS_ORIGIN=https://your-frontend-url.vercel.app
heroku config:set GITHUB_TOKEN=your_github_token
# Add any additional environment variables needed
```

### 4. Deploy to Heroku

```bash
# Deploy the server subdirectory to Heroku
git subtree push --prefix github-explorer/server heroku main
```

If you're deploying from a subdirectory, you might need to use:

```bash
git push heroku `git subtree split --prefix github-explorer/server main`:main --force
```

### 5. Verify deployment

```bash
# Open the deployed application
heroku open

# Check logs to ensure everything is working
heroku logs --tail
```

## Connecting with the Frontend

1. After deploying, note your Heroku URL (e.g., `https://github-explorer-server.herokuapp.com`)
2. Update your frontend environment variables to point to this URL
3. Deploy your frontend to Vercel

## Troubleshooting

- **Build Failures**: Check Heroku logs with `heroku logs --tail`
- **Connection Issues**: Verify CORS settings match your frontend URL
- **Rate Limits**: Check GitHub API rate limit issues in logs

## Scaling (When Needed)

For a simple MVP, the free or hobby tier should be sufficient. When needed:

```bash
# Scale to a paid dyno
heroku ps:scale web=1:standard-1x

# Add a database add-on if needed
heroku addons:create heroku-postgresql:hobby-dev
``` 