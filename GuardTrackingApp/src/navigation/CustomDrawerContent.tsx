import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { logoutUser, updateUserProfile } from '../store/slices/authSlice';
import { LogoutIcon } from '../components/ui/AppIcons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../styles/globalStyles';
import { ProfileAvatar } from '../components/common/ProfileAvatar';
import apiService from '../services/api';

interface DrawerItem {
  id: string;
  label: string;
  onPress: () => void;
}

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { navigation } = props;
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'User';

  const role = user?.role ?? 'GUARD';
  const isVerified = user?.isActive ?? false;

  const handleProfilePictureSelected = async (imageUri: string) => {
    try {
      setIsUploadingPicture(true);
      const uploadResponse = await apiService.uploadProfilePicture(imageUri);
      
      if (uploadResponse.success && uploadResponse.data?.url) {
        if (user?.role === 'GUARD') {
          await apiService.updateGuardProfile({ 
            profilePictureUrl: uploadResponse.data.url 
          });
        }
        await dispatch(updateUserProfile({ 
          profilePictureUrl: uploadResponse.data.url 
        } as any)).unwrap();
        Alert.alert('Success', 'Profile picture updated successfully');
      } else {
        Alert.alert('Error', uploadResponse.message || 'Failed to upload profile picture');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile picture');
    } finally {
      setIsUploadingPicture(false);
    }
  };

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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              navigation.closeDrawer();
              await dispatch(logoutUser()).unwrap();
              // Navigation will be handled by auth state change
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      {/* Header / Profile */}
      <View style={styles.header}>
        <ProfileAvatar
          firstName={user?.firstName}
          lastName={user?.lastName}
          profilePictureUrl={user?.profilePictureUrl}
          size={56}
          editable={true}
          isLoading={isUploadingPicture}
          onImageSelected={handleProfilePictureSelected}
        />
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

      {/* Footer contact support and logout */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSupport} activeOpacity={0.7} style={styles.footerItem}>
          <Text style={styles.supportText}>Contact Support</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleLogout} 
          activeOpacity={0.7} 
          style={[styles.footerItem, styles.logoutItem]}
        >
          <LogoutIcon size={18} color={COLORS.error} />
          <Text style={[styles.supportText, styles.logoutText]}>Logout</Text>
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
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginTop: SPACING.md,
  },
  footerItem: {
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  supportText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.fontPrimary,
    lineHeight: 17,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
  },
  logoutItem: {
    marginTop: SPACING.xs,
  },
  logoutText: {
    color: COLORS.error,
  },
});

export default CustomDrawerContent;
