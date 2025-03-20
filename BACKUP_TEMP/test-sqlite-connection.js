// test-sqlite-connection.js - Test the SQLite database connection and data retrieval
import dotenv from 'dotenv';
import { getSQLiteDb, getDb, fetchGithubRawData, queryGithubRawData, closeDb } from './lib/database.js';

// Load environment variables
dotenv.config();

async function testDatabase() {
  try {
    console.log("Testing database connection...");
    console.log(`Database type: ${process.env.DB_TYPE}`);
    console.log(`Database path: ${process.env.DB_PATH}`);
    
    // Get database connection
    const db = await getDb();
    console.log("Database connection successful!");

    // Test querying the raw data
    console.log("\nQuerying github_raw_data table...");
    try {
      // Count records in the table
      const countResult = await db.get('SELECT COUNT(*) as count FROM github_raw_data');
      console.log(`Total records: ${countResult.count}`);

      // Get a sample of records
      console.log("\nRetrieving 5 sample records...");
      const rows = await db.all('SELECT id, json_extract(data, "$.repository.name") as repo_name FROM github_raw_data LIMIT 5');
      
      if (rows && rows.length > 0) {
        console.log("Sample records retrieved:");
        rows.forEach((row, index) => {
          console.log(`[${index + 1}] ID: ${row.id}, Repository Name: ${row.repo_name}`);
        });
      } else {
        console.log("No records found in the github_raw_data table.");
      }
    } catch (error) {
      console.error(`Error querying the database: ${error.message}`);
    }

    // Close the connection when done
    await closeDb();
    console.log("\nDatabase connection closed.");
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
  }
}

// Run the test
testDatabase(); 