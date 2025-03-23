#!/bin/bash

# Render.com startup script for GitHub Explorer Server

# Set environment variables (these would be defined in Render dashboard)
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}
export DB_PATH=${DB_PATH:-/var/data/github_explorer/github_explorer.db}
export DATA_DIR=${DATA_DIR:-/var/data/github_explorer}

# Print environment information
echo "Starting GitHub Explorer Server"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DB_PATH: $DB_PATH"
echo "DATA_DIR: $DATA_DIR"

# Ensure data directory exists
echo "Ensuring data directory exists: $DATA_DIR"
mkdir -p "$DATA_DIR"
if [ $? -ne 0 ]; then
  echo "ERROR: Failed to create data directory: $DATA_DIR"
  echo "This could be due to a disk mounting issue in Render.com"
  
  # Check if directory exists despite error
  if [ ! -d "$DATA_DIR" ]; then
    echo "Directory does not exist. Exiting."
    exit 1
  fi
fi

# Check if we can write to the directory
echo "Testing write permissions on data directory"
touch "$DATA_DIR/.write-test"
if [ $? -ne 0 ]; then
  echo "ERROR: Cannot write to data directory: $DATA_DIR"
  echo "Check permissions or disk mount configuration in Render.com"
  exit 1
else
  echo "Successfully wrote to data directory"
  rm "$DATA_DIR/.write-test"
fi

# Start the server
echo "Starting Node.js server"
cd /opt/render/project/src && npm start 