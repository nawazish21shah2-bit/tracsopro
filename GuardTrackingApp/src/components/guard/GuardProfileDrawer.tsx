import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { 
  CheckCircleIcon,
  UserIcon,
  ShiftsIcon,
  LocationIcon,
  NotificationIcon,
  LogoutIcon,
  ReportsIcon,
  DollarIcon,
} from '../ui/AppIcons';
import { FeatherIcon } from '../ui/FeatherIcons';
import { GuardStackParamList } from '../../navigation/GuardStackNavigator';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';

interface GuardProfileDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToPastJobs?: () => void;
  onNavigateToAssignedSites?: () => void;
  onNavigateToAttendance?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToSupport?: () => void;
  onNavigateToEarnings?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  showDivider?: boolean;
}

type GuardProfileDrawerNavigationProp = StackNavigationProp<GuardStackParamList>;

export const GuardProfileDrawer: React.FC<GuardProfileDrawerProps> = ({
  visible,
  onClose,
  onNavigateToProfile,
  onNavigateToPastJobs,
  onNavigateToAssignedSites,
  onNavigateToAttendance,
  onNavigateToNotifications,
  onNavigateToSupport,
  onNavigateToEarnings,
}) => {
  const navigation = useNavigation<GuardProfileDrawerNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Animation for slide from left
  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width)).current;
  
  useEffect(() => {
    if (visible) {
      // Slide in from left
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide out to left
      Animated.timing(slideAnim, {
        toValue: -Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleMyProfile = () => {
    onClose();
    onNavigateToProfile?.();
    // Navigate to profile/settings screen when available
  };

  const handlePastJobs = () => {
    onClose();
    // Navigate to My Shifts tab with past filter
    try {
      // Navigate to GuardTabs (which contains the tab navigator)
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('GuardTabs', { screen: 'My Shifts' });
      } else {
        navigation.navigate('GuardTabs');
      }
    } catch (error) {
      // Fallback: navigate to GuardTabs and let user switch manually
      navigation.navigate('GuardTabs');
    }
    onNavigateToPastJobs?.();
  };

  const handleAssignedSites = () => {
    onClose();
    // Navigate to Jobs tab to see assigned sites
    try {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('GuardTabs', { screen: 'Jobs' });
      } else {
        navigation.navigate('GuardTabs');
      }
    } catch (error) {
      navigation.navigate('GuardTabs');
    }
    onNavigateToAssignedSites?.();
  };

  const handleAttendanceRecord = () => {
    onClose();
    // Navigate to My Shifts tab
    try {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('GuardTabs', { screen: 'My Shifts' });
      } else {
        navigation.navigate('GuardTabs');
      }
    } catch (error) {
      navigation.navigate('GuardTabs');
    }
    onNavigateToAttendance?.();
  };

  const handleEarnings = () => {
    onClose();
    // Navigate to Reports tab for earnings
    try {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('GuardTabs', { screen: 'Reports' });
      } else {
        navigation.navigate('GuardTabs');
      }
    } catch (error) {
      navigation.navigate('GuardTabs');
    }
    onNavigateToEarnings?.();
  };

  const handleNotificationSettings = () => {
    onClose();
    // Navigate to settings or notifications screen
    onNavigateToNotifications?.();
  };

  const handleContactSupport = () => {
    onClose();
    // Navigate to support/chat
    navigation.navigate('ChatListScreen');
    onNavigateToSupport?.();
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
              setIsLoggingOut(true);
              onClose();
              await dispatch(logoutUser());
              // Navigation will be handled by auth state change
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: <UserIcon size={20} color={COLORS.textPrimary} />,
      onPress: handleMyProfile,
    },
    {
      id: 'pastJobs',
      label: 'Past Jobs',
      icon: <ShiftsIcon size={20} color={COLORS.textPrimary} />,
      onPress: handlePastJobs,
    },
    {
      id: 'assignedSites',
      label: 'Assigned Sites',
      icon: <LocationIcon size={20} color={COLORS.textPrimary} />,
      onPress: handleAssignedSites,
    },
    {
      id: 'attendance',
      label: 'Attendance Record',
      icon: <ReportsIcon size={20} color={COLORS.textPrimary} />,
      onPress: handleAttendanceRecord,
    },
    {
      id: 'earnings',
      label: 'Earnings',
      icon: <DollarIcon size={20} color={COLORS.textPrimary} />,
      onPress: handleEarnings,
    },
    {
      id: 'notifications',
      label: 'Notification Settings',
      icon: <NotificationIcon size={20} color={COLORS.textPrimary} />,
      onPress: handleNotificationSettings,
    },
  ];

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Mark Husdon';
  const isVerified = user?.isActive ?? true;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {fullName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </Text>
              </View>
            </View>
            <Text style={styles.userName}>{fullName}</Text>
            {isVerified && (
              <View style={styles.verifiedContainer}>
                <Text style={styles.verifiedText}>Verified</Text>
                <CheckCircleIcon size={14} color={COLORS.textSecondary} />
              </View>
            )}
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemContent}>
                  <View style={styles.menuIcon}>{item.icon}</View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.supportButton}
              onPress={handleContactSupport}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.menuIcon}>
                  <FeatherIcon name="messageCircle" size={20} color={COLORS.textSecondary} />
                </View>
                <Text style={styles.supportText}>Contact Support</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
              onPress={handleLogout}
              activeOpacity={0.7}
              disabled={isLoggingOut}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.menuIcon}>
                  <LogoutIcon size={20} color={COLORS.error} />
                </View>
                <Text style={styles.logoutText}>
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  drawer: {
    width: '70%',
    maxWidth: 320,
    backgroundColor: COLORS.backgroundPrimary,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  userName: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: 8,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontFamily: TYPOGRAPHY.fontPrimary,
    flex: 1,
  },
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  supportButton: {
    paddingVertical: 12,
  },
  supportText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  logoutButton: {
    paddingVertical: 12,
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  logoutText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
});

export default GuardProfileDrawer;
