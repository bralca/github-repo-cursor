// Fix-commits quick script
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function main() {
  const dbPath = path.resolve(__dirname, '../..', 'github_explorer.db');
  console.log(`Using database at: ${dbPath}`);
  
  const db = await open({
    filename: dbPath,
    driver: sqlite3.verbose()
  });
  
  const { count } = await db.get('SELECT COUNT(*) as count FROM commits WHERE filename IS NULL');
  console.log(`Found ${count} commits with missing filenames`);
  
  if (count > 0) {
    await db.run(`
      UPDATE commits 
      SET filename = 'data-missing-from-github-api', 
          status = 'unknown',
          is_enriched = 1
      WHERE filename IS NULL
    `);
    console.log(`Updated ${count} commits`);
  }
  
  await db.close();
  console.log('Done');
}

main().catch(console.error); 