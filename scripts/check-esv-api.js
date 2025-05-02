// This script checks your ESV API key and tests the ESV API

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('\n===== ESV API Key Check =====\n');

// Check environment variables
const esvApiKey = process.env.ESV_API_KEY || 
                 process.env.NEXT_PUBLIC_ESV_API_KEY || 
                 process.env.ESV_BIBLE_API_KEY || 
                 process.env.NEXT_PUBLIC_ESV_BIBLE_API_KEY;

if (!esvApiKey) {
  console.error('❌ ERROR: No ESV API key found in any environment variable!');
  console.log('\nPlease check your .env.local file and make sure one of these is set:');
  console.log('- ESV_API_KEY');
  console.log('- NEXT_PUBLIC_ESV_API_KEY');
  console.log('- ESV_BIBLE_API_KEY');
  console.log('- NEXT_PUBLIC_ESV_BIBLE_API_KEY');
  process.exit(1);
}

console.log('✅ Found ESV API key in environment variables');
console.log(`   The first 5 characters are: ${esvApiKey.substring(0, 5)}...`);

// Test the API with a simple request
console.log('\n===== Testing ESV API =====\n');
console.log('Making a test request to the ESV API for "John 3:16"...');

const https = require('https');

const options = {
  hostname: 'api.esv.org',
  port: 443,
  path: '/v3/passage/text/?q=john+3:16&include-passage-references=true&include-verse-numbers=true',
  method: 'GET',
  headers: {
    'Authorization': `Token ${esvApiKey}`
  }
};

const req = https.request(options, (res) => {
  console.log(`Status code: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    console.log('✅ ESV API responded successfully!');
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.passages && parsed.passages.length > 0) {
          console.log('\nSample verse text:');
          console.log(parsed.passages[0].substring(0, 100) + '...');
          console.log('\n✅ Everything looks good! Your ESV API key is working correctly.');
        } else {
          console.log('⚠️ Got a successful response but no passages were returned.');
          console.log(parsed);
        }
      } catch (e) {
        console.error('❌ Error parsing response:', e);
        console.log('Raw response:', data);
      }
    });
  } else {
    console.error(`❌ API returned error status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.error('Response data:', data);
    });
  }
});

req.on('error', (error) => {
  console.error('❌ Error making request:', error);
});

req.end(); 