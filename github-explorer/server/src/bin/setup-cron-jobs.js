#!/usr/bin/env node

/**
 * Setup Cron Jobs Executable
 * 
 * This script executes the setup-required-cron-jobs.js script which sets up
 * all the required cron jobs for the GitHub Explorer application:
 * 
 * 1. Pulling closed Merge Requests (every minute)
 * 2. Extracting Entities (every minute)
 * 3. Enriching Entities (every 5 minutes)
 * 4. Generating Sitemap (every hour)
 * 5. Generating Developer Rankings (every 10 minutes)
 */

import '../scripts/setup-required-cron-jobs.js'; 