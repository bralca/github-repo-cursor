// Simple test runner script
// Run with: node run-tests.js

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// List of test directories to run
const testDirectories = [
  'navigation',
  'seo'
];

// Function to find all test files in a directory
function findTestFiles(directory) {
  const dirPath = path.join(__dirname, directory);
  return fs.readdirSync(dirPath)
    .filter(file => file.endsWith('.test.js'))
    .map(file => path.join(dirPath, file));
}

// Function to run a test file
function runTestFile(filePath) {
  return new Promise((resolve, reject) => {
    console.log(`\nRunning test: ${path.basename(filePath)}`);
    console.log('-'.repeat(40));
    
    exec(`node "${filePath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running ${path.basename(filePath)}:`);
        console.error(stdout);
        console.error(stderr);
        return reject(error);
      }
      
      console.log(stdout);
      if (stderr) {
        console.error(stderr);
      }
      
      resolve();
    });
  });
}

// Main function to run all tests
async function runAllTests() {
  console.log('Starting tests...');
  console.log('='.repeat(40));
  
  let allTestsPassed = true;
  let totalTests = 0;
  
  for (const directory of testDirectories) {
    const testFiles = findTestFiles(directory);
    totalTests += testFiles.length;
    
    console.log(`\nRunning tests in ${directory} directory (${testFiles.length} files):`);
    console.log('='.repeat(40));
    
    for (const testFile of testFiles) {
      try {
        await runTestFile(testFile);
      } catch (error) {
        allTestsPassed = false;
      }
    }
  }
  
  console.log('\n\nTest Summary:');
  console.log('='.repeat(40));
  console.log(`Total test files: ${totalTests}`);
  
  if (allTestsPassed) {
    console.log('\nResult: ✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('\nResult: ❌ Some tests failed.');
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
}); 