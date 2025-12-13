import React, { useState } from 'react';
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
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import { settingsService } from '../../services/settingsService';
import { Lock, Eye, EyeOff } from 'react-native-feather';

// Hardcoded colors to avoid module load issues
const COLORS = {
  primary: '#1C6CA9',
  textPrimary: '#000000',
  textSecondary: '#828282',
  textTertiary: '#B0B0B0',
  textInverse: '#FFFFFF',
  borderLight: '#ACD3F1',
  borderCard: '#DCDCDC',
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
};

interface ChangePasswordScreenProps {
  variant?: 'client' | 'guard' | 'admin' | 'superAdmin';
  profileDrawer?: React.ReactNode;
  onSuccess?: () => void;
}

const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({
  variant = 'client',
  profileDrawer,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async () => {
    // Validation
    if (!currentPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter your current password');
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter a new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New passwords do not match');
      return;
    }
    if (currentPassword === newPassword) {
      Alert.alert('Validation Error', 'New password must be different from current password');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Validation Error', passwordError);
      return;
    }

    try {
      setSubmitting(true);
      await settingsService.changePassword({
        currentPassword,
        newPassword,
      });

      Alert.alert(
        'Success',
        'Your password has been changed successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              onSuccess?.();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error changing password:', error);
      const errorMessage = error?.message || 'Failed to change password. Please try again.';
      
      if (errorMessage.includes('session has expired') || errorMessage.includes('expired')) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK' }]
        );
      } else if (errorMessage.includes('current password') || errorMessage.includes('incorrect')) {
        Alert.alert('Error', 'Current password is incorrect');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <SharedHeader variant={variant} title="Change Password" profileDrawer={profileDrawer} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Lock width={24} height={24} color={COLORS.primary} />
            <Text style={styles.headerText}>Update your password</Text>
          </View>
          <Text style={styles.description}>
            For security, please enter your current password and choose a new one.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Current Password *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={COLORS.textTertiary}
              secureTextEntry={!showCurrentPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <EyeOff width={20} height={20} color={COLORS.textSecondary} />
              ) : (
                <Eye width={20} height={20} color={COLORS.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>New Password *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={COLORS.textTertiary}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <EyeOff width={20} height={20} color={COLORS.textSecondary} />
              ) : (
                <Eye width={20} height={20} color={COLORS.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            Must be at least 8 characters with uppercase, lowercase, and a number
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Confirm New Password *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={COLORS.textTertiary}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff width={20} height={20} color={COLORS.textSecondary} />
              ) : (
                <Eye width={20} height={20} color={COLORS.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={COLORS.textInverse} />
          ) : (
            <Text style={styles.submitButtonText}>Change Password</Text>
          )}
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
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCDCDC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 12,
  },
  description: {
    fontSize: 14,
    color: '#828282',
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ACD3F1',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
  },
  eyeIcon: {
    padding: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#828282',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#1C6CA9',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChangePasswordScreen;
