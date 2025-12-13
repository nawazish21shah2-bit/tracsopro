# 🎨 Figma Design Sync Guide

This guide explains how to use Figma to update and streamline your UI designs throughout the Guard Tracking App, ensuring all screens are modern, professional, and consistent.

## 🎯 Overview

Your app has **80+ screens** that need consistent design. This guide shows you how to:
1. Create a unified design system in Figma
2. Update existing screens to match Figma designs
3. Sync design tokens from Figma to your codebase
4. Maintain consistency across all screens

## 📐 Step 1: Create Your Design System in Figma

### 1.1 Set Up Design Tokens

In Figma, create a dedicated page called **"Design System"** with:

#### Colors
Create color styles for:
- **Primary Colors**: `#1C6CA9` (your brand color)
- **Semantic Colors**: Success, Error, Warning, Info
- **Neutral Grays**: 50-900 scale
- **Text Colors**: Primary, Secondary, Tertiary
- **Background Colors**: Primary, Secondary, Tertiary

**How to create:**
1. Select a color
2. Click the "Style" icon (4 dots) in the right panel
3. Click "+" to create a new style
4. Name it (e.g., "Primary/Blue")

#### Typography
Create text styles for:
- **H1**: 32px, Bold (700)
- **H2**: 24px, Semibold (600)
- **H3**: 20px, Semibold (600)
- **H4**: 18px, Semibold (600)
- **Body**: 16px, Regular (400)
- **Body Small**: 14px, Regular (400)
- **Caption**: 12px, Regular (400)
- **Label**: 14px, Medium (500)

**How to create:**
1. Select text with desired styling
2. Click the "Style" icon
3. Click "+" to create a new style
4. Name it (e.g., "Typography/H1")

#### Spacing
Create a spacing system using **8px base unit**:
- Create a frame showing spacing values: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64
- Document these in your design system page

#### Components
Create reusable components:
- **Button** (Primary, Secondary, Danger, Success, Outline variants)
- **Input** (Default, Focused, Error states)
- **Card** (Default, Elevated, Outlined)
- **Badge** (Status indicators)
- **Header** (App headers)
- **Navigation** (Bottom tabs, Stack headers)

## 📱 Step 2: Design Your Screens in Figma

### 2.1 Screen Organization

Organize your Figma file by user roles:
```
📁 Guard Tracking App
  📁 Design System
    - Colors
    - Typography
    - Spacing
    - Components
  📁 Authentication
    - Login Screen
    - Register Screen
    - Forgot Password
  📁 Guard Screens
    - Guard Dashboard
    - Available Shifts
    - Check In/Out
  📁 Client Screens
    - Client Dashboard
    - Site Management
    - Shift Creation
  📁 Admin Screens
    - Admin Dashboard
    - User Management
    - Reports
```

### 2.2 Design Principles

When designing screens:

1. **Use Design System Components**
   - Always use your predefined components
   - Don't create one-off styles

2. **Follow Spacing System**
   - Use 8px increments (4, 8, 12, 16, 20, 24, etc.)
   - Maintain consistent padding and margins

3. **Consistent Typography**
   - Use predefined text styles
   - Maintain hierarchy (H1 → H2 → H3 → Body)

4. **Color Consistency**
   - Use color styles from your design system
   - Don't use arbitrary colors

5. **Component Variants**
   - Use Figma's variant system for component states
   - Create variants for: Default, Hover, Active, Disabled, Error

## 🔄 Step 3: Sync Figma Designs to Code

### 3.1 Extract Design Tokens

#### Using Figma MCP (Recommended)

Once MCP is set up, you can extract tokens:

1. **Extract Colors**
   ```typescript
   // Use MCP to get colors from Figma
   // Then update src/design-system/index.ts
   export const Colors = {
     primary: '#1C6CA9', // From Figma
     // ... other colors
   };
   ```

2. **Extract Typography**
   ```typescript
   // Get typography values from Figma
   export const Typography = {
     fontSize: {
       // Values from Figma text styles
     },
     // ...
   };
   ```

3. **Extract Spacing**
   ```typescript
   // Get spacing values from Figma
   export const Spacing = {
     // Values from Figma spacing system
   };
   ```

#### Manual Extraction

If MCP isn't available:

1. **Inspect in Figma**
   - Select an element
   - Check the right panel for exact values
   - Copy color hex codes, font sizes, spacing values

2. **Update Design System**
   - Open `src/design-system/index.ts`
   - Update values to match Figma
   - Ensure all screens use these tokens

### 3.2 Update Existing Screens

For each screen in your app:

#### Step-by-Step Process

1. **Open Figma Design**
   - Find the corresponding screen in Figma
   - Note all design specifications

2. **Open Code File**
   - Open the screen file (e.g., `src/screens/auth/LoginScreen.tsx`)

3. **Update Imports**
   ```typescript
   import {
     Colors,
     Typography,
     Spacing,
     BorderRadius,
     Shadows,
     CommonStyles,
   } from '../../design-system';
   ```

4. **Replace Hardcoded Values**
   ```typescript
   // Before
   backgroundColor: '#FFFFFF'
   padding: 16
   fontSize: 24
   
   // After
   backgroundColor: Colors.background.primary
   padding: Spacing.lg
   ...Typography.textStyles.h2
   ```

5. **Use Design System Components**
   ```typescript
   // Before
   <TouchableOpacity style={customButtonStyle}>
     <Text>Click</Text>
   </TouchableOpacity>
   
   // After
   <DesignSystemButton
     title="Click"
     onPress={handlePress}
     variant="primary"
   />
   ```

6. **Test the Screen**
   - Run the app
   - Verify it matches the Figma design
   - Check on different screen sizes

## 📋 Step 4: Screen-by-Screen Migration Checklist

### Priority Order

1. **Authentication Screens** (7 screens)
   - [ ] LoginScreen
   - [ ] RegisterScreen
   - [ ] ForgotPasswordScreen
   - [ ] EmailVerificationScreen
   - [ ] GuardSignupScreen
   - [ ] ClientSignupScreen
   - [ ] AdminSignupScreen

2. **Main Dashboard Screens** (5 screens)
   - [ ] GuardHomeScreen
   - [ ] ClientDashboard
   - [ ] AdminDashboard
   - [ ] SuperAdminDashboard
   - [ ] DashboardScreen

3. **Core Feature Screens** (20+ screens)
   - [ ] TrackingScreen
   - [ ] IncidentsScreen
   - [ ] MessagesScreen
   - [ ] ProfileScreen
   - [ ] And more...

### Migration Template

For each screen, check:

- [ ] Design exists in Figma
- [ ] Design tokens extracted and updated
- [ ] Screen imports design system
- [ ] All colors use `Colors.*`
- [ ] All spacing uses `Spacing.*`
- [ ] All typography uses `Typography.textStyles.*`
- [ ] Components use design system components
- [ ] Screen matches Figma design
- [ ] Tested on iOS and Android
- [ ] Responsive on different screen sizes

## 🎨 Step 5: Maintain Consistency

### 5.1 Regular Sync Process

**Weekly:**
1. Review Figma designs for updates
2. Extract any new design tokens
3. Update design system if needed
4. Migrate updated screens

**Before New Features:**
1. Design in Figma first
2. Get stakeholder approval
3. Extract design tokens
4. Implement using design system

### 5.2 Design Review Checklist

Before implementing a new screen:

- [ ] Design follows design system
- [ ] Uses predefined components
- [ ] Spacing follows 8px system
- [ ] Typography uses text styles
- [ ] Colors use color styles
- [ ] Responsive design considered
- [ ] Accessibility checked (contrast, touch targets)

## 🔧 Step 6: Using Figma Dev Mode

### 6.1 Inspect Elements

1. **Enable Dev Mode** (`Shift + D`)
2. **Select an element** in your design
3. **View specifications** in the right panel:
   - Exact dimensions
   - Colors (with hex codes)
   - Typography (font, size, weight)
   - Spacing (padding, margins)
   - Border radius
   - Shadows

### 6.2 Copy CSS/React Native Styles

Figma can generate code:

1. Select an element
2. In Dev Mode, click "Code" tab
3. Select "React Native" as the platform
4. Copy the generated styles
5. Adapt to use your design system tokens

**Important**: Don't copy directly - convert to use design system tokens!

## 📊 Step 7: Design System Documentation

### Keep Figma and Code in Sync

Create a documentation page in Figma:

1. **Design Tokens Reference**
   - Show all colors with hex codes
   - List all typography styles
   - Display spacing scale
   - Show component variants

2. **Component Library**
   - Document all reusable components
   - Show all variants and states
   - Include usage guidelines

3. **Screen Templates**
   - Create templates for common screen types
   - Document layout patterns
   - Show responsive breakpoints

## 🚀 Quick Start Workflow

### For a New Screen:

1. **Design in Figma** (30 min)
   - Use design system components
   - Follow spacing and typography rules
   - Get approval

2. **Extract Tokens** (5 min)
   - Note any new colors/typography
   - Update design system if needed

3. **Implement in Code** (1-2 hours)
   - Use design system from start
   - Reference Figma for exact specs
   - Test thoroughly

### For Existing Screen Update:

1. **Update Figma Design** (20 min)
   - Redesign using design system
   - Ensure consistency

2. **Update Code** (30 min - 1 hour)
   - Replace hardcoded values
   - Use design system components
   - Match Figma exactly

## 📚 Resources

- **Design System File**: `src/design-system/index.ts`
- **Example Screen**: `src/screens/examples/ExampleScreenWithDesignSystem.tsx`
- **Quick Reference**: `docs/DESIGN-SYSTEM-QUICK-REFERENCE.md`
- **Migration Guide**: `docs/MIGRATION-CHECKLIST.md`

## ✅ Success Criteria

Your designs are successfully synced when:

- ✅ All screens use design system tokens
- ✅ No hardcoded colors, spacing, or typography
- ✅ All components are reusable
- ✅ Designs match Figma specifications
- ✅ Consistent look across all 80+ screens
- ✅ Easy to update globally (change once, update everywhere)

---

**Remember**: Design in Figma first, then implement in code. This ensures consistency and makes updates easier!













