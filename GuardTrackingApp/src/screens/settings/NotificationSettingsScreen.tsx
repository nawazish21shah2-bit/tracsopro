import React, { useState, useEffect } from 'react';
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
import { Bell } from 'react-native-feather';

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

  const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      setSaving(true);
      await settingsService.updateNotificationSettings({ [key]: value });
    } catch (error: any) {
      console.error('Error updating notification settings:', error);
      // Revert on error
      setSettings(settings);
      const errorMessage = error?.message || 'Failed to update notification settings';
      
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
      setSaving(false);
    }
  };

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
        <View style={styles.card}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell width={20} height={20} color="#666666" />
              <Text style={styles.sectionTitle}>Push Notifications</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Receive push notifications on your device
            </Text>
          </View>
          <Switch
            value={settings.pushNotifications}
            onValueChange={(value) => handleToggle('pushNotifications', value)}
            disabled={saving}
            trackColor={{ false: '#767577', true: '#1C6CA9' }}
            thumbColor={settings.pushNotifications ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell width={20} height={20} color="#666666" />
              <Text style={styles.sectionTitle}>Email Notifications</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Receive notifications via email
            </Text>
          </View>
          <Switch
            value={settings.emailNotifications}
            onValueChange={(value) => handleToggle('emailNotifications', value)}
            disabled={saving}
            trackColor={{ false: '#767577', true: '#1C6CA9' }}
            thumbColor={settings.emailNotifications ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell width={20} height={20} color="#666666" />
              <Text style={styles.sectionTitle}>SMS Notifications</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Receive notifications via SMS
            </Text>
          </View>
          <Switch
            value={settings.smsNotifications}
            onValueChange={(value) => handleToggle('smsNotifications', value)}
            disabled={saving}
            trackColor={{ false: '#767577', true: '#1C6CA9' }}
            thumbColor={settings.smsNotifications ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell width={20} height={20} color="#666666" />
              <Text style={styles.sectionTitle}>Shift Reminders</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Get reminded about upcoming shifts
            </Text>
          </View>
          <Switch
            value={settings.shiftReminders}
            onValueChange={(value) => handleToggle('shiftReminders', value)}
            disabled={saving}
            trackColor={{ false: '#767577', true: '#1C6CA9' }}
            thumbColor={settings.shiftReminders ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell width={20} height={20} color="#666666" />
              <Text style={styles.sectionTitle}>Incident Alerts</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Get notified about incidents and emergencies
            </Text>
          </View>
          <Switch
            value={settings.incidentAlerts}
            onValueChange={(value) => handleToggle('incidentAlerts', value)}
            disabled={saving}
            trackColor={{ false: '#767577', true: '#1C6CA9' }}
            thumbColor={settings.incidentAlerts ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>
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

