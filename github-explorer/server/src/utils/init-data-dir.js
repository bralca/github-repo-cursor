const fs = require('fs');
const path = require('path');
const { getDbDirectory } = require('./db-path');

function initializeDataDirectory() {
  const dataDir = getDbDirectory();
  
  try {
    // Check if directory exists
    if (!fs.existsSync(dataDir)) {
      // Create directory recursively
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`Created data directory: ${dataDir}`);
    } else {
      console.log(`Data directory already exists: ${dataDir}`);
    }
  } catch (error) {
    console.error(`Failed to create data directory: ${error.message}`);
    throw error;
  }
}

module.exports = { initializeDataDirectory }; 