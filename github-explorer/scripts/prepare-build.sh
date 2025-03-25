#!/bin/bash

# Simple script to move test files before build
# This ensures they won't be included in type checking

echo "Moving test files before build..."

# Create a temporary holding directory
mkdir -p .tmp-test-files

# Move problematic test files
if [ -f "test-utils/test-database-queries.ts" ]; then
  mv test-utils/test-database-queries.ts .tmp-test-files/
  echo "Moved test-database-queries.ts"
fi

echo "Preparation complete!" 