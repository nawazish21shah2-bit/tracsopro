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
} from '../ui/AppIcons';
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

  const menuItems: MenuItem[] = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: <UserIcon size={20} color={COLORS.textPrimary} />,
      onPress: () => {
        onClose();
        onNavigateToProfile?.();
      },
    },
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
      showDivider: true,
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

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.drawerContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
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
              <Text style={styles.userRole}>Super Administrator</Text>
            </View>

            {/* Menu Items */}
            <View style={styles.menuContainer}>
              {menuItems.map((item, index) => (
                <React.Fragment key={item.id}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={item.onPress}
                    disabled={item.id === 'logout' && isLoggingOut}
                  >
                    <View style={styles.menuIcon}>{item.icon}</View>
                    <Text
                      style={[
                        styles.menuLabel,
                        item.id === 'logout' && styles.logoutLabel,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                  {item.showDivider && index < menuItems.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    width: Dimensions.get('window').width * 0.85,
    backgroundColor: COLORS.backgroundPrimary,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    padding: SPACING.xl,
    alignItems: 'center',
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  avatarContainer: {
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  userRole: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  menuContainer: {
    paddingVertical: SPACING.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  menuIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  logoutLabel: {
    color: COLORS.error,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.xs,
  },
});

export default SuperAdminProfileDrawer;

