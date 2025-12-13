#!/usr/bin/env node

/**
 * Generate iOS Icons from Master Icon
 * 
 * This script generates all required iOS icon sizes from the master icon.
 * Requires: npm install sharp (or jimp as fallback)
 */

const fs = require('fs');
const path = require('path');

const MASTER_ICON = path.join(__dirname, '../assets/icon/app-icon-master.png');
const IOS_ICON_DIR = path.join(__dirname, '../ios/GuardTrackingApp/Images.xcassets/AppIcon.appiconset');

const IOS_SIZES = [
  { name: '20@2x.png', size: 40 },
  { name: '20@3x.png', size: 60 },
  { name: '29@2x.png', size: 58 },
  { name: '29@3x.png', size: 87 },
  { name: '40@2x.png', size: 80 },
  { name: '40@3x.png', size: 120 },
  { name: '60@2x.png', size: 120 },
  { name: '60@3x.png', size: 180 },
  { name: '1024.png', size: 1024 },
];

async function generateIcons() {
  console.log('🚀 Generating iOS Icons...\n');
  
  // Check if master icon exists
  if (!fs.existsSync(MASTER_ICON)) {
    console.error('❌ Master icon not found at:', MASTER_ICON);
    console.log('\nPlease place your 1024x1024 PNG icon at:');
    console.log('  GuardTrackingApp/assets/icon/app-icon-master.png\n');
    process.exit(1);
  }
  
  console.log('✅ Master icon found\n');
  
  // Try to use sharp (faster) or jimp (fallback)
  let useSharp = false;
  let useJimp = false;
  
  try {
    require('sharp');
    useSharp = true;
    console.log('📦 Using sharp library\n');
  } catch {
    try {
      require('jimp');
      useJimp = true;
      console.log('📦 Using jimp library\n');
    } catch {
      console.error('❌ No image library found!');
      console.log('\nPlease install an image library:');
      console.log('  npm install sharp');
      console.log('\nOr use jimp:');
      console.log('  npm install jimp');
      console.log('\nAlternatively, use an online tool:');
      console.log('  https://www.appicon.co/\n');
      process.exit(1);
    }
  }
  
  // Ensure output directory exists
  if (!fs.existsSync(IOS_ICON_DIR)) {
    fs.mkdirSync(IOS_ICON_DIR, { recursive: true });
  }
  
  // Generate icons
  console.log('🖼️  Generating icons...\n');
  
  for (const { name, size } of IOS_SIZES) {
    const outputPath = path.join(IOS_ICON_DIR, name);
    
    try {
      if (useSharp) {
        // Using sharp
        const sharp = require('sharp');
        await sharp(MASTER_ICON)
          .resize(size, size, {
            fit: 'cover',
            position: 'center'
          })
          .png()
          .toFile(outputPath);
      } else if (useJimp) {
        // Using jimp
        const jimp = require('jimp');
        const image = await jimp.read(MASTER_ICON);
        await image
          .resize(size, size)
          .write(outputPath);
      }
      
      console.log(`  ✅ Generated ${name} (${size}x${size}px)`);
    } catch (error) {
      console.error(`  ❌ Failed to generate ${name}:`, error.message);
    }
  }
  
  console.log('\n✨ iOS icons generated successfully!');
  console.log('\n📝 Next steps:');
  console.log('  1. Clean and rebuild your iOS app:');
  console.log('     cd ios && pod install && cd ..');
  console.log('     npx react-native run-ios');
  console.log('  2. Verify the icon appears on your device\n');
}

// Run
generateIcons().catch(error => {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Alternative: Use online tool at https://www.appicon.co/');
  process.exit(1);
});

