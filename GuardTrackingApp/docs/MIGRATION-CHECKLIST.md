# 🔄 UI Migration Checklist

This checklist helps you systematically update your screens to use the unified design system.

## 📋 Pre-Migration Steps

- [ ] Read the [Design System Guide](./DESIGN-SYSTEM-GUIDE.md)
- [ ] Review the [Example Screen](../src/screens/examples/ExampleScreenWithDesignSystem.tsx)
- [ ] Identify all screens that need updating
- [ ] Prioritize screens (start with most visible/important ones)

## 🎯 Migration Steps for Each Screen

### Step 1: Update Imports

- [ ] Remove old style imports (if any)
- [ ] Add design system imports:
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

### Step 2: Replace Colors

- [ ] Replace `#FFFFFF` → `Colors.background.primary`
- [ ] Replace `#000000` → `Colors.text.primary`
- [ ] Replace `#1C6CA9` → `Colors.primary`
- [ ] Replace `#F8F9FA` → `Colors.background.secondary`
- [ ] Replace `#E0E0E0` → `Colors.border.light`
- [ ] Replace `#757575` → `Colors.text.secondary`
- [ ] Replace `#4CAF50` → `Colors.success`
- [ ] Replace `#F44336` → `Colors.error`
- [ ] Replace `#FF9800` → `Colors.warning`
- [ ] Replace any other hardcoded colors with appropriate `Colors.*` values

### Step 3: Replace Spacing

- [ ] Replace `4` → `Spacing.xs`
- [ ] Replace `8` → `Spacing.sm`
- [ ] Replace `12` → `Spacing.md`
- [ ] Replace `16` → `Spacing.lg`
- [ ] Replace `20` → `Spacing.xl`
- [ ] Replace `24` → `Spacing.xxl`
- [ ] Replace `32` → `Spacing.xxxl`
- [ ] Replace any other spacing values with `Spacing.*`

### Step 4: Replace Typography

- [ ] Replace hardcoded `fontSize` with `Typography.fontSize.*`
- [ ] Replace hardcoded `fontWeight` with `Typography.fontWeight.*`
- [ ] Use `Typography.textStyles.*` for common text patterns
- [ ] Replace hardcoded `lineHeight` with `Typography.lineHeight.*`

### Step 5: Replace Border Radius

- [ ] Replace `4` → `BorderRadius.xs`
- [ ] Replace `6` → `BorderRadius.sm`
- [ ] Replace `8` → `BorderRadius.md`
- [ ] Replace `12` → `BorderRadius.lg`
- [ ] Replace `16` → `BorderRadius.xl`
- [ ] Replace `9999` → `BorderRadius.round`

### Step 6: Replace Shadows

- [ ] Replace custom shadow objects with `Shadows.sm`, `Shadows.md`, `Shadows.lg`
- [ ] Remove hardcoded shadow properties

### Step 7: Use Common Styles

- [ ] Replace custom `container` styles with `CommonStyles.container`
- [ ] Replace custom `row` styles with `CommonStyles.row`
- [ ] Replace custom `centered` styles with `CommonStyles.center`
- [ ] Use other `CommonStyles.*` where applicable

### Step 8: Replace Components

- [ ] Replace custom `Button` components with `DesignSystemButton`
- [ ] Replace custom `Input` components with `DesignSystemInput`
- [ ] Replace custom `Card` components with `DesignSystemCard`
- [ ] Replace custom `Badge` components with `DesignSystemBadge`

### Step 9: Clean Up Styles

- [ ] Remove unused style definitions
- [ ] Consolidate duplicate styles
- [ ] Remove hardcoded values that are now in design system
- [ ] Keep only screen-specific styles that aren't covered by design system

### Step 10: Test

- [ ] Visual check: Does the screen look consistent with design system?
- [ ] Functionality: Do all interactions work correctly?
- [ ] Responsiveness: Does it work on different screen sizes?
- [ ] Dark mode: If applicable, test dark mode support

## 📝 Screen-Specific Checklist

### Auth Screens
- [ ] LoginScreen
- [ ] RegisterScreen
- [ ] ForgotPasswordScreen
- [ ] ResetPasswordScreen
- [ ] RoleSelectionScreen
- [ ] OTP screens

### Dashboard Screens
- [ ] GuardHomeScreen
- [ ] ClientDashboard
- [ ] AdminDashboard
- [ ] SuperAdminDashboard

### Feature Screens
- [ ] TrackingScreen
- [ ] IncidentsScreen
- [ ] ReportsScreen
- [ ] MessagesScreen
- [ ] SettingsScreen

### Client Screens
- [ ] ClientSites
- [ ] AddSiteScreen
- [ ] SiteDetailsScreen
- [ ] CreateShiftScreen
- [ ] ClientReports

### Guard Screens
- [ ] AvailableShiftsScreen
- [ ] ApplyForShiftScreen
- [ ] CheckInOutScreen
- [ ] GuardHomeScreen

### Admin Screens
- [ ] UserManagementScreen
- [ ] SiteManagementScreen
- [ ] ShiftSchedulingScreen
- [ ] AdminOperationsCenter

## 🎨 Design System Compliance

After migration, verify:

- [ ] No hardcoded colors remain
- [ ] No hardcoded spacing values remain
- [ ] No hardcoded typography values remain
- [ ] All buttons use `DesignSystemButton`
- [ ] All inputs use `DesignSystemInput`
- [ ] All cards use `DesignSystemCard`
- [ ] All badges use `DesignSystemBadge`
- [ ] Consistent spacing throughout
- [ ] Consistent typography hierarchy
- [ ] Consistent color usage

## 🔍 Code Review Checklist

When reviewing migrated code:

- [ ] Are design system imports present?
- [ ] Are hardcoded values replaced?
- [ ] Are reusable components used?
- [ ] Is the code cleaner and more maintainable?
- [ ] Are there any inconsistencies?

## 📊 Progress Tracking

Track your migration progress:

```
Total Screens: ___
Migrated: ___
Remaining: ___
Progress: ___%
```

## 🚀 Quick Migration Tips

1. **Start Small**: Begin with one screen to understand the pattern
2. **Use Find & Replace**: For common patterns like `#FFFFFF` → `Colors.background.primary`
3. **Component First**: Replace components (Button, Input) first, then styles
4. **Test Frequently**: Test after each screen migration
5. **Document Issues**: Note any design system gaps or needed additions

## ❓ Common Issues & Solutions

### Issue: Design system doesn't have a specific color I need
**Solution**: Check if it exists under a different name, or add it to the design system if it's truly needed

### Issue: Component doesn't support a feature I need
**Solution**: Extend the component in `design-system/components.tsx` or create a variant

### Issue: Screen looks different after migration
**Solution**: Review the design system values - they may be intentionally different for consistency

## 📚 Resources

- [Design System Guide](./DESIGN-SYSTEM-GUIDE.md)
- [Example Screen](../src/screens/examples/ExampleScreenWithDesignSystem.tsx)
- [Design System Source](../src/design-system/index.ts)

---

**Remember**: The goal is consistency and maintainability. Take your time to do it right!

