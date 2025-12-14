import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import { settingsService, NotificationSettings } from '../../services/settingsService';
import { Bell, Mail, MessageCircle, Clock, AlertTriangle } from 'react-native-feather';

interface NotificationSettingsScreenProps {
  variant?: 'client' | 'guard' | 'admin';
  profileDrawer?: React.ReactNode;
}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
  variant = 'client',
  profileDrawer,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    shiftReminders: true,
    incidentAlerts: true,
  });

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
      
      // If it's a session expired error, show a more user-friendly message
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
        <SharedHeader variant={variant} title="Notification Settings" profileDrawer={profileDrawer} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C6CA9" />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <SharedHeader variant={variant} title="Notification Settings" profileDrawer={profileDrawer} />
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

