import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import { settingsService, ProfileSettings } from '../../services/settingsService';
import { updateUserProfile } from '../../store/slices/authSlice';
import { User } from 'react-native-feather';

interface ProfileEditScreenProps {
  variant?: 'client' | 'guard' | 'admin';
  profileDrawer?: React.ReactNode;
  onSave?: () => void;
}

const ProfileEditScreen: React.FC<ProfileEditScreenProps> = ({
  variant = 'client',
  profileDrawer,
  onSave,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    timezone: '',
    language: 'en',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await settingsService.getProfileSettings();
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        timezone: profile.timezone || '',
        language: profile.language || 'en',
      });
    } catch (error: any) {
      console.error('Error loading profile:', error);
      const errorMessage = error?.message || 'Failed to load profile';
      
      // If it's a session expired error, show a more user-friendly message
      if (errorMessage.includes('session has expired') || errorMessage.includes('expired')) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK' }]
        );
        // Navigation will be handled by the logout action
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required');
      return;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Validation Error', 'Last name is required');
      return;
    }

    try {
      setSaving(true);
      const updatedProfile = await settingsService.updateProfileSettings({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim() || undefined,
        timezone: formData.timezone.trim() || undefined,
        language: formData.language,
      });

      // Update Redux store
      dispatch(updateUserProfile({
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        phone: updatedProfile.phone || '',
      }));

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: onSave },
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error?.message || 'Failed to update profile. Please try again.';
      
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
        <SharedHeader variant={variant} title="Edit Profile" profileDrawer={profileDrawer} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C6CA9" />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <SharedHeader variant={variant} title="Edit Profile" profileDrawer={profileDrawer} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
              placeholder="Enter first name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
              placeholder="Enter last name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Enter phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={user?.email || ''}
              editable={false}
              placeholderTextColor="#999"
            />
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Timezone</Text>
            <TextInput
              style={styles.input}
              value={formData.timezone}
              onChangeText={(text) => setFormData({ ...formData, timezone: text })}
              placeholder="e.g., America/New_York"
              placeholderTextColor="#999"
            />
            <Text style={styles.helperText}>Optional: Your timezone (e.g., America/New_York)</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
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
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#999999',
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#1C6CA9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileEditScreen;

