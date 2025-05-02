#!/usr/bin/env node

// Test script for ESV Bible API
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.NEXT_PUBLIC_ESV_BIBLE_API_KEY || 
               process.env.ESV_API_KEY || 
               process.env.ESV_BIBLE_API_KEY;

console.log('\n===== ESV Bible API Test =====\n');

if (!apiKey || apiKey === 'YOUR_ESV_API_KEY') {
  console.error('❌ ERROR: No valid ESV API key found in environment variables');
  console.log('\nYou need to set a valid ESV API key in your .env.local file:');
  console.log('NEXT_PUBLIC_ESV_BIBLE_API_KEY=your_actual_api_key\n');
  console.log('To get an API key, sign up at: https://api.esv.org/\n');
  process.exit(1);
}

console.log('✅ Found ESV API key:', apiKey.substring(0, 5) + '...');

// Test the API with a simple reference
async function testEsvApi() {
  try {
    const reference = 'John 3:16';
    console.log(`\nTesting ESV API with reference: ${reference}`);
    
    const response = await fetch(
      `https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(reference)}&include-passage-references=true&include-verse-numbers=true`,
      {
        headers: {
          'Authorization': `Token ${apiKey}`
        }
      }
    );
    
    if (!response.ok) {
      console.error(`\n❌ API Error: ${response.status} ${response.statusText}`);
      
      if (response.status === 401 || response.status === 403) {
        console.log('\n⚠️ Your API key appears to be invalid or unauthorized.');
        console.log('Please check that you have a valid ESV API key and that it has been approved.');
        console.log('Sign up for a key at: https://api.esv.org/\n');
      }
      
      return;
    }
    
    const data = await response.json();
    
    if (!data.passages || data.passages.length === 0) {
      console.error('\n❌ API returned no passages for the reference');
      return;
    }
    
    console.log('\n✅ API call successful!');
    console.log('\nResponse:');
    console.log(data.passages[0]);
    console.log('\nYour ESV Bible API is working correctly! 🎉');
    
  } catch (error) {
    console.error('\n❌ Error testing ESV API:', error.message);
  }
}

testEsvApi(); 