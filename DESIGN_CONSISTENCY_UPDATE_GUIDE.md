# Design Consistency Update Guide

## Tab Navigation - ✅ COMPLETED
All tab navigators now use:
- **Active**: Primary background (#1C6CA9) + White icon (#FFFFFF)
- **Inactive**: Light grey background (#F5F5F5) + Dark grey icon (#5A5A5A)

Updated files:
- ✅ DashboardNavigator.tsx
- ✅ ClientNavigator.tsx
- ✅ AdminNavigator.tsx
- ✅ SuperAdminNavigator.tsx
- ✅ BottomTabBar.tsx

## Screen Design Patterns

### 1. Card Styles

#### Border-Only Cards (for lists/content)
```typescript
card: {
  backgroundColor: COLORS.backgroundPrimary,
  borderRadius: BORDER_RADIUS.md,
  padding: SPACING.lg,
  marginBottom: SPACING.md,
  borderWidth: 1,
  borderColor: COLORS.borderCard,
  // NO shadow - minimal style
}
```

#### Soft Shadow Cards (for interactive elements)
```typescript
card: {
  backgroundColor: COLORS.backgroundPrimary,
  borderRadius: BORDER_RADIUS.md,
  padding: SPACING.lg,
  marginBottom: SPACING.md,
  ...SHADOWS.small, // Soft shadow only
}
```

### 2. Spacing Standards

```typescript
// Section gaps
section: {
  marginBottom: SPACING.sectionGap || SPACING.xxl, // 24px
  padding: SPACING.formPadding || SPACING.lg, // 16px
}

// Field gaps
inputGroup: {
  marginBottom: SPACING.fieldGap || SPACING.lg, // 16px
}

// Form padding
formContainer: {
  padding: SPACING.formPadding || SPACING.lg, // 16px
}
```

### 3. Shadow Usage

**Use soft shadows ONLY for:**
- Buttons
- Floating action buttons
- Modals
- Interactive cards (that can be pressed)

**Use border-only for:**
- List items
- Content cards
- Static information displays

## Screens to Update

### Priority 1: Dashboard Screens
- [ ] GuardHomeScreen.tsx
- [ ] ClientDashboard.tsx
- [ ] AdminDashboard.tsx
- [ ] SuperAdminDashboard.tsx

### Priority 2: List Screens
- [ ] MyShiftsScreen.tsx
- [ ] AvailableShiftsScreen.tsx
- [ ] ReportsScreen.tsx
- [ ] ClientSites.tsx
- [ ] ClientGuards.tsx

### Priority 3: Form Screens
- [ ] CreateShiftScreen.tsx
- [ ] ApplyForShiftScreen.tsx
- [ ] CheckInOutScreen.tsx
- [ ] ProfileEditScreen.tsx

### Priority 4: Other Screens
- [ ] AdminOperationsCenter.tsx
- [ ] IncidentReviewScreen.tsx
- [ ] SiteManagementScreen.tsx

## Update Checklist for Each Screen

- [ ] Replace hardcoded spacing with SPACING constants
- [ ] Replace hardcoded colors with COLORS constants
- [ ] Update cards: border-only for lists, soft shadows for interactive
- [ ] Ensure consistent section gaps (24px)
- [ ] Ensure consistent field gaps (16px)
- [ ] Remove heavy shadows, use SHADOWS.small only where needed
- [ ] Use BORDER_RADIUS constants
- [ ] Use TYPOGRAPHY constants

## Common Patterns to Replace

### Old Shadow Pattern:
```typescript
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,
elevation: 2,
```

### New Shadow Pattern:
```typescript
...SHADOWS.small, // or SHADOWS.medium for buttons
```

### Old Spacing:
```typescript
marginBottom: 16,
padding: 20,
```

### New Spacing:
```typescript
marginBottom: SPACING.fieldGap || SPACING.lg,
padding: SPACING.formPadding || SPACING.lg,
```

