// test-connection.js
require('dotenv').config();
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Check environment variables
const missingVars = [];
if (!process.env.PG_HOST) missingVars.push('PG_HOST');
if (!process.env.PG_DATABASE) missingVars.push('PG_DATABASE');
if (!process.env.PG_USER) missingVars.push('PG_USER');
if (!process.env.SUPABASE_URL) missingVars.push('SUPABASE_URL');
if (!process.env.SUPABASE_KEY) missingVars.push('SUPABASE_KEY');

if (missingVars.length > 0) {
  console.error('Error: The following environment variables are missing:');
  missingVars.forEach(v => console.error(`- ${v}`));
  console.error('\nPlease create a .env file based on .env.example');
  process.exit(1);
}

// PostgreSQL connection
const pgPool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  ssl: process.env.PG_SSL === 'true' ? true : false
});

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testPostgresConnection() {
  console.log('\n--- Testing PostgreSQL Connection ---');
  try {
    const client = await pgPool.connect();
    try {
      const res = await client.query('SELECT NOW() as time');
      console.log('✅ PostgreSQL connection successful!');
      console.log(`   Server time: ${res.rows[0].time}`);
      
      // Check if github_raw_data table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'github_raw_data'
        )
      `);
      
      if (tableCheck.rows[0].exists) {
        console.log('✅ github_raw_data table exists');
        
        // Check record count
        const countCheck = await client.query('SELECT COUNT(*) FROM github_raw_data');
        console.log(`   Table contains ${countCheck.rows[0].count} records`);
      } else {
        console.log('❌ github_raw_data table does not exist');
        console.log('   Run the setup-github-raw-data.sql script to create it');
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.log('❌ PostgreSQL connection failed:');
    console.error(`   ${err.message}`);
    if (err.message.includes('password authentication failed')) {
      console.log('\n   Hint: Check your PG_USER and PG_PASSWORD values in .env file');
    } else if (err.message.includes('connect ECONNREFUSED')) {
      console.log('\n   Hint: Make sure PostgreSQL is running and accessible at the specified host/port');
    }
  }
}

async function testSupabaseConnection() {
  console.log('\n--- Testing Supabase Connection ---');
  try {
    // Test auth functionality
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      throw new Error(authError.message);
    }
    
    console.log('✅ Supabase connection successful!');
    
    // Try to select from github_raw_data table
    const { data, error } = await supabase
      .from('github_raw_data')
      .select('count(*)', { count: 'exact', head: true });
      
    if (error) {
      console.log('❌ Error accessing github_raw_data table:');
      console.error(`   ${error.message}`);
      
      if (error.message.includes('does not exist')) {
        console.log('   The github_raw_data table does not exist in Supabase');
      }
    } else {
      console.log(`✅ Successfully connected to github_raw_data table`);
      console.log(`   Table contains ${data} records`);
    }
  } catch (err) {
    console.log('❌ Supabase connection failed:');
    console.error(`   ${err.message}`);
    if (err.message.includes('invalid API key')) {
      console.log('\n   Hint: Check your SUPABASE_URL and SUPABASE_KEY values in .env file');
    }
  }
}

async function runTests() {
  try {
    // Test PostgreSQL
    await testPostgresConnection();
    
    // Test Supabase
    await testSupabaseConnection();
    
    console.log('\n--- Summary ---');
    console.log('Connection tests completed. Please review the results above.');
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    // Close connections
    await pgPool.end();
  }
}

runTests(); 