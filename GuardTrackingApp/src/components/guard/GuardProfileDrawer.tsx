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
    // Navigate to notification settings screen
    try {
      navigation.navigate('GuardNotificationSettings');
    } catch (error) {
      console.error('Navigation error:', error);
      onNavigateToNotifications?.();
    }
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
    {
      id: 'support',
      label: 'Contact Support',
      icon: <FeatherIcon name="messageCircle" size={20} color={COLORS.textPrimary} />,
      onPress: handleContactSupport,
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: <LogoutIcon size={20} color={COLORS.error} />,
      onPress: handleLogout,
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
                <CheckCircleIcon size={14} color={COLORS.textPrimary} />
              </View>
            )}
            <View style={styles.separator} />
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
                disabled={item.id === 'logout' && isLoggingOut}
              >
                <View style={styles.menuItemContent}>
                  <View style={styles.menuIcon}>{item.icon}</View>
                  <Text style={[
                    styles.menuLabel,
                    item.id === 'logout' && styles.logoutLabel,
                  ]}>
                    {item.id === 'logout' && isLoggingOut ? 'Logging out...' : item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    paddingTop: SPACING.xl * 2,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    shadowColor: COLORS.cardShadow,
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  avatarContainer: {
    marginBottom: SPACING.md,
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
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  verifiedText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginTop: SPACING.lg,
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
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
    marginRight: SPACING.md,
  },
  menuLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    fontFamily: TYPOGRAPHY.fontPrimary,
    flex: 1,
  },
  logoutLabel: {
    color: COLORS.error,
  },
});

export default GuardProfileDrawer;
