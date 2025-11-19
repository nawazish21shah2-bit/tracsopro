import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../styles/globalStyles';

interface DrawerItem {
  id: string;
  label: string;
  onPress: () => void;
}

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { navigation } = props;
  const { user } = useSelector((state: RootState) => state.auth);

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Mark Husdon';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');

  const role = user?.role ?? 'GUARD';
  const isVerified = user?.isActive ?? false;

  const goHome = () => {
    navigation.navigate('MainTabs');
    navigation.closeDrawer();
  };

  const goSettings = () => {
    navigation.navigate('Settings');
    navigation.closeDrawer();
  };

  // Build role-specific menu
  const items: DrawerItem[] = [];

  if (role === 'GUARD') {
    items.push(
      { id: 'past_jobs', label: 'Past Jobs', onPress: goHome },
      { id: 'assigned_sites', label: 'Assigned Sites', onPress: goHome },
      { id: 'attendance', label: 'Attendance Record', onPress: goHome },
      { id: 'earnings', label: 'Earnings', onPress: goHome },
      { id: 'notifications', label: 'Notification Settings', onPress: goSettings },
    );
  } else if (role === 'CLIENT') {
    items.push(
      { id: 'dashboard', label: 'Dashboard', onPress: goHome },
      { id: 'sites', label: 'Sites & Shifts', onPress: goHome },
      { id: 'reports', label: 'Reports', onPress: goHome },
      { id: 'guards', label: 'Guards', onPress: goHome },
      { id: 'notifications', label: 'Notification Settings', onPress: goSettings },
    );
  } else if (role === 'ADMIN') {
    items.push(
      { id: 'dashboard', label: 'Dashboard', onPress: goHome },
      { id: 'operations', label: 'Operations Center', onPress: goHome },
      { id: 'management', label: 'Management', onPress: goHome },
      { id: 'reports', label: 'Reports & Analytics', onPress: goHome },
      { id: 'settings', label: 'Admin Settings', onPress: goSettings },
    );
  } else {
    // SUPER_ADMIN or fallback
    items.push(
      { id: 'dashboard', label: 'Dashboard', onPress: goHome },
      { id: 'companies', label: 'Companies', onPress: goHome },
      { id: 'analytics', label: 'Platform Analytics', onPress: goHome },
      { id: 'billing', label: 'Billing', onPress: goHome },
      { id: 'settings', label: 'System Settings', onPress: goSettings },
    );
  }

  const handleSupport = () => {
    // For now, just close drawer; you can later navigate to a support screen
    navigation.closeDrawer();
  };

  return (
    <View style={styles.container}>
      {/* Header / Profile */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{fullName}</Text>
          {isVerified && (
            <View style={styles.verifiedRow}>
              <Text style={styles.verifiedText}>Verified</Text>
              <View style={styles.verifiedDot} />
            </View>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Menu items */}
      <View style={styles.menuSection}>
        {items.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer contact support */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSupport} activeOpacity={0.7}>
          <Text style={styles.supportText}>Contact Support</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'column',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  profileInfo: {
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginTop: 6,
    marginBottom: 4,
    fontFamily: TYPOGRAPHY.fontPrimary,
    lineHeight: 22,
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  verifiedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
  menuSection: {
    flexGrow: 1,
  },
  menuItem: {
    paddingVertical: 22,
  },
  menuLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.fontPrimary,
    lineHeight: 17,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
  },
  footer: {
    paddingVertical: 24,
  },
  supportText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.fontPrimary,
    lineHeight: 17,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
  },
});

export default CustomDrawerContent;
