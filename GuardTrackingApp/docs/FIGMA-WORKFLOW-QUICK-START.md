# ⚡ Figma Workflow Quick Start

A quick reference guide for updating your UI designs using Figma.

## 🎯 The Problem

You have **80+ screens** with inconsistent designs. You want to:
- Make all screens modern and professional
- Ensure consistency across the app
- Update designs easily from one place (Figma)

## ✅ The Solution

1. **Set up Figma MCP** → Connect Figma to Cursor
2. **Create Design System in Figma** → Define colors, typography, components
3. **Design Screens in Figma** → Create/modify screen designs
4. **Sync to Code** → Update code to match Figma designs

## 🚀 5-Minute Setup

### 1. Enable Figma MCP (2 minutes)

1. Open Figma Desktop
2. Open your design file
3. Press `Shift + D` (Dev Mode)
4. Click "Enable desktop MCP server"
5. Copy the URL: `http://127.0.0.1:3845/mcp`

### 2. Connect to Cursor (2 minutes)

1. Cursor → Settings → MCP tab
2. Click "Add Custom MCP"
3. Name: `figma-desktop`
4. URL: `http://127.0.0.1:3845/mcp`
5. Save and restart Cursor

### 3. Verify (1 minute)

- MCP server should appear in Cursor
- You can now access Figma designs from Cursor

## 📐 Design System Setup in Figma

### Create These Styles:

#### Colors (5 minutes)
```
Primary: #1C6CA9
Success: #4CAF50
Error: #F44336
Warning: #FF9800
Text Primary: #212121
Text Secondary: #757575
Background: #FFFFFF
Background Secondary: #F8F9FA
```

#### Typography (5 minutes)
```
H1: 32px, Bold
H2: 24px, Semibold
H3: 20px, Semibold
Body: 16px, Regular
Caption: 12px, Regular
```

#### Components (15 minutes)
- Button (Primary, Secondary, Outline)
- Input (Default, Focused, Error)
- Card (Default, Elevated)
- Badge (Status indicators)

## 🔄 Update a Screen (15 minutes)

### Step 1: Design in Figma (5 min)
1. Open/create screen design
2. Use design system components
3. Follow spacing (8px increments)

### Step 2: Extract Values (2 min)
1. Select elements in Figma
2. Note colors, spacing, typography
3. Check Dev Mode for exact values

### Step 3: Update Code (8 min)
1. Open screen file
2. Import design system:
   ```typescript
   import { Colors, Spacing, Typography, CommonStyles } from '../design-system';
   ```
3. Replace hardcoded values:
   ```typescript
   // Before
   backgroundColor: '#FFFFFF'
   padding: 16
   
   // After
   backgroundColor: Colors.background.primary
   padding: Spacing.lg
   ```
4. Use design system components
5. Test the screen

## 📋 Screen Update Checklist

For each screen:

- [ ] Design exists/updated in Figma
- [ ] Uses design system components
- [ ] Code imports design system
- [ ] No hardcoded colors
- [ ] No hardcoded spacing
- [ ] No hardcoded typography
- [ ] Matches Figma design
- [ ] Tested on device

## 🎨 Common Replacements

| Old (Hardcoded) | New (Design System) |
|----------------|---------------------|
| `#FFFFFF` | `Colors.background.primary` |
| `#000000` | `Colors.text.primary` |
| `#1C6CA9` | `Colors.primary` |
| `16` | `Spacing.lg` |
| `12` | `Spacing.md` |
| `8` | `Spacing.sm` |
| `fontSize: 24` | `...Typography.textStyles.h2` |
| `borderRadius: 8` | `BorderRadius.md` |

## 🔍 Finding Your Screens

Your screens are located in:
```
GuardTrackingApp/src/screens/
├── auth/          # 7 authentication screens
├── main/          # Main app screens
├── guard/         # Guard-specific screens
├── client/        # Client-specific screens
├── admin/         # Admin screens
└── dashboard/     # Dashboard screens
```

## 🎯 Priority Order

Update screens in this order:

1. **Authentication** (7 screens) - First impression
2. **Dashboards** (5 screens) - Most used
3. **Core Features** (20 screens) - Main functionality
4. **Settings** (10 screens) - Secondary
5. **Remaining** (40+ screens) - Complete the set

## 💡 Pro Tips

1. **Design First, Code Second**
   - Always design in Figma before coding
   - Get approval, then implement

2. **Use Components**
   - Don't recreate buttons/inputs
   - Use design system components

3. **Follow the 8px Rule**
   - All spacing should be multiples of 8
   - 4, 8, 12, 16, 20, 24, 32, etc.

4. **Consistency Over Perfection**
   - It's better to be consistent than perfect
   - Use the design system even if you want to "improve" it

5. **Test Early**
   - Test on real devices
   - Check different screen sizes

## 🆘 Quick Troubleshooting

**MCP not working?**
- Make sure Figma Desktop is running
- Check Dev Mode is enabled (`Shift + D`)
- Restart both Figma and Cursor

**Design doesn't match code?**
- Check you're using design system tokens
- Verify values match Figma exactly
- Use Dev Mode to get exact specs

**Screen looks different?**
- Check spacing values
- Verify typography styles
- Ensure colors match Figma

## 📚 Full Guides

For detailed instructions, see:
- `FIGMA-MCP-SETUP-GUIDE.md` - Complete MCP setup
- `FIGMA-DESIGN-SYNC-GUIDE.md` - Detailed sync process
- `DESIGN-SYSTEM-QUICK-REFERENCE.md` - Code reference

## ✅ Success!

You're done when:
- ✅ Figma MCP is connected
- ✅ Design system is in Figma
- ✅ Screens use design system
- ✅ All designs are consistent
- ✅ Easy to update globally

---

**Start with one screen, then scale to all 80+ screens!**













