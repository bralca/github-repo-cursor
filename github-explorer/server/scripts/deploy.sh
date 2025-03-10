#!/bin/bash
set -e  # Exit on any error

# Configuration
DOCKER_IMG="github-explorer-server"
ENV_FILE=".env"
APP_NAME="github-explorer-pipeline"
DEPLOY_ENV=${1:-staging}  # Default to staging if no environment provided

# Enable colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Deploying to ${DEPLOY_ENV} environment...${NC}"

# Validate environment
if [[ ! "$DEPLOY_ENV" =~ ^(staging|production)$ ]]; then
  echo -e "${RED}Invalid environment: ${DEPLOY_ENV}. Must be 'staging' or 'production'${NC}"
  exit 1
fi

# Check for required environment variables
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: ${ENV_FILE} file not found.${NC}"
  echo -e "Please create ${ENV_FILE} before deployment. See .env.example for template."
  exit 1
fi

# Source env file
source $ENV_FILE

# Build the application
echo -e "${GREEN}Building application...${NC}"
npm ci
npm run build:prod

# Run tests
echo -e "${GREEN}Running tests...${NC}"
npm test

# Build Docker image
echo -e "${GREEN}Building Docker image...${NC}"
docker build -t $DOCKER_IMG:$DEPLOY_ENV .

# Tag with date for versioning
DATE_TAG=$(date +%Y%m%d_%H%M%S)
docker tag $DOCKER_IMG:$DEPLOY_ENV $DOCKER_IMG:$DEPLOY_ENV-$DATE_TAG

echo -e "${GREEN}Docker image built and tagged: ${DOCKER_IMG}:${DEPLOY_ENV}-${DATE_TAG}${NC}"

# Push to container registry (example)
# echo -e "${GREEN}Pushing to container registry...${NC}"
# docker push $DOCKER_IMG:$DEPLOY_ENV
# docker push $DOCKER_IMG:$DEPLOY_ENV-$DATE_TAG

# If using a cloud provider, deploy with their CLI (examples below)
case $DEPLOY_ENV in
  staging)
    echo -e "${GREEN}Deploying to staging environment...${NC}"
    # Example for Railway:
    # railway up --environment staging
    
    # Example for Render:
    # render deploy --service $APP_NAME-staging
    ;;
    
  production)
    echo -e "${YELLOW}Deploying to PRODUCTION environment!${NC}"
    read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${RED}Deployment aborted.${NC}"
      exit 0
    fi
    
    # Example for Railway:
    # railway up --environment production
    
    # Example for Render:
    # render deploy --service $APP_NAME-production
    ;;
esac

# Health check after deployment
echo -e "${GREEN}Performing health check...${NC}"
# This would be replaced with actual health check logic
# For example: curl -f https://api-${DEPLOY_ENV}.github-explorer.example.com/health

echo -e "${GREEN}Deployment to ${DEPLOY_ENV} completed successfully!${NC}" 