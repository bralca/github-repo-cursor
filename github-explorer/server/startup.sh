#!/bin/bash

# GitHub Explorer Server Startup Script
# This script initializes the database and then starts the server

# Display current environment
echo "Running in environment: $NODE_ENV"
echo "Database path: $DB_PATH"

# Set default DB directory path if not provided
if [ -z "$DB_PATH" ]; then
  echo "DB_PATH not set, using default server/db directory"
  export DB_PATH="./db/github_explorer.db"
fi

# Create database directory if it doesn't exist
mkdir -p ./db
echo "Created database directory: ./db"

# Initialize the database
echo "Initializing database..."
node scripts/init-db.js
DB_INIT_RESULT=$?

# Check if database initialization was successful
if [ $DB_INIT_RESULT -ne 0 ]; then
    echo "Database initialization failed with code $DB_INIT_RESULT! Exiting..."
    exit 1
fi

echo "Database initialization successful"

# Start the server
echo "Starting server..."
exec node src/server.js 