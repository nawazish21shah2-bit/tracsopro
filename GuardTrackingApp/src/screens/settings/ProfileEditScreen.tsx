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
import * as theme from '../../styles/globalStyles';
import { settingsService, ProfileSettings } from '../../services/settingsService';
import { updateUserProfile } from '../../store/slices/authSlice';
import { User } from 'react-native-feather';

// Safely access design tokens for StyleSheet.create
const COLORS = theme.COLORS || {
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#FFFFFF',
  borderCard: '#E0E0E0',
  borderLight: '#E0E0E0',
  primary: '#1C6CA9',
};
const TYPOGRAPHY = theme.TYPOGRAPHY || {
  fontSize: { xs: 12, sm: 14, md: 15 },
  fontWeight: { semibold: '600' as const },
};
const SPACING = theme.SPACING || { xs: 4, sm: 8, md: 12, lg: 16, fieldGap: 16 };
const BORDER_RADIUS = theme.BORDER_RADIUS || { sm: 8, md: 12 };
const SHADOWS = theme.SHADOWS || { small: {} };

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
          <ActivityIndicator size="large" color={COLORS.primary} />
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
            <ActivityIndicator size="small" color={COLORS.textInverse} />
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
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.fieldGap || SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    // Border only, no shadow for minimal style
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.backgroundPrimary,
  },
  disabledInput: {
    backgroundColor: COLORS.backgroundSecondary,
    color: COLORS.textTertiary,
  },
  helperText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default ProfileEditScreen;

