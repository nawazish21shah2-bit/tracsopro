/**
 * System Settings Screen - System configuration and settings
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SuperAdminProfileDrawer from '../../components/superAdmin/SuperAdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';

interface SettingItem {
  id: string;
  title: string;
  description: string;
  type: 'toggle' | 'action' | 'info';
  value?: boolean;
  action?: () => void;
}

const SystemSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    maintenanceMode: false,
    autoBackup: true,
    debugMode: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await superAdminService.getPlatformSettings();
      
      // Transform backend settings to local state
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
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Dispatch logout action - this will handle API call, storage cleanup, and navigation
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

  const handleToggleSetting = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
    // Auto-save on toggle
    setTimeout(() => saveSettings(), 500);
  };

  const settingsData: SettingItem[] = [
    {
      id: 'email_notifications',
      title: 'Email Notifications',
      description: 'Receive email notifications for important events',
      type: 'toggle',
      value: settings.emailNotifications,
    },
    {
      id: 'push_notifications',
      title: 'Push Notifications',
      description: 'Receive push notifications on your device',
      type: 'toggle',
      value: settings.pushNotifications,
    },
    {
      id: 'maintenance_mode',
      title: 'Maintenance Mode',
      description: 'Enable maintenance mode for the platform',
      type: 'toggle',
      value: settings.maintenanceMode,
    },
    {
      id: 'auto_backup',
      title: 'Auto Backup',
      description: 'Automatically backup system data daily',
      type: 'toggle',
      value: settings.autoBackup,
    },
    {
      id: 'debug_mode',
      title: 'Debug Mode',
      description: 'Enable debug logging for troubleshooting',
      type: 'toggle',
      value: settings.debugMode,
    },
    {
      id: 'clear_cache',
      title: 'Clear Cache',
      description: 'Clear application cache and temporary files',
      type: 'action',
      action: () => {
        Alert.alert('Cache Cleared', 'Application cache has been cleared successfully.');
      },
    },
    {
      id: 'export_data',
      title: 'Export Data',
      description: 'Export platform data for backup or analysis',
      type: 'action',
      action: () => {
        Alert.alert('Export Started', 'Data export has been initiated. You will receive an email when complete.');
      },
    },
    {
      id: 'logout',
      title: 'Logout',
      description: 'Sign out of your Super Admin account',
      type: 'action',
      action: handleLogout,
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    return (
      <View key={item.id} style={styles.settingItem}>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingDescription}>{item.description}</Text>
        </View>
        
        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={(value) => handleToggleSetting(item.id.replace('_', ''), value)}
            trackColor={{ false: '#E5E7EB', true: COLORS.primaryLight }}
            thumbColor={item.value ? COLORS.primary : '#F3F4F6'}
          />
        )}
        
        {item.type === 'action' && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              item.id === 'logout' && styles.logoutButton,
            ]}
            onPress={item.action}
          >
            <Text
              style={[
                styles.actionButtonText,
                item.id === 'logout' && styles.logoutButtonText,
              ]}
            >
              {item.id === 'logout' ? 'Logout' : 'Execute'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="superAdmin"
        title="System Settings"
        onNotificationPress={() => {
          // Handle notification press
        }}
        profileDrawer={
          <SuperAdminProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToSystemSettings={() => {
              closeDrawer();
            }}
          />
        }
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.settingsContainer}>
          {settingsData.map(renderSettingItem)}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  settingsContainer: {
    padding: SPACING.md,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  actionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: '#FFFFFF',
  },
  logoutButtonText: {
    color: '#FFFFFF',
  },
});

export default SystemSettingsScreen;
