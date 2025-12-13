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
  LocationIcon,
  UserIcon as GuardsIcon,
  ReportsIcon,
  SettingsIcon,
  NotificationIcon,
  LogoutIcon,
} from '../ui/AppIcons';
import { FeatherIcon } from '../ui/FeatherIcons';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';

interface ClientProfileDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToSites?: () => void;
  onNavigateToGuards?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToSupport?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  showDivider?: boolean;
}

type ClientProfileDrawerNavigationProp = StackNavigationProp<ClientStackParamList>;

export const ClientProfileDrawer: React.FC<ClientProfileDrawerProps> = ({
  visible,
  onClose,
  onNavigateToProfile,
  onNavigateToSites,
  onNavigateToGuards,
  onNavigateToReports,
  onNavigateToAnalytics,
  onNavigateToNotifications,
  onNavigateToSupport,
}) => {
  const navigation = useNavigation<ClientProfileDrawerNavigationProp>();
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
    // Navigate to Settings tab for profile
    try {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('ClientTabs', { screen: 'Settings' });
      } else {
        navigation.navigate('ClientTabs');
      }
    } catch (error) {
      // Fallback: navigate to ClientTabs and let user switch manually
      navigation.navigate('ClientTabs');
    }
    onNavigateToProfile?.();
  };

  const handleManageSites = () => {
    onClose();
    // Navigate to Sites & Shifts tab
    try {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('ClientTabs', { screen: 'Sites & Shifts' });
      } else {
        navigation.navigate('ClientTabs');
      }
    } catch (error) {
      navigation.navigate('ClientTabs');
    }
    onNavigateToSites?.();
  };

  const handleManageGuards = () => {
    onClose();
    // Navigate to Guards tab
    try {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('ClientTabs', { screen: 'Guards' });
      } else {
        navigation.navigate('ClientTabs');
      }
    } catch (error) {
      navigation.navigate('ClientTabs');
    }
    onNavigateToGuards?.();
  };

  const handleViewReports = () => {
    onClose();
    // Navigate to Reports tab
    try {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('ClientTabs', { screen: 'Reports' });
      } else {
        navigation.navigate('ClientTabs');
      }
    } catch (error) {
      navigation.navigate('ClientTabs');
    }
    onNavigateToReports?.();
  };

  const handleAnalytics = () => {
    onClose();
    // Navigate to Reports tab (analytics can be part of reports)
    try {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('ClientTabs', { screen: 'Reports' });
      } else {
        navigation.navigate('ClientTabs');
      }
    } catch (error) {
      navigation.navigate('ClientTabs');
    }
    onNavigateToAnalytics?.();
  };

  const handleNotificationSettings = () => {
    onClose();
    // Navigate to Settings tab
    try {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('ClientTabs', { screen: 'Settings' });
      } else {
        navigation.navigate('ClientTabs');
      }
    } catch (error) {
      navigation.navigate('ClientTabs');
    }
    onNavigateToNotifications?.();
  };

  const handleContactSupport = () => {
    onClose();
    // Navigate to chat/support
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
      id: 'sites',
      label: 'Assigned Sites',
      icon: <LocationIcon size={20} color={COLORS.textPrimary} />,
      onPress: handleManageSites,
    },
    {
      id: 'guards',
      label: 'Manage Guards',
      icon: <GuardsIcon size={20} color={COLORS.textPrimary} />,
      onPress: handleManageGuards,
    },
    {
      id: 'reports',
      label: 'View Reports',
      icon: <ReportsIcon size={20} color={COLORS.textPrimary} />,
      onPress: handleViewReports,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <ReportsIcon size={20} color={COLORS.textPrimary} />,
      onPress: handleAnalytics,
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

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Client Name';
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

export default ClientProfileDrawer;
