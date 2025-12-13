/**
 * Admin Settings Screen - System configuration and admin preferences
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChevronRight, User, Bell, HelpCircle, LogOut, Lock, CreditCard, Settings } from 'react-native-feather';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import AdminProfileDrawer from '../../components/admin/AdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { AdminStackParamList } from '../../navigation/AdminNavigator';

interface SettingItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}

// Icon color constant for use in JSX
const ICON_COLOR = '#828282';
const ERROR_COLOR = '#F44336';

const AdminSettingsScreen: React.FC<{ navigation?: any }> = ({ navigation: propNavigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const navigation = useNavigation<StackNavigationProp<AdminStackParamList>>() || propNavigation;

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

  const handleSupport = () => {
    navigation.navigate('AdminSupportContact');
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
    { id: '1', title: 'Admin Profile', icon: <User width={20} height={20} color={ICON_COLOR} />, onPress: handleProfile },
    { id: '2', title: 'Subscription & Billing', icon: <CreditCard width={20} height={20} color={ICON_COLOR} />, onPress: handleSubscription },
    { id: '3', title: 'Notifications', icon: <Bell width={20} height={20} color={ICON_COLOR} />, onPress: handleNotifications },
    { id: '4', title: 'System Settings', icon: <Settings width={20} height={20} color={ICON_COLOR} />, onPress: handleSystemSettings },
    { id: '5', title: 'Change Password', icon: <Lock width={20} height={20} color={ICON_COLOR} />, onPress: handleChangePassword },
    { id: '6', title: 'Contact Support', icon: <HelpCircle width={20} height={20} color={ICON_COLOR} />, onPress: handleSupport },
  ];

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="admin"
        title="Admin Settings"
        onMenuPress={openDrawer}
        onNotificationPress={() => {
          // Handle notification press
        }}
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
    padding: 16,
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
