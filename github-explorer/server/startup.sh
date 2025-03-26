#!/bin/bash

# Get the current date and time for logging
current_datetime=$(date '+%Y-%m-%d %H:%M:%S')

# Log function
log() {
  echo "[$current_datetime] $1"
}

# Get environment variable or use default
ENV=${NODE_ENV:-""}
log "Running in environment: $ENV"

# Set sitemap base URL based on environment
if [ "$ENV" == "production" ]; then
  export SITEMAP_BASE_URL="https://github-explorer.onrender.com"
  log "Setting SITEMAP_BASE_URL for production: $SITEMAP_BASE_URL"
elif [ -n "$SITEMAP_BASE_URL" ]; then
  log "Using provided SITEMAP_BASE_URL: $SITEMAP_BASE_URL"
else
  export SITEMAP_BASE_URL="http://localhost:3000"
  log "Setting default SITEMAP_BASE_URL: $SITEMAP_BASE_URL"
fi

# Default database directory path
DEFAULT_DB_DIR="./db"

# Log the database path from environment variables
log "Database path: $DB_PATH"

# If DB_PATH is not set, use the default directory
if [ -z "$DB_PATH" ]; then
  log "DB_PATH not set, using default server/db directory"
  
  # Create the database directory if it doesn't exist
  if [ ! -d "$DEFAULT_DB_DIR" ]; then
    mkdir -p "$DEFAULT_DB_DIR"
    log "Created database directory: $DEFAULT_DB_DIR"
  fi
fi

# Look for init-db.js script
INIT_DB_SCRIPT="scripts/init-db.js"
log "Looking for init-db.js at: $(pwd)/$INIT_DB_SCRIPT"
log "Absolute path (if available): $(realpath "$INIT_DB_SCRIPT" 2>/dev/null || echo 'N/A')"
log "Current directory: $(pwd)"

# Initialize the database if needed
if [ -f "$INIT_DB_SCRIPT" ]; then
  log "Found init-db.js at $(pwd)/$INIT_DB_SCRIPT"
  log "Initializing database using: $(pwd)/$INIT_DB_SCRIPT"
  node "$INIT_DB_SCRIPT"
  
  # Check if database initialization was successful
  if [ $? -eq 0 ]; then
    log "Database initialization successful"
  else
    log "Database initialization failed"
    exit 1
  fi
else
  log "init-db.js script not found at $(pwd)/$INIT_DB_SCRIPT"
  log "Continuing without database initialization"
fi

# Validate database structure
node scripts/validate-db.js

# Check if validation was successful
if [ $? -eq 0 ]; then
  log "Database validation successful"
else
  log "Database validation failed"
  exit 1
fi

# Run the sitemap generation script if it exists
SITEMAP_SCRIPT="scripts/generate-sitemap.js"
if [ -f "$SITEMAP_SCRIPT" ]; then
  log "Found generate-sitemap.js at $(pwd)/$SITEMAP_SCRIPT"
  log "Running sitemap generation script: $(pwd)/$SITEMAP_SCRIPT"
  node "$SITEMAP_SCRIPT"
  
  # Check if sitemap generation was successful
  if [ $? -eq 0 ]; then
    log "Sitemap generation completed successfully."
  else
    log "Sitemap generation failed."
    # Don't exit on sitemap generation failure, just continue
  fi
else
  log "Sitemap generation script not found, skipping."
fi

# Run server setup script if it exists
SETUP_SCRIPT="scripts/server-setup.js"
if [ -f "$SETUP_SCRIPT" ]; then
  log "Found server-setup.js at $(pwd)/$SETUP_SCRIPT"
  log "Running server setup script: $(pwd)/$SETUP_SCRIPT"
  node "$SETUP_SCRIPT"
  
  # Check if server setup was successful
  if [ $? -eq 0 ]; then
    log "Server setup completed successfully."
  else
    log "Server setup failed."
    # Don't exit on setup failure, just continue
  fi
else
  log "Server setup script not found, skipping."
fi

# Start the server
log "Starting server..."
node src/server.js 