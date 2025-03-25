#!/bin/bash

# Simple script to restore test files after build

echo "Restoring test files after build..."

# Restore test files from temporary directory
if [ -f ".tmp-test-files/test-database-queries.ts" ]; then
  mkdir -p test-utils
  mv .tmp-test-files/test-database-queries.ts test-utils/
  echo "Restored test-database-queries.ts"
fi

# Clean up temp directory
rm -rf .tmp-test-files

echo "Restoration complete!" 