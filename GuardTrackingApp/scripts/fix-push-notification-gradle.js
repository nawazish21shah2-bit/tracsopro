const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-push-notification',
  'android',
  'build.gradle',
);

if (!fs.existsSync(buildGradlePath)) {
  process.exit(0);
}

let contents = fs.readFileSync(buildGradlePath, 'utf8');

if (!contents.includes("classpath 'com.android.tools.build:gradle:3.2.0'")) {
  process.exit(0);
}

contents = contents.replace(
  /buildscript \{[\s\S]*?\}\s*\n\s*allprojects \{[\s\S]*?\}\s*\n\s*/m,
  '',
);

contents = contents.replace(
  'android {\n    compileSdkVersion safeExtGet(\'compileSdkVersion\', 28)',
  "android {\n    namespace \"com.dieam.reactnativepushnotification\"\n    compileSdkVersion safeExtGet('compileSdkVersion', 36)",
);

contents = contents.replace(
  "buildToolsVersion safeExtGet('buildToolsVersion', '28.0.3')",
  "buildToolsVersion safeExtGet('buildToolsVersion', '36.0.0')",
);

contents = contents.replace(
  "minSdkVersion safeExtGet('minSdkVersion', 16)",
  "minSdkVersion safeExtGet('minSdkVersion', 24)",
);

contents = contents.replace(
  "targetSdkVersion safeExtGet('targetSdkVersion', 28)",
  "targetSdkVersion safeExtGet('targetSdkVersion', 36)",
);

fs.writeFileSync(buildGradlePath, contents);
console.log('Patched react-native-push-notification/android/build.gradle for AGP 8.x');
