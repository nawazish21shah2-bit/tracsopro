{
  "testRunner": "jest",
  "runnerConfig": "e2e/config.json",
  "apps": {
    "ios.debug": {
      "type": "ios.app",
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/GuardTrackingApp.app"
    },
    "android.debug": {
      "type": "android.apk",
      "binaryPath": "android/app/build/outputs/apk/debug/app-debug.apk"
    }
  },
  "devices": {
    "simulator": {
      "type": "ios.simulator",
      "device": { "type": "iPhone 15" }
    },
    "emulator": {
      "type": "android.emulator",
      "device": { "avdName": "Pixel_6_API_34" }
    }
  },
  "specs": ["e2e/login.e2e.ts", "e2e/guard-checkin.e2e.ts"]
}
