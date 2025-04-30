// Script to generate icons for the Selah PWA using sharp
// To run: npm install sharp --save-dev && node scripts/generate-icons.js

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

// Define all the icon sizes needed
const sizes = [16, 32, 72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

console.log('Generating icons for Selah PWA...');

// Function to generate a single icon
async function generateIcon(size) {
  try {
    const outputPath = path.join(outputDir, `icon-${size}.png`);
    await sharp(sourceImage)
      .resize(size, size)
      .toFile(outputPath);
    console.log(`Created ${size}x${size} icon at ${outputPath}`);
  } catch (error) {
    console.error(`Error generating ${size}x${size} icon:`, error);
  }
}

// Copy existing icons for backward compatibility
async function copyOriginalIcons() {
  try {
    // Copy original icon-512.png
    const source512 = path.join(process.cwd(), 'public/icon-512.png');
    const dest512 = path.join(outputDir, 'icon-512.png');
    fs.copyFileSync(source512, dest512);
    console.log(`Copied original icon-512.png to ${dest512}`);
    
    // Copy original icon-192.png
    const source192 = path.join(process.cwd(), 'public/icon-192.png');
    const dest192 = path.join(outputDir, 'icon-192.png');
    fs.copyFileSync(source192, dest192);
    console.log(`Copied original icon-192.png to ${dest192}`);
  } catch (error) {
    console.error('Error copying original icons:', error);
  }
}

// Generate all icons
async function generateAllIcons() {
  try {
    // Generate all size variants
    const promises = sizes.map(size => generateIcon(size));
    await Promise.all(promises);
    
    // Copy original icons for backward compatibility
    await copyOriginalIcons();
    
    console.log(`Done! Total icons created: ${sizes.length}`);
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// Run the generation
generateAllIcons().catch(console.error); 