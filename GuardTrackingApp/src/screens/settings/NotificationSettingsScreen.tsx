import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../navigation/DashboardNavigator';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import { settingsService, NotificationSettings } from '../../services/settingsService';
import pushNotificationService from '../../services/notificationService';
import { useRoleScreenHeader, RoleHeaderVariant } from '../../hooks/useRoleScreenHeader';
import { Bell, Mail, MessageCircle, Clock, AlertTriangle } from 'react-native-feather';

interface NotificationSettingsScreenProps {
  variant?: 'client' | 'guard' | 'admin' | 'superAdmin';
  profileDrawer?: React.ReactNode;
}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
  variant = 'client',
  profileDrawer,
}) => {
  const navigation = useNavigation<StackNavigationProp<SettingsStackParamList>>();
  const roleVariant: RoleHeaderVariant =
    variant === 'superAdmin'
      ? 'superAdmin'
      : variant === 'admin'
        ? 'admin'
        : variant === 'guard'
          ? 'guard'
          : 'client';
  const { headerProps: roleHeaderProps } = useRoleScreenHeader('Notification Settings', roleVariant);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    shiftReminders: true,
    incidentAlerts: true,
  });

  const headerProps = profileDrawer
    ? { ...roleHeaderProps, profileDrawer, onMenuPress: roleHeaderProps.onMenuPress }
    : roleHeaderProps;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getNotificationSettings();
      setSettings(data);
    } catch (error: any) {
      console.error('Error loading notification settings:', error);
      const errorMessage = error?.message || 'Failed to load notification settings';

      if (errorMessage.includes('session has expired') || errorMessage.includes('expired')) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = useCallback(async (key: keyof NotificationSettings, value: boolean) => {
    const previousSettings = { ...settings };
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      setSaving(true);

      if (key === 'pushNotifications') {
        if (value) {
          const granted = await pushNotificationService.requestPermission();
          if (!granted) {
            setSettings(previousSettings);
            Alert.alert(
              'Permission Required',
              'Enable notifications in your device settings to receive push alerts.',
              [
                { text: 'Not Now', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() },
              ]
            );
            return;
          }
          await pushNotificationService.initialize();
        }
      }

      await settingsService.updateNotificationSettings({ [key]: value });
    } catch (error: any) {
      console.error('Error updating notification settings:', error);
      // Revert on error
      setSettings(previousSettings);
      const errorMessage = error?.message || 'Failed to update notification settings';

      // Session expired handling
      if (errorMessage.includes('session has expired') || errorMessage.includes('expired')) {
        Alert.alert('Session Expired', 'Your session has expired. Please login again.', [{ text: 'OK' }]);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setSaving(false);
    }
  }, [settings]);

  if (loading) {
    return (
      <SafeAreaWrapper>
        <SharedHeader {...headerProps} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C6CA9" />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <SharedHeader {...headerProps} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {[
          {
            key: 'pushNotifications' as const,
            icon: Bell,
            title: 'Push Notifications',
            description: 'Receive push notifications on your device',
          },
          {
            key: 'emailNotifications' as const,
            icon: Mail,
            title: 'Email Notifications',
            description: 'Receive notifications via email',
          },
          {
            key: 'smsNotifications' as const,
            icon: MessageCircle,
            title: 'SMS Notifications',
            description: 'Receive notifications via SMS',
          },
          {
            key: 'shiftReminders' as const,
            icon: Clock,
            title: 'Shift Reminders',
            description: 'Get reminded about upcoming shifts',
          },
          {
            key: 'incidentAlerts' as const,
            icon: AlertTriangle,
            title: 'Incident Alerts',
            description: 'Get notified about incidents and emergencies',
          },
        ].map((item, index, array) => {
          const Icon = item.icon;
          const isLast = index === array.length - 1;
          return (
            <View key={item.key} style={[styles.card, isLast && styles.lastCard]}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon width={20} height={20} color="#666666" />
                  <Text style={styles.sectionTitle}>{item.title}</Text>
                </View>
                <Text style={styles.sectionDescription}>{item.description}</Text>
              </View>
              <Switch
                value={settings[item.key]}
                onValueChange={(value) => handleToggle(item.key, value)}
                disabled={saving}
                trackColor={{ false: '#767577', true: '#1C6CA9' }}
                thumbColor={settings[item.key] ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lastCard: {
    marginBottom: 0,
  },
  section: {
    flex: 1,
    marginRight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
});

export default NotificationSettingsScreen;

