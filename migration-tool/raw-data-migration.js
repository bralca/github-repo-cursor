// raw-data-migration.js
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Ensure required env variables are set
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file');
  process.exit(1);
}

if (!process.env.PG_HOST || !process.env.PG_DATABASE || !process.env.PG_USER) {
  console.error('Error: PostgreSQL connection details must be set in .env file');
  process.exit(1);
}

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// PostgreSQL connection
const pgPool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  ssl: process.env.PG_SSL === 'true' ? true : false
});

// Migration state tracking
const stateFile = path.join(__dirname, 'migration-state.json');
let migrationState = { 
  lastProcessedPage: 0, 
  totalMigrated: 0,
  startTime: null,
  lastUpdateTime: null
};

// Load migration state if exists
function loadMigrationState() {
  try {
    if (fs.existsSync(stateFile)) {
      const data = fs.readFileSync(stateFile, 'utf8');
      migrationState = JSON.parse(data);
      console.log(`Loaded migration state: Last processed page ${migrationState.lastProcessedPage}, Total migrated: ${migrationState.totalMigrated}`);
    } else {
      migrationState.startTime = new Date().toISOString();
      saveMigrationState();
      console.log('Created new migration state');
    }
  } catch (err) {
    console.error('Error loading migration state:', err);
    process.exit(1);
  }
}

// Save migration state
function saveMigrationState() {
  migrationState.lastUpdateTime = new Date().toISOString();
  try {
    fs.writeFileSync(stateFile, JSON.stringify(migrationState, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving migration state:', err);
  }
}

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
  const PAGE_SIZE = 50; // Smaller batch size to avoid memory issues
  let currentPage = migrationState.lastProcessedPage;
  let totalMigrated = migrationState.totalMigrated;
  let hasMore = true;
  
  // Process in pages to avoid memory issues
  while (hasMore) {
    console.log(`Processing page ${currentPage + 1}, records ${totalMigrated + 1}-${totalMigrated + PAGE_SIZE} of ${count}`);
    
    // Fetch page from Supabase
    const { data: rawData, error } = await supabase
      .from('github_raw_data')
      .select('*')
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);
      
    if (error) {
      console.error(`Error fetching page ${currentPage + 1}:`, error);
      currentPage++;
      migrationState.lastProcessedPage = currentPage;
      saveMigrationState();
      continue;
    }
    
    if (!rawData || rawData.length === 0) {
      console.log('No more data to process');
      hasMore = false;
      break;
    }
    
    // Map to the new schema
    const mappedData = rawData.map(record => ({
      entity_type: record.entity_type,
      github_id: String(record.github_id), // Ensure github_id is stored as text
      data: record.data,
      fetched_at: record.fetched_at,
      api_endpoint: record.api_endpoint,
      etag: record.etag,
      created_at: record.created_at || new Date()
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
    migrationState.lastProcessedPage = currentPage;
    migrationState.totalMigrated = totalMigrated;
    saveMigrationState();
    
    // Add a delay to prevent overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if we've reached the end
    if (totalMigrated >= count) {
      console.log('All records processed');
      hasMore = false;
    }
  }
  
  console.log(`Migration completed. Migrated ${totalMigrated} of ${count} records`);
  return totalMigrated;
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
    console.log(`Migration completion: ${(pgCount / supabaseCount * 100).toFixed(2)}%`);
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
      [record.entity_type, String(record.github_id)]
    );
    
    if (pgSampleResult.rows.length === 0) {
      console.error(`Record not found in PostgreSQL: ${record.entity_type}/${record.github_id}`);
    } else {
      console.log(`✓ Record verified: ${record.entity_type}/${record.github_id}`);
    }
  }
}

// Connection test function
async function testConnections() {
  console.log('Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('github_raw_data').select('count(*)', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✓ Supabase connection successful');
  } catch (error) {
    console.error('✗ Supabase connection failed:', error.message);
    return false;
  }
  
  console.log('Testing PostgreSQL connection...');
  try {
    const client = await pgPool.connect();
    try {
      await client.query('SELECT NOW()');
      console.log('✓ PostgreSQL connection successful');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('✗ PostgreSQL connection failed:', error.message);
    return false;
  }
  
  return true;
}

// Execute migration and verification
async function runMigration() {
  try {
    // Load migration state
    loadMigrationState();
    
    // Test connections first
    if (!await testConnections()) {
      console.error('Aborting migration due to connection failures');
      process.exit(1);
    }
    
    // Run schema verification
    try {
      const schemaCheck = await pgPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'github_raw_data'
        )
      `);
      
      if (!schemaCheck.rows[0].exists) {
        console.error('Error: github_raw_data table does not exist in PostgreSQL');
        console.log('Please run the setup-github-raw-data.sql script first');
        process.exit(1);
      }
      
      console.log('✓ Found github_raw_data table in PostgreSQL');
    } catch (error) {
      console.error('Error checking for github_raw_data table:', error);
      process.exit(1);
    }
    
    // Start migration
    const migratedCount = await migrateGithubRawData();
    
    // Verify migration
    await verifyMigration();
    
    // Final report
    const endTime = new Date();
    const startTime = new Date(migrationState.startTime);
    const durationMinutes = (endTime - startTime) / (1000 * 60);
    
    console.log('\nMigration Summary:');
    console.log(`Total records migrated: ${migratedCount}`);
    console.log(`Duration: ${durationMinutes.toFixed(2)} minutes`);
    console.log(`Average rate: ${(migratedCount / durationMinutes).toFixed(2)} records/minute`);
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