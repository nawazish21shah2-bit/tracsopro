/**
 * System Settings Screen - System configuration and settings
 * Hybrid design: Standard list items + System toggles + Action buttons
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChevronRight, User, Bell, HelpCircle, LogOut, Lock, Trash2, Download } from 'react-native-feather';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SuperAdminProfileDrawer from '../../components/superAdmin/SuperAdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { superAdminService } from '../../services/superAdminService';
import { cacheService } from '../../services/cacheService';
import { SuperAdminStackParamList } from '../../navigation/SuperAdminNavigator';

// Hardcoded colors to avoid module load issues
const COLORS = {
  primary: '#1C6CA9',
  primaryLight: '#ACD3F1',
  textPrimary: '#000000',
  textSecondary: '#828282',
  error: '#F44336',
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  borderLight: '#ACD3F1',
  borderCard: '#DCDCDC',
};

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}

interface ToggleSetting {
  id: string;
  title: string;
  description: string;
  key: keyof typeof defaultSettings;
}

const defaultSettings = {
  emailNotifications: true,
  pushNotifications: true,
  maintenanceMode: false,
  autoBackup: true,
  debugMode: false,
};

const SystemSettingsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<SuperAdminStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await superAdminService.getPlatformSettings();
      
      setSettings({
        emailNotifications: data.GENERAL?.['notifications.email'] !== 'false',
        pushNotifications: data.GENERAL?.['notifications.push'] !== 'false',
        maintenanceMode: data.GENERAL?.['maintenance.mode'] === 'true',
        autoBackup: data.GENERAL?.['backup.auto'] !== 'false',
        debugMode: data.GENERAL?.['debug.mode'] === 'true',
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await superAdminService.updatePlatformSettings({
        GENERAL: {
          'notifications.email': settings.emailNotifications.toString(),
          'notifications.push': settings.pushNotifications.toString(),
          'maintenance.mode': settings.maintenanceMode.toString(),
          'backup.auto': settings.autoBackup.toString(),
          'debug.mode': settings.debugMode.toString(),
        },
      });
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
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

  const handleToggleSetting = (key: keyof typeof defaultSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setTimeout(() => saveSettings(), 500);
  };

  const handleProfile = () => {
    navigation.navigate('SuperAdminProfileEdit');
  };

  const handleNotifications = () => {
    navigation.navigate('SuperAdminNotificationSettings');
  };

  const handleChangePassword = () => {
    navigation.navigate('SuperAdminChangePassword');
  };

  const handleSupport = () => {
    navigation.navigate('SuperAdminSupportContact');
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setClearingCache(true);
              await cacheService.clear();
              Alert.alert('Success', 'Application cache has been cleared successfully.');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache. Please try again.');
            } finally {
              setClearingCache(false);
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    Alert.alert(
      'Export Data',
      'This will export all platform data. You will receive an email when the export is complete.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              setExportingData(true);
              if (superAdminService.exportPlatformData) {
                await superAdminService.exportPlatformData();
              }
              Alert.alert('Export Started', 'Data export has been initiated. You will receive an email when complete.');
            } catch (error) {
              console.error('Error exporting data:', error);
              Alert.alert('Error', 'Failed to start data export. Please try again.');
            } finally {
              setExportingData(false);
            }
          },
        },
      ]
    );
  };

  const menuItems: MenuItem[] = [
    { id: '1', title: 'SuperAdmin Profile', icon: <User width={20} height={20} color={COLORS.textSecondary} />, onPress: handleProfile },
    { id: '2', title: 'Notifications', icon: <Bell width={20} height={20} color={COLORS.textSecondary} />, onPress: handleNotifications },
    { id: '3', title: 'Change Password', icon: <Lock width={20} height={20} color={COLORS.textSecondary} />, onPress: handleChangePassword },
    { id: '4', title: 'Contact Support', icon: <HelpCircle width={20} height={20} color={COLORS.textSecondary} />, onPress: handleSupport },
  ];

  const toggleSettings: ToggleSetting[] = [
    { id: '1', title: 'Email Notifications', description: 'Receive email notifications for important events', key: 'emailNotifications' },
    { id: '2', title: 'Push Notifications', description: 'Receive push notifications on your device', key: 'pushNotifications' },
    { id: '3', title: 'Maintenance Mode', description: 'Enable maintenance mode for the platform', key: 'maintenanceMode' },
    { id: '4', title: 'Auto Backup', description: 'Automatically backup system data daily', key: 'autoBackup' },
    { id: '5', title: 'Debug Mode', description: 'Enable debug logging for troubleshooting', key: 'debugMode' },
  ];

  if (loading) {
    return (
      <SafeAreaWrapper>
        <SharedHeader variant="superAdmin" title="System Settings" profileDrawer={null} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="superAdmin"
        title="System Settings"
        profileDrawer={
          <SuperAdminProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToSystemSettings={() => closeDrawer()}
          />
        }
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Standard Menu Items */}
        <View style={styles.card}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.row, idx === menuItems.length - 1 && styles.lastRow]}
              onPress={item.onPress}
            >
              <View style={styles.left}>
                <View style={styles.iconWrap}>{item.icon}</View>
                <Text style={styles.title}>{item.title}</Text>
              </View>
              <ChevronRight width={18} height={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* System Toggle Settings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Platform Settings</Text>
          {toggleSettings.map((item, idx) => (
            <View
              key={item.id}
              style={[styles.toggleRow, idx === toggleSettings.length - 1 && styles.lastRow]}
            >
              <View style={styles.toggleContent}>
                <Text style={styles.toggleTitle}>{item.title}</Text>
                <Text style={styles.toggleDescription}>{item.description}</Text>
              </View>
              <Switch
                value={settings[item.key]}
                onValueChange={(value) => handleToggleSetting(item.key, value)}
                disabled={saving}
                trackColor={{ false: '#E5E7EB', true: COLORS.primaryLight }}
                thumbColor={settings[item.key] ? COLORS.primary : '#F3F4F6'}
              />
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>System Actions</Text>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleClearCache}
            disabled={clearingCache}
          >
            <View style={styles.left}>
              <Trash2 width={20} height={20} color={COLORS.error} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Clear Cache</Text>
                <Text style={styles.actionDescription}>Clear application cache and temporary files</Text>
              </View>
            </View>
            {clearingCache ? (
              <ActivityIndicator size="small" color={COLORS.error} />
            ) : (
              <ChevronRight width={18} height={18} color={COLORS.textSecondary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionRow, styles.lastRow]}
            onPress={handleExportData}
            disabled={exportingData}
          >
            <View style={styles.left}>
              <Download width={20} height={20} color={COLORS.primary} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Export Data</Text>
                <Text style={styles.actionDescription}>Export platform data for backup or analysis</Text>
              </View>
            </View>
            {exportingData ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <ChevronRight width={18} height={18} color={COLORS.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <LogOut width={18} height={18} color={COLORS.error} />
          <Text style={styles.logoutText}> Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

// Use hardcoded values in StyleSheet.create since it's evaluated at module load time
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#DCDCDC',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#828282',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
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
    flex: 1,
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
  toggleRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ACD3F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleContent: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#828282',
    lineHeight: 18,
  },
  actionRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ACD3F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionContent: {
    marginLeft: 12,
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#828282',
    lineHeight: 18,
  },
  logout: {
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
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

export default SystemSettingsScreen;
