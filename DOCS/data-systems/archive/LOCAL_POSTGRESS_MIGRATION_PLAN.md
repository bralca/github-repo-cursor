# Migration Plan: From Supabase to Local PostgreSQL for Raw GitHub Data

## Overview

This document outlines a focused plan to migrate the `github_raw_data` table from Supabase to a local PostgreSQL database while retaining Supabase for authentication. This targeted approach will simplify our raw data storage and processing pipeline.

## Rationale

Moving the `github_raw_data` table to a local PostgreSQL database offers several advantages:

1. **Direct Control**: Full control over raw data storage and indexing without Supabase abstractions
2. **Simplified Processing**: Direct SQL access for data transformation processes
3. **Performance Optimization**: Ability to fine-tune queries and table configuration for raw data handling
4. **Storage Flexibility**: More control over storage and optimization for large JSON objects

By keeping authentication in Supabase, we maintain a secure, managed authentication system while gaining more control over our data storage.

## Current Table Understanding

The `github_raw_data` table currently stores raw JSON data from the GitHub API:

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| entity_type | text | Type of entity (repository, contributor, etc.) |
| github_id | text | GitHub entity ID |
| data | jsonb | Raw JSON data from GitHub API |
| fetched_at | timestamp | When data was fetched |
| api_endpoint | text | API endpoint used to fetch data |
| etag | text | GitHub API ETag for caching |
| created_at | timestamp | Creation timestamp |

## Migration Plan

### Phase 1: Setup Local PostgreSQL for Raw Data

1. **Infrastructure Setup**:
   - Install PostgreSQL locally for development
   - Set up a dedicated PostgreSQL server for production
   - Configure database access credentials securely

2. **Database Configuration**:
   - Create a new database (or use existing one) for GitHub Explorer
   - Enable necessary PostgreSQL extensions (`uuid-ossp`, etc.)
   - Configure for optimal JSONB performance

3. **Schema Creation**:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- GitHub Raw Data Table
CREATE TABLE github_raw_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL,
    github_id TEXT NOT NULL,
    data JSONB NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    api_endpoint TEXT,
    etag TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_github_entity UNIQUE (entity_type, github_id)
);

-- Create indices for common query patterns
CREATE INDEX idx_github_raw_data_entity_type ON github_raw_data(entity_type);
CREATE INDEX idx_github_raw_data_github_id ON github_raw_data(github_id);
CREATE INDEX idx_github_raw_data_fetched_at ON github_raw_data(fetched_at);
CREATE INDEX idx_github_raw_data_entity_github_id ON github_raw_data(entity_type, github_id);

-- Optional: Create a GIN index for JSONB querying if needed
CREATE INDEX idx_github_raw_data_jsonb ON github_raw_data USING GIN (data jsonb_path_ops);
```

### Phase 2: Data Migration Tool

1. **Create a Focused Migration Utility**:

```javascript
// raw-data-migration.js
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// PostgreSQL connection
const pgPool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
});

// Raw data migration function
async function migrateGithubRawData() {
  console.log('Migrating GitHub raw data...');
  
  // Count records for progress tracking
  const { count, error: countError } = await supabase
    .from('github_raw_data')
    .select('*', { count: 'exact', head: true });
    
  if (countError) {
    console.error('Error counting records:', countError);
    return;
  }
  
  console.log(`Found ${count} records to migrate`);
  
  // Pagination variables
  const PAGE_SIZE = 100;
  let currentPage = 0;
  let totalMigrated = 0;
  let hasMore = true;
  
  // Process in pages to avoid memory issues
  while (hasMore) {
    console.log(`Processing page ${currentPage + 1}, records ${totalMigrated + 1}-${totalMigrated + PAGE_SIZE}`);
    
    // Fetch page from Supabase
    const { data: rawData, error } = await supabase
      .from('github_raw_data')
      .select('*')
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);
      
    if (error) {
      console.error(`Error fetching page ${currentPage + 1}:`, error);
      currentPage++;
      continue;
    }
    
    if (!rawData || rawData.length === 0) {
      hasMore = false;
      break;
    }
    
    // Map to the new schema
    const mappedData = rawData.map(record => ({
      entity_type: record.entity_type,
      github_id: record.github_id,
      data: record.data,
      fetched_at: record.fetched_at,
      api_endpoint: record.api_endpoint,
      etag: record.etag,
      created_at: record.created_at
    }));
    
    try {
      // Begin transaction
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        
        for (const record of mappedData) {
          // Insert each record
          const query = `
            INSERT INTO github_raw_data 
              (entity_type, github_id, data, fetched_at, api_endpoint, etag, created_at)
            VALUES 
              ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (entity_type, github_id) 
            DO UPDATE SET 
              data = EXCLUDED.data,
              fetched_at = EXCLUDED.fetched_at,
              api_endpoint = EXCLUDED.api_endpoint,
              etag = EXCLUDED.etag
            RETURNING id
          `;
          
          const values = [
            record.entity_type,
            record.github_id,
            record.data,
            record.fetched_at,
            record.api_endpoint,
            record.etag,
            record.created_at
          ];
          
          await client.query(query, values);
          totalMigrated++;
        }
        
        await client.query('COMMIT');
        console.log(`Committed ${mappedData.length} records`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in batch, rolled back:', err);
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('Error connecting to PostgreSQL:', err);
    }
    
    currentPage++;
    
    // Optional: Add a delay to prevent overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`Migration completed. Migrated ${totalMigrated} of ${count} records`);
}

// Data verification function
async function verifyMigration() {
  // Count records in both databases and compare
  const { count: supabaseCount, error: supabaseError } = await supabase
    .from('github_raw_data')
    .select('*', { count: 'exact', head: true });
    
  if (supabaseError) {
    console.error('Error counting records in Supabase:', supabaseError);
    return;
  }
  
  // Count in PostgreSQL
  const pgResult = await pgPool.query('SELECT COUNT(*) FROM github_raw_data');
  const pgCount = parseInt(pgResult.rows[0].count);
  
  console.log(`Counts: Supabase=${supabaseCount}, PostgreSQL=${pgCount}`);
  
  // Report discrepancy
  if (supabaseCount !== pgCount) {
    console.warn(`Discrepancy: Supabase has ${supabaseCount}, PostgreSQL has ${pgCount}`);
  } else {
    console.log('Verification successful: Record counts match');
  }
  
  // Sample verification
  const { data: supabaseSample } = await supabase
    .from('github_raw_data')
    .select('entity_type, github_id')
    .limit(5);
    
  console.log('Verifying a sample of records...');
  
  for (const record of supabaseSample) {
    const pgSampleResult = await pgPool.query(
      'SELECT id FROM github_raw_data WHERE entity_type = $1 AND github_id = $2',
      [record.entity_type, record.github_id]
    );
    
    if (pgSampleResult.rows.length === 0) {
      console.error(`Record not found in PostgreSQL: ${record.entity_type}/${record.github_id}`);
    } else {
      console.log(`✓ Record verified: ${record.entity_type}/${record.github_id}`);
    }
  }
}

// Execute migration and verification
async function runMigration() {
  try {
    await migrateGithubRawData();
    await verifyMigration();
    
    console.log('Migration process completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close connections
    await pgPool.end();
  }
}

// Run the migration
runMigration();
```

### Phase 3: Application Updates

1. **Database Connection Management**:

```javascript
// db-client.js
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// PostgreSQL connection for raw data
const pgPool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  max: 20, // Connection pool size
  idleTimeoutMillis: 30000
});

// Supabase connection for other tables and auth
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Export clients for different purposes
module.exports = {
  // For raw data operations
  rawData: pgPool,
  
  // For other data operations and auth
  supabase: supabaseClient
};
```

2. **Raw Data Repository Implementation**:

```javascript
// repositories/github-raw-data-repository.js
const { rawData } = require('../db-client');

class GithubRawDataRepository {
  async findByEntityAndId(entityType, githubId) {
    const query = `
      SELECT * FROM github_raw_data
      WHERE entity_type = $1 AND github_id = $2
    `;
    
    const result = await rawData.query(query, [entityType, githubId]);
    return result.rows[0] || null;
  }
  
  async save(rawDataObject) {
    const query = `
      INSERT INTO github_raw_data 
        (entity_type, github_id, data, fetched_at, api_endpoint, etag)
      VALUES 
        ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (entity_type, github_id) 
      DO UPDATE SET 
        data = EXCLUDED.data,
        fetched_at = EXCLUDED.fetched_at,
        api_endpoint = EXCLUDED.api_endpoint,
        etag = EXCLUDED.etag
      RETURNING *
    `;
    
    const values = [
      rawDataObject.entity_type,
      rawDataObject.github_id,
      rawDataObject.data,
      rawDataObject.fetched_at || new Date(),
      rawDataObject.api_endpoint,
      rawDataObject.etag
    ];
    
    const result = await rawData.query(query, values);
    return result.rows[0];
  }
  
  async findByEntityType(entityType, limit = 100, offset = 0) {
    const query = `
      SELECT * FROM github_raw_data
      WHERE entity_type = $1
      ORDER BY fetched_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await rawData.query(query, [entityType, limit, offset]);
    return result.rows;
  }
  
  async findRecentlyFetched(hours = 24, limit = 100) {
    const query = `
      SELECT * FROM github_raw_data
      WHERE fetched_at > NOW() - INTERVAL '${hours} hours'
      ORDER BY fetched_at DESC
      LIMIT $1
    `;
    
    const result = await rawData.query(query, [limit]);
    return result.rows;
  }
  
  async deleteByEntityAndId(entityType, githubId) {
    const query = `
      DELETE FROM github_raw_data
      WHERE entity_type = $1 AND github_id = $2
      RETURNING id
    `;
    
    const result = await rawData.query(query, [entityType, githubId]);
    return result.rowCount > 0;
  }
}

module.exports = new GithubRawDataRepository();
```

3. **Pipeline Integration**:

```javascript
// pipeline/github-data-fetcher.js
const { Octokit } = require('octokit');
const githubRawDataRepo = require('../repositories/github-raw-data-repository');

class GitHubDataFetcher {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
  }
  
  async fetchAndStoreRepository(owner, repo) {
    try {
      // Fetch repository data from GitHub
      const { data, headers } = await this.octokit.request('GET /repos/{owner}/{repo}', {
        owner,
        repo
      });
      
      // Store in raw data table
      await githubRawDataRepo.save({
        entity_type: 'repository',
        github_id: data.id.toString(), // Store as text
        data: data,
        fetched_at: new Date(),
        api_endpoint: `/repos/${owner}/${repo}`,
        etag: headers.etag
      });
      
      return data;
    } catch (error) {
      console.error(`Error fetching repository ${owner}/${repo}:`, error);
      throw error;
    }
  }
  
  async fetchAndStoreContributor(username) {
    try {
      // Fetch user data from GitHub
      const { data, headers } = await this.octokit.request('GET /users/{username}', {
        username
      });
      
      // Store in raw data table
      await githubRawDataRepo.save({
        entity_type: 'contributor',
        github_id: data.id.toString(), // Store as text
        data: data,
        fetched_at: new Date(),
        api_endpoint: `/users/${username}`,
        etag: headers.etag
      });
      
      return data;
    } catch (error) {
      console.error(`Error fetching contributor ${username}:`, error);
      throw error;
    }
  }
  
  // Other methods for different GitHub entities
}

module.exports = new GitHubDataFetcher();
```

### Phase 4: Testing and Validation

1. **Database Connection Testing**:

```javascript
// test-raw-data-connection.js
const { rawData } = require('./db-client');

async function testRawDataConnection() {
  try {
    const result = await rawData.query('SELECT NOW()');
    console.log('PostgreSQL connection for raw data successful:', result.rows[0]);
    
    // Test table exists
    const tableCheck = await rawData.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'github_raw_data'
      )
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('github_raw_data table exists');
      
      // Get record count
      const countResult = await rawData.query('SELECT COUNT(*) FROM github_raw_data');
      console.log(`Table contains ${countResult.rows[0].count} records`);
    } else {
      console.error('github_raw_data table does not exist');
    }
  } catch (error) {
    console.error('PostgreSQL connection failed:', error);
  } finally {
    // Close pool
    await rawData.end();
  }
}

testRawDataConnection();
```

2. **Data Integrity Validation**:

```javascript
// validate-raw-data.js
const { rawData } = require('./db-client');

async function validateRawData() {
  // Check for NULL values in required fields
  const nullCheck = await rawData.query(`
    SELECT COUNT(*) FROM github_raw_data
    WHERE entity_type IS NULL 
    OR github_id IS NULL 
    OR data IS NULL
  `);
  
  if (parseInt(nullCheck.rows[0].count) > 0) {
    console.error(`Found ${nullCheck.rows[0].count} records with NULL values in required fields`);
  } else {
    console.log('✓ No NULL values in required fields');
  }
  
  // Check for valid JSON in data field
  try {
    const jsonCheck = await rawData.query(`
      SELECT COUNT(*) FROM github_raw_data
      WHERE jsonb_typeof(data) <> 'object'
    `);
    
    if (parseInt(jsonCheck.rows[0].count) > 0) {
      console.error(`Found ${jsonCheck.rows[0].count} records with invalid JSON objects`);
    } else {
      console.log('✓ All data records contain valid JSON objects');
    }
  } catch (error) {
    console.error('Error checking JSON validity:', error);
  }
  
  // Check entity types for consistency
  const entityTypes = await rawData.query(`
    SELECT entity_type, COUNT(*) 
    FROM github_raw_data 
    GROUP BY entity_type
  `);
  
  console.log('Entity type distribution:');
  entityTypes.rows.forEach(row => {
    console.log(`- ${row.entity_type}: ${row.count} records`);
  });
}

validateRawData();
```

### Phase 5: Deployment Strategy

1. **Environment Setup**:
   - Configure environment variables for the PostgreSQL connection
   - Set up separate connection string for the raw data table
   - Implement proper credentials management

2. **Deployment Steps**:
   - Set up PostgreSQL database in production environment
   - Run schema creation scripts
   - Execute the focused data migration utility
   - Verify data integrity in production
   - Update application configuration to use the new database for raw data
   - Deploy updated application

3. **Rollback Plan**:
   - Maintain the Supabase raw data table temporarily
   - Implement feature flags to switch between data sources
   - Keep synchronized data for a transition period

## GitHub API and Raw Data Considerations

When working with the raw GitHub data:

1. **Data Consistency**:
   - Store all GitHub IDs as TEXT regardless of their original type
   - For numeric IDs (like user/repo IDs), convert to string when storing
   - For hash IDs (like commit SHAs), store as-is

2. **JSON Storage Optimization**:
   - Configure PostgreSQL for optimal JSONB performance
   - Consider compression for large datasets
   - Implement proper indexing for frequently queried JSON paths

3. **API Integration**:
   - Use ETags from stored data to optimize GitHub API requests
   - Implement rate limiting management
   - Consider background refresh processes for keeping data current

## Maintenance Plan

1. **Backup Strategy**:
   - Implement regular backups for the raw data
   - Consider point-in-time recovery options
   - Test restore procedures

2. **Performance Monitoring**:
   - Monitor query performance on the raw data table
   - Track disk space usage (raw JSON can grow substantially)
   - Implement cleanup strategies for outdated raw data

3. **Data Retention Policy**:
   - Determine how long to keep raw data
   - Implement archiving or pruning strategies for old data
   - Balance storage needs with data availability requirements

## Conclusion

This focused migration plan provides a clear path to move the `github_raw_data` table from Supabase to a local PostgreSQL database. By migrating only this table, we can:

1. Gain more control over our raw data storage
2. Optimize for the specific needs of storing and querying large JSON objects
3. Maintain integration with Supabase for authentication
4. Simplify our data processing pipeline

This approach minimizes risk by limiting the scope of the migration while providing significant benefits for our GitHub data processing needs.
