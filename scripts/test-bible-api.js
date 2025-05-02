#!/usr/bin/env node

// Test script for Bible-API.com (the fallback API)
console.log('\n===== Bible-API.com Test =====\n');

// Test the fallback API with a simple reference
async function testBibleApi() {
  try {
    const reference = 'John 3:16';
    console.log(`Testing Bible-API.com with reference: ${reference}`);
    
    const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}`);
    
    if (!response.ok) {
      console.error(`\n❌ API Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    
    if (!data || !data.text) {
      console.error('\n❌ API returned invalid data');
      return;
    }
    
    console.log('\n✅ API call successful!');
    console.log('\nResponse:');
    console.log('Reference:', data.reference);
    console.log('Text:', data.text);
    console.log('\nFallback Bible API is working correctly! 🎉');
    
  } catch (error) {
    console.error('\n❌ Error testing Bible API:', error.message);
  }
}

testBibleApi(); 