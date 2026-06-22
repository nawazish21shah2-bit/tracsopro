/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath:
        'android/app/build/outputs/apk/standard/debug/app-standard-debug.apk',
      testBinaryPath:
        'android/app/build/outputs/apk/androidTest/standard/debug/app-standard-debug-androidTest.apk',
      build:
        'cd android && ./gradlew assembleStandardDebug assembleStandardDebugAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
    'ios.debug': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Debug-iphonesimulator/GuardTrackingApp.app',
      build:
        'xcodebuild -project ios/GuardTrackingApp.xcodeproj -scheme GuardTrackingApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
  },
  devices: {
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'TracSOpro_E2E',
      },
    },
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15',
      },
    },
  },
  configurations: {
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
  },
};
