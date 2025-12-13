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
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { 
  UserIcon,
  UsersIcon,
  ReportsIcon,
  SettingsIcon,
  NotificationIcon,
  LogoutIcon,
  DashboardIcon,
  CheckCircleIcon,
} from '../ui/AppIcons';
import { FeatherIcon } from '../ui/FeatherIcons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';

interface SuperAdminProfileDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToCompanies?: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToBilling?: () => void;
  onNavigateToSystemSettings?: () => void;
  onNavigateToAuditLogs?: () => void;
  onNavigateToNotifications?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  showDivider?: boolean;
}

export const SuperAdminProfileDrawer: React.FC<SuperAdminProfileDrawerProps> = ({
  visible,
  onClose,
  onNavigateToProfile,
  onNavigateToCompanies,
  onNavigateToAnalytics,
  onNavigateToBilling,
  onNavigateToSystemSettings,
  onNavigateToAuditLogs,
  onNavigateToNotifications,
}) => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Animation for slide from left
  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width)).current;
  
  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleLogout = async () => {
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
              await dispatch(logoutUser()).unwrap();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    onClose();
    navigation.navigate('ChatListScreen');
  };

  const menuItems: MenuItem[] = [
    {
      id: 'companies',
      label: 'Company Management',
      icon: <UsersIcon size={20} color={COLORS.textPrimary} />,
      onPress: () => {
        onClose();
        navigation.navigate('Companies');
        onNavigateToCompanies?.();
      },
    },
    {
      id: 'analytics',
      label: 'Platform Analytics',
      icon: <DashboardIcon size={20} color={COLORS.textPrimary} />,
      onPress: () => {
        onClose();
        navigation.navigate('Analytics');
        onNavigateToAnalytics?.();
      },
    },
    {
      id: 'billing',
      label: 'Billing Management',
      icon: <ReportsIcon size={20} color={COLORS.textPrimary} />,
      onPress: () => {
        onClose();
        navigation.navigate('Billing');
        onNavigateToBilling?.();
      },
    },
    {
      id: 'system',
      label: 'System Settings',
      icon: <SettingsIcon size={20} color={COLORS.textPrimary} />,
      onPress: () => {
        onClose();
        navigation.navigate('Settings');
        onNavigateToSystemSettings?.();
      },
    },
    {
      id: 'audit',
      label: 'Audit Logs',
      icon: <ReportsIcon size={20} color={COLORS.textPrimary} />,
      onPress: () => {
        onClose();
        navigation.navigate('AuditLogs');
        onNavigateToAuditLogs?.();
      },
    },
    {
      id: 'notifications',
      label: 'Notification Settings',
      icon: <NotificationIcon size={20} color={COLORS.textPrimary} />,
      onPress: () => {
        onClose();
        onNavigateToNotifications?.();
      },
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

  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Super Admin';
  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'SA';
  const isVerified = user?.isActive ?? true;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.drawerContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{userInitials}</Text>
                </View>
              </View>
              <Text style={styles.userName}>{userName}</Text>
              {isVerified && (
                <View style={styles.verifiedContainer}>
                  <Text style={styles.verifiedText}>Verified</Text>
                  <CheckCircleIcon size={14} color={COLORS.textPrimary} />
                </View>
              )}
              <View style={styles.separator} />
            </View>

            {/* Menu Items */}
            <View style={styles.menuContainer}>
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
            </View>
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
  drawerContainer: {
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
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  avatarContainer: {
    marginBottom: SPACING.md,
  },
  avatar: {
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
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
    flex: 1,
  },
  logoutLabel: {
    color: COLORS.error,
  },
});

export default SuperAdminProfileDrawer;

