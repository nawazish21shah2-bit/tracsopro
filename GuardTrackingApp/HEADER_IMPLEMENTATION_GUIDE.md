# SharedHeader Implementation Guide

This document provides a guide for implementing the `SharedHeader` component throughout the app.

## Overview

The `SharedHeader` component is a unified header system that replaces all custom headers and inline header implementations. It supports multiple variants for different user roles and contexts.

## Variants

- **`auth`**: Authentication screens (login, signup, etc.)
- **`dashboard`**: General dashboard screens
- **`client`**: Client-specific screens (includes profile drawer)
- **`guard`**: Guard-specific screens (includes profile drawer)
- **`admin`**: Admin screens (dark blue background)
- **`default`**: Default header (same as dashboard)

## Implementation Pattern

### 1. Client Screens

**Before:**
```tsx
<View style={styles.header}>
  <TouchableOpacity style={styles.menuButton}>
    <MenuIcon size={24} color="#333" />
  </TouchableOpacity>
  <Text style={styles.headerTitle}>Screen Title</Text>
  <TouchableOpacity onPress={handleNotificationPress}>
    <NotificationIcon size={24} color="#333" />
  </TouchableOpacity>
</View>
```

**After:**
```tsx
import SharedHeader from '../../components/ui/SharedHeader';
import ClientProfileDrawer from '../../components/client/ClientProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';

const MyScreen: React.FC = () => {
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const navigation = useNavigation();

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="client"
        title="Screen Title"
        onNotificationPress={() => navigation.navigate('ClientNotifications')}
        profileDrawer={
          <ClientProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToNotifications={() => {
              closeDrawer();
              navigation.navigate('ClientNotifications');
            }}
          />
        }
      />
      {/* Rest of content */}
    </SafeAreaWrapper>
  );
};
```

### 2. Guard Screens

**Before:**
```tsx
import { AppHeader } from '../../components/ui/AppHeader';

<AppHeader
  title="My Shifts"
  onMenuPress={handleMenuPress}
  onNotificationPress={handleNotificationPress}
/>
```

**After:**
```tsx
import SharedHeader from '../../components/ui/SharedHeader';
import GuardProfileDrawer from '../../components/guard/GuardProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';

const MyScreen: React.FC = () => {
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();

  return (
    <View style={styles.container}>
      <SharedHeader
        variant="guard"
        title="My Shifts"
        onNotificationPress={handleNotificationPress}
        profileDrawer={
          <GuardProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
          />
        }
      />
      {/* Rest of content */}
    </View>
  );
};
```

### 3. Admin Screens

**Before:**
```tsx
<View style={styles.header}>
  <TouchableOpacity onPress={() => navigation.goBack()}>
    <Text style={styles.backButton}>← Back</Text>
  </TouchableOpacity>
  <Text style={styles.headerTitle}>Admin Settings</Text>
</View>
```

**After:**
```tsx
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';

<SafeAreaWrapper>
  <SharedHeader
    variant="admin"
    adminName="Admin Settings"
    onSettingsPress={handleLogout}
  />
  {/* Rest of content */}
</SafeAreaWrapper>
```

### 4. Dashboard/General Screens

**Before:**
```tsx
<View style={styles.header}>
  <Text style={styles.headerTitle}>Dashboard</Text>
  <TouchableOpacity onPress={handleNotificationPress}>
    <NotificationIcon size={24} />
  </TouchableOpacity>
</View>
```

**After:**
```tsx
import SharedHeader from '../../components/ui/SharedHeader';

<SharedHeader
  variant="dashboard"
  title="Dashboard"
  onNotificationPress={handleNotificationPress}
  notificationCount={5}
/>
```

## Key Points

1. **Remove inline headers**: Replace all `<View style={styles.header}>` blocks with `SharedHeader`
2. **Remove header styles**: Delete `styles.header`, `styles.headerTitle`, `styles.menuButton` from StyleSheet
3. **Import hooks**: For client/guard screens, import `useProfileDrawer` hook
4. **Profile drawers**: Always include the appropriate profile drawer component for client/guard variants
5. **SafeAreaWrapper**: Use `SafeAreaWrapper` instead of `SafeAreaView` for consistency

## Screens Already Updated

✅ ClientDashboard
✅ AdminDashboard
✅ GuardHomeScreen (dashboard)
✅ MyShiftsScreen
✅ ClientSites
✅ ClientGuards
✅ ClientNotifications
✅ ClientReports
✅ ClientSettings
✅ JobsScreen
✅ ReportsScreen
✅ AdminSettingsScreen
✅ SiteManagementScreen
✅ UserManagementScreen
✅ DashboardScreen (main)

## Remaining Screens to Update

### Client Screens
- ClientDashboardScreen
- ClientAnalyticsDashboard
- AddSiteScreen
- SiteDetailsScreen
- CreateShiftScreen
- PaymentScreen

### Guard Screens
- AvailableShiftsScreen
- ApplyForShiftScreen
- CheckInOutScreen

### Admin Screens
- AdminOperationsCenter
- AdminAnalyticsScreen
- ShiftSchedulingScreen
- IncidentReviewScreen

### Other Screens
- All screens in `screens/main/` directory
- All screens in `screens/incident/` directory
- All screens in `screens/chat/` directory
- All screens in `screens/superAdmin/` directory

## Notes

- Auth screens already use `AuthHeader` which wraps `SharedHeader` with `variant="auth"`
- Some screens may need custom `rightIcon` or `leftIcon` props for additional buttons
- Notification counts should be passed via `notificationCount` prop
- For screens with back navigation, use `leftIcon` prop with a back button component

