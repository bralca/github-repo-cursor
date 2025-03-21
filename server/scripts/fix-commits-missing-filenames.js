// Simple script to fix commits with missing filenames
import dbPath from '../src/utils/db-path.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function main() {
  console.log('Starting to fix commits with missing filenames');
  console.log(`Using database at: ${dbPath}`);
  
  // Connect to database
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  try {
    // Count commits with missing filenames
    const { count } = await db.get('SELECT COUNT(*) as count FROM commits WHERE filename IS NULL');
    console.log(`Found ${count} commits with missing filenames`);
    
    if (count === 0) {
      console.log('No issues to fix. Exiting.');
      return;
    }
    
    // Simple update: Set filename to a default value for tracking purposes
    await db.run(`
      UPDATE commits 
      SET filename = 'data-missing-from-github-api', 
          status = 'unknown',
          is_enriched = 1
      WHERE filename IS NULL
    `);
    
    console.log(`Updated ${count} commits with default filename value`);
    
    // Verify the fix
    const { remaining } = await db.get('SELECT COUNT(*) as remaining FROM commits WHERE filename IS NULL');
    console.log(`Remaining commits with null filenames: ${remaining}`);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    await db.close();
    console.log('Done');
  }
}

main().catch(console.error); 