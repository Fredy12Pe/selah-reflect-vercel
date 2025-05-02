#!/usr/bin/env node

// This script clears the localStorage cache for Bible verses
// to help resolve issues when the API is not working correctly

console.log('\n===== Selah Reflect Bible Cache Reset Tool =====\n');

// Check if we're running in a Node.js environment
if (typeof window === 'undefined') {
  console.log('This script needs to be run in a browser environment.');
  console.log('Please copy and paste this code into your browser console:');
  console.log('\n-----------------------------------\n');
  console.log(`
// Clear Bible verse cache
function clearBibleCache() {
  const keysToRemove = [];
  const prefix = 'bible_verse_cache_';
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  
  // Remove the keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log('Removed:', key);
  });
  
  console.log(\`Cleared \${keysToRemove.length} cached Bible verse entries\`);
  
  // Also reset error counter
  localStorage.setItem('bible_api_error_count', '0');
  console.log('Reset API error counter');
  
  console.log('\\nCache reset complete! Please reload the page.');
}

// Run the function
clearBibleCache();
  `);
  console.log('\n-----------------------------------\n');
  console.log('After pasting this into your browser console and running it,');
  console.log('reload the page to fetch fresh Bible verses.');
  process.exit(0);
}

// Browser environment code
function clearBibleCache() {
  const keysToRemove = [];
  const prefix = 'bible_verse_cache_';
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  
  // Remove the keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log('Removed:', key);
  });
  
  console.log(`Cleared ${keysToRemove.length} cached Bible verse entries`);
  
  // Also reset error counter
  localStorage.setItem('bible_api_error_count', '0');
  console.log('Reset API error counter');
  
  alert(`Cache reset complete! ${keysToRemove.length} entries cleared.\nPlease reload the page.`);
}

// Run the function
clearBibleCache(); 