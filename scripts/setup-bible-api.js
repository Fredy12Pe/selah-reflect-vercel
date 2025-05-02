#!/usr/bin/env node

// Setup script for ESV Bible API configuration
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_FILE_PATH = path.join(process.cwd(), '.env.local');

console.log('\n===== Selah Reflect Bible API Setup =====\n');
console.log('This utility will help you configure your ESV Bible API key.\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check if .env.local exists
const envFileExists = fs.existsSync(ENV_FILE_PATH);

// If .env.local exists, read it
let existingEnvContent = '';
let hasApiKey = false;

if (envFileExists) {
  existingEnvContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
  hasApiKey = /NEXT_PUBLIC_ESV_BIBLE_API_KEY\s*=\s*[^\s]/i.test(existingEnvContent) && 
             !/NEXT_PUBLIC_ESV_BIBLE_API_KEY\s*=\s*YOUR_ESV_API_KEY/i.test(existingEnvContent);
}

if (hasApiKey) {
  console.log('✅ You already have an ESV Bible API key configured in your .env.local file.');
  console.log('If you want to change it, you can edit the .env.local file directly.');
  
  rl.question('\nDo you want to update your API key? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      askForApiKey();
    } else {
      console.log('\nKeeping your existing API key. Setup complete!');
      rl.close();
    }
  });
} else {
  console.log('You need to set up your ESV Bible API key.\n');
  console.log('To get an API key:');
  console.log('1. Go to https://api.esv.org/');
  console.log('2. Create an account and sign in');
  console.log('3. Create a new API key for your application');
  console.log('4. Copy the API key\n');
  
  askForApiKey();
}

function askForApiKey() {
  rl.question('Please enter your ESV Bible API key: ', (apiKey) => {
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_ESV_API_KEY')) {
      console.log('\n❌ Invalid API key. Please enter a valid API key.');
      askForApiKey();
      return;
    }
    
    updateEnvFile(apiKey.trim());
  });
}

function updateEnvFile(apiKey) {
  try {
    let newEnvContent;
    
    if (existingEnvContent) {
      // Update existing NEXT_PUBLIC_ESV_BIBLE_API_KEY if it exists
      if (/NEXT_PUBLIC_ESV_BIBLE_API_KEY\s*=/i.test(existingEnvContent)) {
        newEnvContent = existingEnvContent.replace(
          /NEXT_PUBLIC_ESV_BIBLE_API_KEY\s*=.*/i,
          `NEXT_PUBLIC_ESV_BIBLE_API_KEY=${apiKey}`
        );
      } else {
        // Add new key if it doesn't exist
        newEnvContent = `${existingEnvContent.trim()}\nNEXT_PUBLIC_ESV_BIBLE_API_KEY=${apiKey}\n`;
      }
    } else {
      // Create new env file
      newEnvContent = `NEXT_PUBLIC_ESV_BIBLE_API_KEY=${apiKey}\n`;
    }
    
    fs.writeFileSync(ENV_FILE_PATH, newEnvContent);
    console.log('\n✅ API key successfully saved to .env.local!');
    console.log('\nYou may need to restart your Next.js server for changes to take effect.');
    
    console.log('\nWould you like to test the API key now?');
    rl.question('Test API key? (Y/n): ', (answer) => {
      if (answer.toLowerCase() !== 'n') {
        console.log('\nTesting API key...');
        // We can't directly require and run the test script here, so provide instructions
        console.log('\nRun the following command to test your API key:');
        console.log('node scripts/test-esv-api.js');
      }
      rl.close();
    });
  } catch (error) {
    console.error('\n❌ Error updating .env.local file:', error.message);
    rl.close();
  }
} 