#!/usr/bin/env node

/**
 * Generate Android Icons from Master Icon
 */

const fs = require('fs');
const path = require('path');

const MASTER_ICON = path.join(__dirname, '../assets/icon/app-icon-master.png');
const ANDROID_RES_DIR = path.join(__dirname, '../android/app/src/main/res');

const ANDROID_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

async function generateAndroidIcons() {
  console.log('🚀 Generating Android Icons...\n');
  
  if (!fs.existsSync(MASTER_ICON)) {
    console.error('❌ Master icon not found!');
    process.exit(1);
  }
  
  const sharp = require('sharp');
  console.log('📦 Using sharp library\n');
  
  console.log('🖼️  Generating Android icons...\n');
  
  for (const [folder, size] of Object.entries(ANDROID_SIZES)) {
    const dir = path.join(ANDROID_RES_DIR, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const squarePath = path.join(dir, 'ic_launcher.png');
    const roundPath = path.join(dir, 'ic_launcher_round.png');
    
    try {
      // Generate square icon
      await sharp(MASTER_ICON)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toFile(squarePath);
      console.log(`  ✅ Generated ${folder}/ic_launcher.png (${size}x${size}px)`);
      
      // Generate round icon (same as square for now)
      await sharp(MASTER_ICON)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toFile(roundPath);
      console.log(`  ✅ Generated ${folder}/ic_launcher_round.png (${size}x${size}px)`);
    } catch (error) {
      console.error(`  ❌ Failed to generate ${folder} icons:`, error.message);
    }
  }
  
  console.log('\n✨ Android icons generated successfully!\n');
}

generateAndroidIcons().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

