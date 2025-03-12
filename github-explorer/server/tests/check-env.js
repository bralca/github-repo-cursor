import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the .env file - go up one directory
const envPath = path.resolve(__dirname, '..', '.env');

console.log(`Environment file path: ${envPath}`);
console.log(`File exists: ${fs.existsSync(envPath)}`);

// Load environment variables from the specified path
dotenv.config({ path: envPath });

// Log the environment variables we're interested in
console.log({
  SUPABASE_URL: process.env.SUPABASE_URL ? 'defined' : 'undefined',
  SUPABASE_KEY: process.env.SUPABASE_KEY ? 'defined' : 'undefined',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'defined' : 'undefined',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'defined' : 'undefined',
  GITHUB_API_TOKEN: process.env.GITHUB_API_TOKEN ? 'defined' : 'undefined',
  GITHUB_TOKEN: process.env.GITHUB_TOKEN ? 'defined' : 'undefined',
  NODE_ENV: process.env.NODE_ENV
});

// If the file exists, print its first few lines (without exposing all secrets)
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  console.log('\nEnvironment file preview (variable names only):');
  envLines.forEach(line => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || line.trim() === '') return;
    
    // Extract and print only the variable name, not the value
    const match = line.match(/^([^=]+)=/);
    if (match) {
      console.log(`- ${match[1]} is defined`);
    }
  });
} 