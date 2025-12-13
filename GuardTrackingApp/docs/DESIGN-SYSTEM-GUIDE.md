# 🎨 Design System Guide - Guard Tracking App

## Overview

This guide explains how to use the unified design system to create consistent, modern, and professional UI throughout the application. The design system is inspired by modern design tools like Figma and follows best practices for mobile app design.

## 📁 File Structure

```
src/
├── design-system/
│   ├── index.ts          # Main design tokens (colors, typography, spacing, etc.)
│   └── components.tsx     # Reusable styled components
└── screens/              # Your screens (use design system here)
```

## 🎯 Quick Start

### 1. Import the Design System

```typescript
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
  CommonStyles,
} from '../design-system';
```

### 2. Use Pre-built Components

```typescript
import {
  DesignSystemButton,
  DesignSystemInput,
  DesignSystemCard,
  DesignSystemBadge,
} from '../design-system/components';
```

## 🎨 Design Tokens

### Colors

```typescript
// Primary colors
Colors.primary           // #1C6CA9 - Main brand color
Colors.primaryLight      // #ACD3F1 - Light variant
Colors.primaryDark       // #0F4A73 - Dark variant

// Semantic colors
Colors.success           // #4CAF50
Colors.warning           // #FF9800
Colors.error             // #F44336
Colors.info              // #2196F3

// Text colors
Colors.text.primary      // #212121
Colors.text.secondary    // #757575
Colors.text.tertiary     // #9E9E9E
Colors.text.inverse      // #FFFFFF

// Background colors
Colors.background.primary    // #FFFFFF
Colors.background.secondary  // #F8F9FA
Colors.background.tertiary   // #F5F7FA

// Border colors
Colors.border.light      // #E0E0E0
Colors.border.medium     // #BDBDBD
Colors.border.focus      // #1C6CA9
```

### Typography

```typescript
// Font sizes
Typography.fontSize.xs      // 12
Typography.fontSize.sm      // 14
Typography.fontSize.md     // 16
Typography.fontSize.lg     // 18
Typography.fontSize.xl      // 20
Typography.fontSize.xxl    // 24

// Font weights
Typography.fontWeight.regular   // '400'
Typography.fontWeight.medium     // '500'
Typography.fontWeight.semibold  // '600'
Typography.fontWeight.bold       // '700'

// Pre-defined text styles
Typography.textStyles.h1
Typography.textStyles.h2
Typography.textStyles.h3
Typography.textStyles.h4
Typography.textStyles.body
Typography.textStyles.bodySmall
Typography.textStyles.caption
Typography.textStyles.label
```

### Spacing (8px base unit)

```typescript
Spacing.xs      // 4px
Spacing.sm      // 8px
Spacing.md      // 12px
Spacing.lg      // 16px
Spacing.xl      // 20px
Spacing.xxl     // 24px
Spacing.xxxl    // 32px
```

### Border Radius

```typescript
BorderRadius.xs     // 4px
BorderRadius.sm     // 6px
BorderRadius.md     // 8px
BorderRadius.lg     // 12px
BorderRadius.xl     // 16px
BorderRadius.round  // 9999px (fully rounded)
```

### Shadows

```typescript
Shadows.none    // No shadow
Shadows.sm      // Small shadow
Shadows.md      // Medium shadow
Shadows.lg      // Large shadow
Shadows.xl      // Extra large shadow
```

## 🧩 Reusable Components

### Button

```typescript
<DesignSystemButton
  title="Click Me"
  onPress={() => {}}
  variant="primary"        // 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
  size="medium"           // 'small' | 'medium' | 'large'
  disabled={false}
  loading={false}
  icon={<Icon />}
  fullWidth={true}
/>
```

### Input

```typescript
<DesignSystemInput
  value={value}
  onChangeText={setValue}
  placeholder="Enter text"
  label="Label"
  error="Error message"
  leftIcon={<Icon />}
  rightIcon={<Icon />}
/>
```

### Card

```typescript
<DesignSystemCard
  title="Card Title"
  subtitle="Card Subtitle"
  variant="elevated"      // 'default' | 'elevated' | 'outlined'
  onPress={() => {}}
>
  <Text>Card content</Text>
</DesignSystemCard>
```

### Badge

```typescript
<DesignSystemBadge
  label="Active"
  variant="success"       // 'primary' | 'success' | 'warning' | 'error' | 'neutral'
  size="medium"          // 'small' | 'medium'
/>
```

## 📝 Example: Creating a Screen

### Before (Inconsistent)

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',  // ❌ Hardcoded color
  },
  title: {
    fontSize: 24,                  // ❌ Hardcoded size
    fontWeight: 'bold',           // ❌ Hardcoded weight
    color: '#000000',             // ❌ Hardcoded color
    marginBottom: 16,             // ❌ Hardcoded spacing
  },
  button: {
    backgroundColor: '#1C6CA9',    // ❌ Hardcoded color
    padding: 12,                  // ❌ Hardcoded spacing
    borderRadius: 8,           // ❌ Hardcoded radius
  },
});
```

### After (Using Design System)

```typescript
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  CommonStyles,
} from '../design-system';
import { DesignSystemButton, DesignSystemCard } from '../design-system/components';

const MyScreen: React.FC = () => {
  return (
    <View style={CommonStyles.container}>
      <Text style={[CommonStyles.textH2, { marginBottom: Spacing.lg }]}>
        Screen Title
      </Text>
      
      <DesignSystemCard title="Card Title" style={{ marginBottom: Spacing.lg }}>
        <Text style={CommonStyles.textBody}>Card content</Text>
      </DesignSystemCard>
      
      <DesignSystemButton
        title="Action"
        onPress={() => {}}
        variant="primary"
        fullWidth
      />
    </View>
  );
};

// Minimal custom styles needed
const styles = StyleSheet.create({
  // Only add styles that aren't covered by design system
});
```

## 🔄 Migration Guide

### Step 1: Replace Hardcoded Colors

**Before:**
```typescript
backgroundColor: '#FFFFFF'
color: '#000000'
borderColor: '#E0E0E0'
```

**After:**
```typescript
backgroundColor: Colors.background.primary
color: Colors.text.primary
borderColor: Colors.border.light
```

### Step 2: Replace Hardcoded Spacing

**Before:**
```typescript
padding: 16
marginBottom: 20
gap: 8
```

**After:**
```typescript
padding: Spacing.lg
marginBottom: Spacing.xl
gap: Spacing.sm
```

### Step 3: Replace Hardcoded Typography

**Before:**
```typescript
fontSize: 24
fontWeight: 'bold'
lineHeight: 28
```

**After:**
```typescript
...Typography.textStyles.h2
// or
fontSize: Typography.fontSize.xxl
fontWeight: Typography.fontWeight.bold
```

### Step 4: Use Common Styles

**Before:**
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
```

**After:**
```typescript
import { CommonStyles } from '../design-system';

// Use directly
<View style={CommonStyles.container}>
<View style={CommonStyles.row}>
```

### Step 5: Replace Custom Components

**Before:**
```typescript
<TouchableOpacity style={styles.button}>
  <Text style={styles.buttonText}>Click</Text>
</TouchableOpacity>
```

**After:**
```typescript
<DesignSystemButton
  title="Click"
  onPress={() => {}}
  variant="primary"
/>
```

## 📋 Screen Checklist

When updating a screen, ensure:

- [ ] All colors use `Colors.*` instead of hardcoded values
- [ ] All spacing uses `Spacing.*` instead of hardcoded values
- [ ] All typography uses `Typography.*` instead of hardcoded values
- [ ] All border radius uses `BorderRadius.*` instead of hardcoded values
- [ ] All shadows use `Shadows.*` instead of hardcoded values
- [ ] Reusable components (Button, Input, Card) use design system components
- [ ] Common styles (container, row, etc.) use `CommonStyles.*`
- [ ] No duplicate style definitions

## 🎨 Design Principles

1. **Consistency**: Use design tokens everywhere
2. **Hierarchy**: Use typography scale for clear information hierarchy
3. **Spacing**: Use 8px base unit for consistent spacing
4. **Colors**: Use semantic colors (success, error, etc.) for status
5. **Shadows**: Use subtle shadows for depth
6. **Accessibility**: Ensure sufficient color contrast

## 🔧 Helper Functions

```typescript
import { getStatusColor, getSeverityColor, getColorWithOpacity } from '../design-system';

// Get color based on status
const statusColor = getStatusColor('active'); // Returns Colors.status.active

// Get color based on severity
const severityColor = getSeverityColor('high'); // Returns Colors.warning

// Get color with opacity
const overlayColor = getColorWithOpacity(Colors.primary, 0.5);
```

## 📚 Additional Resources

- [Material Design Guidelines](https://material.io/design)
- [React Native Styling Best Practices](https://reactnative.dev/docs/style)
- [Design Tokens](https://www.lightningdesignsystem.com/design-tokens/)

## 🆘 Need Help?

If you're unsure about which design token to use:

1. Check existing screens that use the design system
2. Look at `design-system/index.ts` for available tokens
3. Use the pre-built components when possible
4. Follow the examples in this guide

---

**Remember**: The goal is consistency. When in doubt, use the design system tokens instead of creating custom values.

