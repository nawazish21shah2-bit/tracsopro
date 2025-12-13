#!/usr/bin/env node

/**
 * Check App Icon Setup Status
 * 
 * This script checks if app icons are properly set up for iOS and Android.
 */

const fs = require('fs');
const path = require('path');

const MASTER_ICON = path.join(__dirname, '../assets/icon/app-icon-master.png');
const IOS_ICON_DIR = path.join(__dirname, '../ios/GuardTrackingApp/Images.xcassets/AppIcon.appiconset');
const ANDROID_RES_DIR = path.join(__dirname, '../android/app/src/main/res');

const IOS_REQUIRED = [
  '20@2x.png', '20@3x.png', '29@2x.png', '29@3x.png',
  '40@2x.png', '40@3x.png', '60@2x.png', '60@3x.png', '1024.png'
];

const ANDROID_FOLDERS = [
  'mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 
  'mipmap-xxhdpi', 'mipmap-xxxhdpi'
];

function checkFile(filePath, name) {
  const exists = fs.existsSync(filePath);
  return {
    name,
    path: filePath,
    exists,
    status: exists ? '✅' : '❌'
  };
}

function checkIconSetup() {
  console.log('🔍 Checking App Icon Setup...\n');
  
  // Check master icon
  console.log('📱 Master Icon:');
  const master = checkFile(MASTER_ICON, 'app-icon-master.png');
  console.log(`  ${master.status} ${master.name}`);
  if (!master.exists) {
    console.log(`     ⚠️  Place your 1024x1024 PNG icon at: ${MASTER_ICON}\n`);
  } else {
    console.log(`     ✅ Found master icon\n`);
  }
  
  // Check iOS icons
  console.log('🍎 iOS Icons:');
  let iosCount = 0;
  IOS_REQUIRED.forEach(filename => {
    const filePath = path.join(IOS_ICON_DIR, filename);
    const check = checkFile(filePath, filename);
    if (check.exists) iosCount++;
    console.log(`  ${check.status} ${check.name}`);
  });
  console.log(`\n  Status: ${iosCount}/${IOS_REQUIRED.length} icons found\n`);
  
  // Check Android icons
  console.log('🤖 Android Icons:');
  let androidCount = 0;
  let totalAndroid = 0;
  
  ANDROID_FOLDERS.forEach(folder => {
    const squarePath = path.join(ANDROID_RES_DIR, folder, 'ic_launcher.png');
    const roundPath = path.join(ANDROID_RES_DIR, folder, 'ic_launcher_round.png');
    
    const square = checkFile(squarePath, `${folder}/ic_launcher.png`);
    const round = checkFile(roundPath, `${folder}/ic_launcher_round.png`);
    
    if (square.exists) androidCount++;
    if (round.exists) androidCount++;
    totalAndroid += 2;
    
    console.log(`  ${square.status} ${square.name}`);
    console.log(`  ${round.status} ${round.name.replace('ic_launcher.png', 'ic_launcher_round.png')}`);
  });
  
  console.log(`\n  Status: ${androidCount}/${totalAndroid} icons found\n`);
  
  // Summary
  console.log('📊 Summary:');
  console.log(`  Master Icon: ${master.exists ? '✅ Ready' : '❌ Missing'}`);
  console.log(`  iOS Icons: ${iosCount === IOS_REQUIRED.length ? '✅ Complete' : `⚠️  ${iosCount}/${IOS_REQUIRED.length} found`}`);
  console.log(`  Android Icons: ${androidCount === totalAndroid ? '✅ Complete' : `⚠️  ${androidCount}/${totalAndroid} found`}`);
  
  if (master.exists && iosCount === IOS_REQUIRED.length && androidCount === totalAndroid) {
    console.log('\n🎉 All icons are set up correctly!');
    console.log('   You can now build and run your app.');
  } else {
    console.log('\n📝 Next Steps:');
    if (!master.exists) {
      console.log('   1. Place your 1024x1024 PNG icon at: assets/icon/app-icon-master.png');
    }
    if (iosCount < IOS_REQUIRED.length || androidCount < totalAndroid) {
      console.log('   2. Generate all icon sizes using:');
      console.log('      - Online tool: https://www.appicon.co/');
      console.log('      - Or see: QUICK_ICON_SETUP.md');
    }
  }
  console.log('');
}

checkIconSetup();

