# App Icon Setup

## Place Your Master Icon Here

1. **Save your TSP shield logo** as a PNG file named: `app-icon-master.png`
2. **Size:** 1024x1024 pixels
3. **Format:** PNG with solid background (no transparency for Android)

## Quick Setup Steps

Once you place `app-icon-master.png` here, you can:

### Option 1: Use Online Tool (Easiest)
1. Go to https://www.appicon.co/
2. Upload your `app-icon-master.png`
3. Select **iOS** and **Android**
4. Download the generated package
5. Follow the extraction instructions in `QUICK_ICON_SETUP.md`

### Option 2: Use npm Package
```bash
cd GuardTrackingApp
npm install -g app-icon
app-icon generate --input assets/icon/app-icon-master.png
```

### Option 3: Manual Setup
See `QUICK_ICON_SETUP.md` for all required sizes.

## Current Status
⏳ Waiting for `app-icon-master.png` to be placed in this directory.

