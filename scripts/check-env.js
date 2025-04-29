#!/usr/bin/env node

/**
 * Environment Variable Checker
 * 
 * This script checks if all required environment variables are properly set.
 * Run it with: node scripts/check-env.js
 */

// Define required environment variables by category
const requiredVars = {
  firebase: [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ],
  firebaseAdmin: [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ],
  alternatives: {
    'FIREBASE_PROJECT_ID': 'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL': 'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY': 'FIREBASE_ADMIN_PRIVATE_KEY',
  }
};

// ANSI color codes for terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

// Check if a variable exists and has a value
function checkVar(name) {
  const value = process.env[name];
  const altName = requiredVars.alternatives[name];
  const altValue = altName ? process.env[altName] : null;
  
  const isPresent = !!value || !!altValue;
  const usedVar = value ? name : (altValue ? altName : null);
  
  return {
    name,
    isPresent,
    usedVar,
    value: isPresent ? (value || altValue) : null,
  };
}

// Check all variables in a category
function checkCategory(category, vars) {
  console.log(`\n${colors.bright}${colors.blue}Checking ${category} variables:${colors.reset}`);
  
  let allPresent = true;
  const results = vars.map(name => {
    const result = checkVar(name);
    if (!result.isPresent) allPresent = false;
    
    return result;
  });
  
  // Display results
  results.forEach(result => {
    if (result.isPresent) {
      const maskedValue = result.value.length > 8 ? 
        `${result.value.substring(0, 5)}...` : 
        '[small value]';
      
      console.log(`${colors.green}✓ ${result.usedVar || result.name}${colors.reset} - Present (${maskedValue})`);
    } else {
      console.log(`${colors.red}✗ ${result.name}${colors.reset} - Missing`);
      
      // Check for alternative
      const altName = requiredVars.alternatives[result.name];
      if (altName) {
        console.log(`  ${colors.yellow}Alternative: ${altName} - Also missing${colors.reset}`);
      }
    }
  });
  
  // Category summary
  if (allPresent) {
    console.log(`${colors.green}All ${category} variables are present!${colors.reset}`);
  } else {
    console.log(`${colors.red}Some ${category} variables are missing!${colors.reset}`);
  }
  
  return allPresent;
}

// Main function
function main() {
  console.log(`${colors.bright}${colors.cyan}Environment Variable Checker${colors.reset}`);
  console.log('Checking if all required environment variables are set...\n');
  
  // Check each category
  const firebaseOk = checkCategory('Firebase Client', requiredVars.firebase);
  const adminOk = checkCategory('Firebase Admin', requiredVars.firebaseAdmin);
  
  // Overall summary
  console.log(`\n${colors.bright}Summary:${colors.reset}`);
  console.log(`Firebase Client: ${firebaseOk ? colors.green + 'OK' : colors.red + 'MISSING VARIABLES'}${colors.reset}`);
  console.log(`Firebase Admin: ${adminOk ? colors.green + 'OK' : colors.red + 'MISSING VARIABLES'}${colors.reset}`);
  
  // Advice section
  console.log(`\n${colors.bright}${colors.yellow}Troubleshooting:${colors.reset}`);
  
  if (!firebaseOk) {
    console.log(`${colors.yellow}• Firebase Client variables should be in your .env.local file${colors.reset}`);
    console.log(`${colors.yellow}• They must be prefixed with NEXT_PUBLIC_ to be accessible in the browser${colors.reset}`);
  }
  
  if (!adminOk) {
    console.log(`${colors.yellow}• Firebase Admin variables are used for server-side authentication${colors.reset}`);
    console.log(`${colors.yellow}• Make sure FIREBASE_PRIVATE_KEY includes all quotes and newlines${colors.reset}`);
    console.log(`${colors.yellow}• You can use either FIREBASE_* or FIREBASE_ADMIN_* prefixes${colors.reset}`);
  }
  
  console.log(`\n${colors.cyan}For more information, see the Firebase documentation:${colors.reset}`);
  console.log('https://firebase.google.com/docs/web/setup');
  console.log('https://firebase.google.com/docs/admin/setup');
}

// Run the script
main(); 