# 🚀 Design System Quick Reference

Quick lookup guide for common design system usage patterns.

## 📦 Import

```typescript
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  CommonStyles,
} from '../design-system';
import {
  DesignSystemButton,
  DesignSystemInput,
  DesignSystemCard,
  DesignSystemBadge,
} from '../design-system/components';
```

## 🎨 Most Common Colors

```typescript
Colors.primary              // Main brand color
Colors.background.primary   // White background
Colors.background.secondary // Light gray background
Colors.text.primary         // Dark text
Colors.text.secondary       // Gray text
Colors.border.light         // Light border
Colors.success             // Green
Colors.error               // Red
Colors.warning             // Orange
```

## 📏 Most Common Spacing

```typescript
Spacing.xs   // 4px  - Very tight spacing
Spacing.sm   // 8px  - Small spacing
Spacing.md   // 12px - Medium spacing
Spacing.lg   // 16px - Large spacing (most common)
Spacing.xl   // 20px - Extra large spacing
Spacing.xxl  // 24px - Section spacing
```

## ✍️ Most Common Typography

```typescript
// Pre-defined styles (recommended)
Typography.textStyles.h1      // Large heading
Typography.textStyles.h2      // Medium heading
Typography.textStyles.h3      // Small heading
Typography.textStyles.body    // Body text
Typography.textStyles.caption // Small text

// Or individual properties
fontSize: Typography.fontSize.md
fontWeight: Typography.fontWeight.medium
```

## 🔲 Most Common Border Radius

```typescript
BorderRadius.sm    // 6px  - Small elements
BorderRadius.md    // 8px  - Buttons, inputs
BorderRadius.lg    // 12px - Cards (most common)
BorderRadius.round // 9999px - Fully rounded
```

## 💎 Most Common Shadows

```typescript
Shadows.none  // No shadow
Shadows.sm    // Subtle shadow (cards)
Shadows.md    // Medium shadow (elevated cards)
Shadows.lg    // Large shadow (modals)
```

## 🧩 Component Usage

### Button
```typescript
<DesignSystemButton
  title="Click Me"
  onPress={() => {}}
  variant="primary"
  fullWidth
/>
```

### Input
```typescript
<DesignSystemInput
  value={value}
  onChangeText={setValue}
  placeholder="Enter text"
  label="Label"
/>
```

### Card
```typescript
<DesignSystemCard
  title="Card Title"
  variant="elevated"
>
  <Text>Content</Text>
</DesignSystemCard>
```

### Badge
```typescript
<DesignSystemBadge
  label="Active"
  variant="success"
/>
```

## 📐 Common Layout Patterns

### Container
```typescript
<View style={CommonStyles.container}>
  {/* Content */}
</View>
```

### Row Layout
```typescript
<View style={CommonStyles.rowSpaceBetween}>
  <Text>Left</Text>
  <Text>Right</Text>
</View>
```

### Card with Padding
```typescript
<View style={[CommonStyles.card, { marginBottom: Spacing.lg }]}>
  {/* Content */}
</View>
```

## 🔄 Common Replacements

| Old | New |
|-----|-----|
| `#FFFFFF` | `Colors.background.primary` |
| `#000000` | `Colors.text.primary` |
| `#1C6CA9` | `Colors.primary` |
| `16` | `Spacing.lg` |
| `12` | `Spacing.md` |
| `8` | `Spacing.sm` |
| `fontSize: 24` | `...Typography.textStyles.h2` |
| `borderRadius: 8` | `BorderRadius.md` |

## 🎯 Quick Patterns

### Screen Container
```typescript
<SafeAreaView style={CommonStyles.container}>
  <ScrollView style={{ padding: Spacing.lg }}>
    {/* Content */}
  </ScrollView>
</SafeAreaView>
```

### Section Header
```typescript
<View style={{ marginBottom: Spacing.lg }}>
  <Text style={Typography.textStyles.h3}>Section Title</Text>
  <Text style={[Typography.textStyles.bodySmall, { marginTop: Spacing.xs }]}>
    Section description
  </Text>
</View>
```

### Status Badge
```typescript
<DesignSystemBadge
  label={status}
  variant={status === 'active' ? 'success' : 'neutral'}
/>
```

### Action Button
```typescript
<DesignSystemButton
  title="Save"
  onPress={handleSave}
  variant="primary"
  fullWidth
  style={{ marginTop: Spacing.xl }}
/>
```

---

**Tip**: Keep this file open while migrating screens for quick reference!

