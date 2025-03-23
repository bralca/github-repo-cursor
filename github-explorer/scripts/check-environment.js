#!/usr/bin/env node

/**
 * Environment Configuration Checker
 * 
 * This script checks essential environment variables and 
 * provides diagnostic information about the setup.
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env file
dotenv.config({ path: path.join(rootDir, '.env') });

console.log('════════════════════════════════════════════');
console.log('GITHUB EXPLORER ENVIRONMENT CONFIGURATION CHECK');
console.log('════════════════════════════════════════════');
console.log();

// Check system information
console.log('SYSTEM INFORMATION:');
console.log(`Platform: ${os.platform()}`);
console.log(`Node.js Version: ${process.version}`);
console.log(`Working Directory: ${process.cwd()}`);
console.log();

// Check essential environment variables
console.log('ENVIRONMENT VARIABLES:');
const requiredVars = [
  'NODE_ENV',
  'DB_PATH',
  'PIPELINE_SERVER_URL',
  'GITHUB_TOKEN',
  'GITHUB_API_URL',
  'PORT',
  'CORS_ORIGIN'
];

const warnings = [];
const errors = [];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    errors.push(`${varName} is not set!`);
    console.log(`❌ ${varName}: Not set`);
  } else {
    // Mask tokens and keys for security
    if (varName.includes('TOKEN') || varName.includes('KEY')) {
      console.log(`✅ ${varName}: ${value.substring(0, 5)}...${value.substring(value.length - 5)}`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  }
});

// Check data directory
console.log();
console.log('DATA DIRECTORY:');
const dbPath = process.env.DB_PATH || './data/github_explorer.db';
const dbDir = path.dirname(dbPath);

try {
  if (!fs.existsSync(dbDir)) {
    console.log(`❌ Directory does not exist: ${dbDir}`);
    errors.push(`Database directory does not exist: ${dbDir}`);
  } else if (!fs.accessSync(dbDir, fs.constants.W_OK)) {
    console.log(`✅ Directory exists and is writable: ${dbDir}`);
  } else {
    console.log(`⚠️ Directory exists but may not be writable: ${dbDir}`);
    warnings.push(`Database directory might not be writable: ${dbDir}`);
  }
} catch (err) {
  console.log(`❌ Error checking data directory: ${err.message}`);
  errors.push(`Error checking data directory: ${err.message}`);
}

// Check server connectivity
console.log();
console.log('SERVER CONNECTIVITY:');
const serverUrl = process.env.PIPELINE_SERVER_URL;
if (!serverUrl) {
  console.log('❌ PIPELINE_SERVER_URL is not set, cannot check connectivity');
  errors.push('PIPELINE_SERVER_URL is not set');
} else {
  console.log(`⏳ Checking connectivity to ${serverUrl}...`);
  
  // In a real script, we'd do a fetch() call to test connectivity
  // But for simplicity, we'll just print instructions
  console.log(`ℹ️ To test connectivity, run: curl ${serverUrl}/api/health`);
}

// Check for both development and production configs
console.log();
console.log('CONFIGURATION FILES:');
const envFiles = [
  { name: '.env', path: path.join(rootDir, '.env') },
  { name: '.env.local', path: path.join(rootDir, '.env.local') },
  { name: '.env.production', path: path.join(rootDir, '.env.production') }
];

envFiles.forEach(file => {
  if (fs.existsSync(file.path)) {
    console.log(`✅ ${file.name} exists`);
  } else {
    console.log(`❌ ${file.name} does not exist`);
    if (file.name === '.env') {
      errors.push('.env file is missing');
    } else {
      warnings.push(`${file.name} file is missing`);
    }
  }
});

// Summary
console.log();
console.log('════════════════════════════════════════════');
console.log('SUMMARY:');
if (errors.length > 0) {
  console.log('\nERRORS:');
  errors.forEach(err => console.log(`❌ ${err}`));
}

if (warnings.length > 0) {
  console.log('\nWARNINGS:');
  warnings.forEach(warn => console.log(`⚠️ ${warn}`));
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! Environment appears to be correctly configured.');
} else if (errors.length === 0) {
  console.log('⚠️ Environment configuration has warnings but no critical errors.');
} else {
  console.log('❌ Environment configuration has errors that need to be fixed.');
}
console.log('════════════════════════════════════════════'); 