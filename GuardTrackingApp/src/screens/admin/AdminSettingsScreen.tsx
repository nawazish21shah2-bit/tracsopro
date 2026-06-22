/**
 * Admin Settings Screen - System configuration and admin preferences
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChevronRight, User, Bell, HelpCircle, LogOut, Lock, CreditCard, Settings } from 'react-native-feather';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import AdminProfileDrawer from '../../components/admin/AdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { useNotificationBell } from '../../hooks/useNotificationBell';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import SubscriptionSummaryCard from '../../components/admin/SubscriptionSummaryCard';
import { adminApi } from '../../services/api/adminApi';
import { SubscriptionOverview } from '../../utils/subscriptionUtils';
import { navigateToEmailVerification } from '../../utils/navigationHelpers';
import { getEmailVerificationSettingItems } from '../../utils/emailVerificationSettingItem';

interface SettingItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}

// Icon color constant for use in JSX
const ICON_COLOR = '#828282';
const ERROR_COLOR = '#F44336';
const SETTINGS_BOTTOM_SPACER = 120;

const AdminSettingsScreen: React.FC<{ navigation?: any }> = ({ navigation: propNavigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const { onNotificationPress, notificationCount } = useNotificationBell({
    notificationsRoute: 'AdminNotifications',
  });
  const navigation = useNavigation<StackNavigationProp<AdminStackParamList>>() || propNavigation;
  const { user } = useSelector((state: RootState) => state.auth);
  const [subscriptionOverview, setSubscriptionOverview] = useState<SubscriptionOverview | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  const loadSubscription = useCallback(async () => {
    try {
      setSubscriptionLoading(true);
      const response = await adminApi.getAdminSubscription();
      if (response.success && response.data) {
        setSubscriptionOverview(response.data.overview ?? null);
      } else {
        setSubscriptionOverview(null);
      }
    } catch {
      setSubscriptionOverview(null);
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSubscription();
    }, [loadSubscription])
  );

  const handleProfile = () => {
    navigation.navigate('AdminProfileEdit');
  };

  const handleSubscription = () => {
    navigation.navigate('AdminSubscription');
  };

  const handleNotifications = () => {
    navigation.navigate('AdminNotificationSettings');
  };

  const handleSystemSettings = () => {
    navigation.navigate('AdminSystemSettings');
  };

  const handleChangePassword = () => {
    navigation.navigate('AdminChangePassword');
  };

  const handleSupportChat = () => {
    navigation.navigate('SupportHubScreen', { variant: 'admin', mode: 'platform' });
  };

  const handleCompanySupportInbox = () => {
    navigation.navigate('SupportHubScreen', { variant: 'admin', mode: 'inbox' });
  };

  const handleSupport = () => {
    navigation.navigate('AdminSupportContact');
  };

  const handleEmailVerification = () => {
    navigateToEmailVerification(navigation);
  };

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
              await dispatch(logoutUser()).unwrap();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const items: SettingItem[] = [
    ...getEmailVerificationSettingItems(Boolean(user?.isEmailVerified), handleEmailVerification, ICON_COLOR),
    { id: '1', title: 'Admin Profile', icon: <User width={20} height={20} color={ICON_COLOR} />, onPress: handleProfile },
    { id: '2', title: 'Subscription & Billing', icon: <CreditCard width={20} height={20} color={ICON_COLOR} />, onPress: handleSubscription },
    { id: '3', title: 'Notifications', icon: <Bell width={20} height={20} color={ICON_COLOR} />, onPress: handleNotifications },
    { id: '4', title: 'System Settings', icon: <Settings width={20} height={20} color={ICON_COLOR} />, onPress: handleSystemSettings },
    { id: '5', title: 'Change Password', icon: <Lock width={20} height={20} color={ICON_COLOR} />, onPress: handleChangePassword },
    { id: '6', title: 'Company Support Inbox', icon: <HelpCircle width={20} height={20} color={ICON_COLOR} />, onPress: handleCompanySupportInbox },
    { id: '7', title: 'Platform Support', icon: <HelpCircle width={20} height={20} color={ICON_COLOR} />, onPress: handleSupportChat },
    { id: '8', title: 'Submit Support Ticket', icon: <HelpCircle width={20} height={20} color={ICON_COLOR} />, onPress: handleSupport },
  ];

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="admin"
        title="Admin Settings"
        onMenuPress={openDrawer}
        onNotificationPress={onNotificationPress}
        notificationCount={notificationCount}
        profileDrawer={
          <AdminProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToSettings={() => {
              closeDrawer();
            }}
          />
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeading}>Your plan</Text>
        <SubscriptionSummaryCard
          overview={subscriptionOverview}
          loading={subscriptionLoading}
          compact
          onUpgrade={handleSubscription}
        />

        <View style={styles.card}>
          {items.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.row, idx === items.length - 1 && styles.lastRow]}
              onPress={item.onPress}
            >
              <View style={styles.left}>
                <View style={styles.iconWrap}>{item.icon}</View>
                <Text style={styles.title}>{item.title}</Text>
              </View>
              <ChevronRight width={18} height={18} color={ICON_COLOR} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <LogOut width={18} height={18} color={ERROR_COLOR} />
          <Text style={styles.logoutText}> Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

// Use hardcoded values in StyleSheet.create since it's evaluated at module load time
const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: SETTINGS_BOTTOM_SPACER,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#828282',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DCDCDC',
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ACD3F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
    marginLeft: 12,
  },
  logout: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    paddingVertical: 12,
  },
  logoutText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default AdminSettingsScreen;
