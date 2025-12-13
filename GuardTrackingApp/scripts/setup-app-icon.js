#!/usr/bin/env node

/**
 * App Icon Setup Script
 * 
 * This script helps you set up app icons for React Native.
 * 
 * Usage:
 * 1. Place your master icon (1024x1024 PNG) in: assets/icon/app-icon-master.png
 * 2. Run: node scripts/setup-app-icon.js
 * 
 * The script will:
 * - Validate your master icon
 * - Generate all required sizes
 * - Place them in the correct locations
 * - Update iOS Contents.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MASTER_ICON_PATH = path.join(__dirname, '../assets/icon/app-icon-master.png');
const ASSETS_DIR = path.join(__dirname, '../assets/icon');
const IOS_ICON_DIR = path.join(__dirname, '../ios/GuardTrackingApp/Images.xcassets/AppIcon.appiconset');
const ANDROID_RES_DIR = path.join(__dirname, '../android/app/src/main/res');

// iOS icon sizes (based on Contents.json)
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

// Android icon sizes
const ANDROID_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

function checkImageMagick() {
  try {
    execSync('magick -version', { stdio: 'ignore' });
    return true;
  } catch {
    try {
      execSync('convert -version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

function resizeImage(inputPath, outputPath, size) {
  const command = `magick "${inputPath}" -resize ${size}x${size} "${outputPath}"`;
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch {
    try {
      const convertCommand = `convert "${inputPath}" -resize ${size}x${size} "${outputPath}"`;
      execSync(convertCommand, { stdio: 'inherit' });
      return true;
    } catch (error) {
      console.error(`Failed to resize image: ${error.message}`);
      return false;
    }
  }
}

function updateIOSContentsJson() {
  const contentsJsonPath = path.join(IOS_ICON_DIR, 'Contents.json');
  const contents = JSON.parse(fs.readFileSync(contentsJsonPath, 'utf8'));
  
  contents.images = contents.images.map((img, index) => {
    const size = IOS_SIZES[index];
    if (size) {
      return {
        ...img,
        filename: size.name,
      };
    }
    return img;
  });
  
  fs.writeFileSync(contentsJsonPath, JSON.stringify(contents, null, 2));
  console.log('✅ Updated iOS Contents.json');
}

function setupIcons() {
  console.log('🚀 Starting App Icon Setup...\n');
  
  // Check if master icon exists
  if (!fs.existsSync(MASTER_ICON_PATH)) {
    console.error('❌ Master icon not found!');
    console.log(`\nPlease place your 1024x1024 PNG icon at:`);
    console.log(`  ${MASTER_ICON_PATH}`);
    console.log(`\nOr create the directory and place your icon there.`);
    process.exit(1);
  }
  
  console.log('✅ Master icon found\n');
  
  // Check for ImageMagick
  const hasImageMagick = checkImageMagick();
  if (!hasImageMagick) {
    console.warn('⚠️  ImageMagick not found. You can:');
    console.log('   1. Install ImageMagick: https://imagemagick.org/script/download.php');
    console.log('   2. Use an online tool: https://www.appicon.co/');
    console.log('   3. Manually resize icons using the sizes listed in APP_ICON_SETUP.md\n');
    console.log('Continuing with directory structure setup...\n');
  }
  
  // Create directories
  console.log('📁 Creating directories...');
  if (!fs.existsSync(IOS_ICON_DIR)) {
    fs.mkdirSync(IOS_ICON_DIR, { recursive: true });
  }
  
  ANDROID_SIZES.forEach((size, folder) => {
    const dir = path.join(ANDROID_RES_DIR, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  console.log('✅ Directories created\n');
  
  // Generate iOS icons
  if (hasImageMagick) {
    console.log('📱 Generating iOS icons...');
    IOS_SIZES.forEach(({ name, size }) => {
      const outputPath = path.join(IOS_ICON_DIR, name);
      if (resizeImage(MASTER_ICON_PATH, outputPath, size)) {
        console.log(`  ✅ Generated ${name} (${size}x${size})`);
      }
    });
    console.log('');
    
    // Generate Android icons
    console.log('🤖 Generating Android icons...');
    Object.entries(ANDROID_SIZES).forEach(([folder, size]) => {
      const squarePath = path.join(ANDROID_RES_DIR, folder, 'ic_launcher.png');
      const roundPath = path.join(ANDROID_RES_DIR, folder, 'ic_launcher_round.png');
      
      if (resizeImage(MASTER_ICON_PATH, squarePath, size)) {
        console.log(`  ✅ Generated ${folder}/ic_launcher.png (${size}x${size})`);
      }
      
      // For round icons, we'll use the same square icon
      // In production, you might want to create a separate round version
      if (resizeImage(MASTER_ICON_PATH, roundPath, size)) {
        console.log(`  ✅ Generated ${folder}/ic_launcher_round.png (${size}x${size})`);
      }
    });
    console.log('');
  } else {
    console.log('📋 Manual setup required:');
    console.log('\n📱 iOS Icons needed:');
    IOS_SIZES.forEach(({ name, size }) => {
      console.log(`  - ${name}: ${size}x${size} px`);
      console.log(`    Location: ${path.join(IOS_ICON_DIR, name)}`);
    });
    
    console.log('\n🤖 Android Icons needed:');
    Object.entries(ANDROID_SIZES).forEach(([folder, size]) => {
      console.log(`  - ${folder}/ic_launcher.png: ${size}x${size} px`);
      console.log(`  - ${folder}/ic_launcher_round.png: ${size}x${size} px`);
    });
    console.log('');
  }
  
  // Update iOS Contents.json
  if (fs.existsSync(path.join(IOS_ICON_DIR, 'Contents.json'))) {
    updateIOSContentsJson();
  } else {
    console.log('⚠️  iOS Contents.json not found. You may need to create it manually.');
  }
  
  console.log('\n✨ Icon setup complete!');
  console.log('\n📝 Next steps:');
  console.log('  1. Clean and rebuild your app:');
  console.log('     Android: cd android && ./gradlew clean && cd .. && npx react-native run-android');
  console.log('     iOS: cd ios && pod install && cd .. && npx react-native run-ios');
  console.log('  2. Test the icons on actual devices');
  console.log('  3. Verify icons look good on different screen densities\n');
}

// Run setup
setupIcons();

