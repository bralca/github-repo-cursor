import fs from 'fs';
import path from 'path';

// Print current working directory
console.log('Current working directory:', process.cwd());

// Try different paths for finding the source database
const rootPath = path.resolve(process.cwd(), '../..');
const projectPath = path.resolve(process.cwd(), '..');
const currentPath = process.cwd();

console.log('Looking for database in:');
console.log('- Root path:', rootPath);
console.log('- Project path:', projectPath);
console.log('- Current path:', currentPath);

// Check root directory
const rootDbPath = path.resolve(rootPath, 'github_explorer.db');
if (fs.existsSync(rootDbPath)) {
  console.log(`Found database at: ${rootDbPath}`);
  console.log(`Size: ${fs.statSync(rootDbPath).size} bytes`);
}

// Check project directory
const projectDbPath = path.resolve(projectPath, 'github_explorer.db');
if (fs.existsSync(projectDbPath)) {
  console.log(`Found database at: ${projectDbPath}`);
  console.log(`Size: ${fs.statSync(projectDbPath).size} bytes`);
}

// Check current directory
const currentDbPath = path.resolve(currentPath, 'github_explorer.db');
if (fs.existsSync(currentDbPath)) {
  console.log(`Found database at: ${currentDbPath}`);
  console.log(`Size: ${fs.statSync(currentDbPath).size} bytes`);
}

// Define source and target paths - Use the database from the root directory
const sourceDbPath = rootDbPath; // Use the database in the root directory
const targetDbDir = path.resolve(process.cwd(), 'db');
const targetDbPath = path.resolve(targetDbDir, 'github_explorer.db');

console.log('Source database path:', sourceDbPath);
console.log('Target database path:', targetDbPath);

// Create the db directory if it doesn't exist
if (!fs.existsSync(targetDbDir)) {
  console.log(`Creating directory: ${targetDbDir}`);
  fs.mkdirSync(targetDbDir, { recursive: true });
}

// Check if source database exists
if (!fs.existsSync(sourceDbPath)) {
  console.error(`Source database not found at: ${sourceDbPath}`);
  process.exit(1);
}

// Check file size
const sourceSize = fs.statSync(sourceDbPath).size;
console.log(`Source database size: ${sourceSize} bytes`);

if (sourceSize === 0) {
  console.error('Source database is empty (0 bytes). Aborting migration.');
  process.exit(1);
}

// Copy the database file
console.log(`Copying database from ${sourceDbPath} to ${targetDbPath}`);
fs.copyFileSync(sourceDbPath, targetDbPath);

// Verify the copy
if (fs.existsSync(targetDbPath)) {
  const targetSize = fs.statSync(targetDbPath).size;
  console.log(`Target database size: ${targetSize} bytes`);
  
  if (targetSize === sourceSize) {
    console.log('Database migration completed successfully');
  } else {
    console.error(`Target size (${targetSize}) doesn't match source size (${sourceSize})`);
  }
} else {
  console.error('Failed to copy database: Target file not found');
} 