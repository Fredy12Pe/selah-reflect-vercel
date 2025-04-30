// Script to fix iOS icons by removing transparency and ensuring full square coverage
// To run: npm install sharp --save-dev && node scripts/fix-ios-icons.js

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Create icons directory if it doesn't exist
const outputDir = path.join(process.cwd(), 'public/icons');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Source image (high resolution)
const sourceImage = path.join(process.cwd(), 'public/icon-512.png');

// Define all the icon sizes needed for iOS
const sizes = [152, 167, 180, 192];

console.log('Fixing iOS icons to remove padding and transparency...');

// Function to generate a properly formatted iOS icon
async function fixIOSIcon(size) {
  try {
    const outputPath = path.join(outputDir, `icon-${size}.png`);
    
    // Process the image to remove transparency and ensure square filling
    // We use a background color that matches the gradient in your icon
    await sharp(sourceImage)
      .resize(size, size, { 
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background initially
      })
      // Use composite to ensure the image fills the entire space without white padding
      .composite([
        {
          input: {
            create: {
              width: size,
              height: size,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent first
            }
          }
        }
      ])
      // Remove any transparency to prevent iOS from adding a white background
      .flatten({ background: { r: 211, g: 189, b: 166, alpha: 1 } })  // Use a color that matches your icon
      .toFile(outputPath);
      
    console.log(`Fixed ${size}x${size} iOS icon at ${outputPath}`);
  } catch (error) {
    console.error(`Error fixing ${size}x${size} iOS icon:`, error);
  }
}

// Fix all iOS icons
async function fixAllIOSIcons() {
  try {
    // Generate all size variants
    const promises = sizes.map(size => fixIOSIcon(size));
    await Promise.all(promises);
    
    console.log(`Done! Fixed ${sizes.length} iOS icons to prevent white padding`);
  } catch (error) {
    console.error('Error fixing iOS icons:', error);
  }
}

// Run the fix
fixAllIOSIcons().catch(console.error); 