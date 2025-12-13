# PERMANENT FIX: react-native-vector-icons CMake Build Error

## Problem
The build fails with:
```
fatal error: 'RNVectorIconsSpec.h' file not found
```

This happens because React Native's autolinking tries to include `react-native-vector-icons` in the new architecture codegen, but the CMakeLists.txt doesn't have the correct include paths.

## Permanent Solution

This fix uses **THREE layers of protection** to ensure it always works:

### 1. **Gradle Task (Primary Fix)**
   - Automatically runs before every CMake configuration
   - Ensures CMakeLists.txt is always correct
   - Located in: `android/app/build.gradle`

### 2. **Postinstall Script (Backup Fix)**
   - Automatically runs after `npm install`
   - Fixes CMakeLists.txt if it gets corrupted
   - Located in: `scripts/fix-vector-icons.js`
   - Also available as: `npm run fix:vector-icons`

### 3. **Manual Scripts (Emergency Fix)**
   - Can be run manually if needed
   - Available for Windows (PowerShell), Linux/Mac (Bash), and Node.js
   - Located in: `scripts/` directory

## How It Works

1. **Before every build**: Gradle task ensures CMakeLists.txt has correct include paths
2. **After npm install**: Postinstall script fixes any corrupted files
3. **Manual fix**: Run `npm run fix:vector-icons` if build still fails

## Verification

After running the fix, verify the CMakeLists.txt exists at:
```
node_modules/react-native-vector-icons/android/build/generated/source/codegen/jni/CMakeLists.txt
```

It should contain:
- `include_directories(${CMAKE_CURRENT_SOURCE_DIR})`
- `target_include_directories(... PUBLIC ... INTERFACE ...)`

## If Build Still Fails

1. **Clean build cache**:
   ```bash
   cd android
   ./gradlew clean
   # Or on Windows:
   cd android
   gradlew.bat clean
   ```

2. **Run manual fix**:
   ```bash
   npm run fix:vector-icons
   ```

3. **Rebuild**:
   ```bash
   npx react-native run-android
   ```

## Why This Is Permanent

- ✅ **Gradle task** runs automatically before every build
- ✅ **Postinstall script** runs automatically after npm install
- ✅ **No manual intervention** needed
- ✅ **Works after** `npm install`, `npm ci`, or `yarn install`
- ✅ **Cross-platform** (Windows, Mac, Linux)

## Files Modified

1. `android/app/build.gradle` - Added Gradle task
2. `package.json` - Added postinstall and fix scripts
3. `scripts/fix-vector-icons.js` - Node.js fix script
4. `scripts/fix-vector-icons.ps1` - PowerShell fix script
5. `scripts/fix-vector-icons.sh` - Bash fix script

## Testing

To test the fix works:
1. Delete `node_modules/react-native-vector-icons/android/build`
2. Run `npm install` (postinstall will fix it)
3. Try building: `npx react-native run-android`

The build should succeed without any manual intervention.


