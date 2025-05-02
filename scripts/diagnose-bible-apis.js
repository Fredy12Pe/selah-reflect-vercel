#!/usr/bin/env node

// Comprehensive diagnostic script for Bible APIs
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const ESV_API_BASE_URL = 'https://api.esv.org/v3/passage/text';
const BIBLE_API_BASE_URL = 'https://bible-api.com';

const BIBLE_REFERENCES = [
  'John 3:16',  // Very common verse
  'Psalm 23:1', // Popular psalm
  'Genesis 1:1', // First verse of the Bible
  '1 Corinthians 13:4-7', // Love passage (multiple verses)
  'Revelation 21:4' // Popular verse from Revelation
];

console.log('\n===== Bible API Diagnostic Tool =====\n');

// Check ESV API key
const esvApiKey = process.env.NEXT_PUBLIC_ESV_BIBLE_API_KEY || 
                  process.env.ESV_API_KEY || 
                  process.env.ESV_BIBLE_API_KEY ||
                  process.env.NEXT_PUBLIC_ESV_BIBLE_API_KEY;

console.log('ESV API Key Check:');
if (!esvApiKey) {
  console.log('❌ No ESV API key found in environment variables');
} else if (esvApiKey === 'YOUR_ESV_API_KEY' || esvApiKey === 'test_key_for_demo_purposes') {
  console.log(`❌ Invalid placeholder API key found: ${esvApiKey}`);
} else {
  console.log(`✅ ESV API key found: ${esvApiKey.substring(0, 5)}...`);
}

// Test internet connectivity
async function checkInternetConnectivity() {
  console.log('\nInternet Connectivity Check:');
  try {
    const response = await fetch('https://www.google.com', { timeout: 5000 });
    if (response.ok) {
      console.log('✅ Internet connectivity confirmed');
      return true;
    } else {
      console.log('❌ Internet connectivity issue detected');
      return false;
    }
  } catch (error) {
    console.log('❌ No internet connection detected');
    console.error('  Error details:', error.message);
    return false;
  }
}

// Test ESV API
async function testEsvApi(reference) {
  console.log(`\nTesting ESV API with reference: ${reference}`);
  try {
    if (!esvApiKey || esvApiKey === 'YOUR_ESV_API_KEY' || esvApiKey === 'test_key_for_demo_purposes') {
      throw new Error('No valid ESV API key available');
    }
    
    const response = await fetch(
      `${ESV_API_BASE_URL}/?q=${encodeURIComponent(reference)}&include-passage-references=true&include-verse-numbers=true`,
      {
        headers: {
          'Authorization': `Token ${esvApiKey}`
        },
        timeout: 8000
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.passages || data.passages.length === 0) {
      throw new Error('No passages found in response');
    }
    
    console.log('✅ ESV API success!');
    console.log('  Reference:', data.query);
    console.log('  Passage:', data.passages[0].substring(0, 60) + '...');
    return true;
  } catch (error) {
    console.log('❌ ESV API error:');
    console.error('  Error details:', error.message);
    return false;
  }
}

// Test Bible API (fallback)
async function testBibleApi(reference) {
  console.log(`\nTesting Bible-API.com (fallback) with reference: ${reference}`);
  try {
    const response = await fetch(
      `${BIBLE_API_BASE_URL}/${encodeURIComponent(reference)}`,
      { timeout: 8000 }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.text) {
      throw new Error('No valid text found in response');
    }
    
    console.log('✅ Bible-API.com success!');
    console.log('  Reference:', data.reference);
    console.log('  Text:', data.text.substring(0, 60) + '...');
    return true;
  } catch (error) {
    console.log('❌ Bible-API.com error:');
    console.error('  Error details:', error.message);
    return false;
  }
}

// Test proxy API
async function testApiProxy(reference) {
  if (typeof window === 'undefined') {
    console.log('\nSkipping API proxy test (requires browser environment)');
    return null;
  }
  
  console.log(`\nTesting API proxy with reference: ${reference}`);
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(
      `${baseUrl}/api/bible/${encodeURIComponent(reference)}`,
      { timeout: 8000 }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ API proxy success!');
    console.log('  Source:', data.source);
    console.log('  Reference:', data.reference);
    console.log('  Text:', data.text.substring(0, 60) + '...');
    return true;
  } catch (error) {
    console.log('❌ API proxy error:');
    console.error('  Error details:', error.message);
    return false;
  }
}

// Run the tests sequentially
async function runDiagnostics() {
  // Check internet connectivity first
  const hasInternet = await checkInternetConnectivity();
  if (!hasInternet) {
    console.log('\n❌ Cannot proceed with tests due to internet connectivity issues');
    return;
  }
  
  // Get a test reference
  const testReference = BIBLE_REFERENCES[0]; // John 3:16
  
  // Test ESV API
  const esvApiWorks = await testEsvApi(testReference);
  
  // Test Bible API fallback
  const bibleApiWorks = await testBibleApi(testReference);
  
  // Overall summary
  console.log('\n===== Diagnostic Results =====');
  console.log('Internet Connectivity: ✅');
  console.log(`ESV API: ${esvApiWorks ? '✅' : '❌'}`);
  console.log(`Bible-API.com: ${bibleApiWorks ? '✅' : '❌'}`);
  
  if (esvApiWorks) {
    console.log('\n✅ Your ESV Bible API integration is working correctly!');
  } else if (bibleApiWorks) {
    console.log('\n⚠️ Your ESV Bible API is not working, but the fallback API (Bible-API.com) is working.');
    console.log('   The app will use the fallback, but for best results, please set up your ESV API key:');
    console.log('   1. Sign up at https://api.esv.org/');
    console.log('   2. Create a new API key');
    console.log('   3. Configure it with: node scripts/setup-bible-api.js');
  } else {
    console.log('\n❌ Both Bible APIs are not working properly. Please check:');
    console.log('   1. Your internet connection');
    console.log('   2. Your ESV API key configuration');
    console.log('   3. If Bible-API.com is currently down');
    console.log('\n   You can visit /debug/reset-app in the browser for more troubleshooting options.');
  }
}

// Run the diagnostics
runDiagnostics(); 