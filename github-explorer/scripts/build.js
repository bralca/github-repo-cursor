#!/usr/bin/env node

// This is a custom build script to handle production builds in Render

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting custom build process for Render deployment...');

// Clean up old build files
console.log('Cleaning up old build files...');
try {
  if (fs.existsSync(path.join(process.cwd(), '.next'))) {
    execSync('rm -rf .next', { stdio: 'inherit' });
  }
} catch (error) {
  console.log('Warning: Could not clean .next directory');
}

// Set environment variables to skip Husky
process.env.HUSKY = '0';

// Make sure we force dev dependencies to be installed
console.log('Checking .npmrc configuration...');
try {
  const npmrcPath = path.join(process.cwd(), '.npmrc');
  if (!fs.existsSync(npmrcPath)) {
    fs.writeFileSync(npmrcPath, 'omit=\nignore-scripts=false\nhusky.enabled=false\n');
    console.log('Created .npmrc file to ensure dev dependencies are installed');
  }
} catch (error) {
  console.log('Warning: Could not create .npmrc file', error);
}

// Verify paths in tsconfig
console.log('Verifying path configuration...');
try {
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  
  if (!tsconfig.compilerOptions.paths || !tsconfig.compilerOptions.paths['@/*']) {
    console.log('Updating path configuration in tsconfig.json...');
    tsconfig.compilerOptions.paths = tsconfig.compilerOptions.paths || {};
    tsconfig.compilerOptions.paths['@/*'] = ['./*'];
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  } else {
    console.log('Path configuration looks good:', tsconfig.compilerOptions.paths);
  }
} catch (error) {
  console.log('Warning: Could not verify tsconfig.json paths', error);
}

// Run the actual Next.js build
console.log('Running Next.js build...');
try {
  execSync('next build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 