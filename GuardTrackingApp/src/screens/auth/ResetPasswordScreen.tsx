// Reset Password Screen Component
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { clearError } from '../../store/slices/authSlice';
import { authApi } from '../../services/api/authApi';
import { AuthStackParamList } from '../../types';
import Button from '../../components/common/Button';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import { authStyles } from '../../styles/authStyles';
import { COLORS, SPACING } from '../../styles/globalStyles';

type ResetPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute<ResetPasswordScreenRouteProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { error } = useSelector((state: RootState) => state.auth);

  const email = route.params?.email || '';
  const otp = route.params?.otp || '';

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResetPassword = async () => {
    if (!formData.password || !formData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!email || !otp) {
      Alert.alert('Error', 'Missing email or OTP. Please start the password reset process again.');
      navigation.navigate('ForgotPassword');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authApi.resetPassword(email, otp, formData.password);

      if (result.success) {
        Alert.alert(
          'Success',
          result.message || 'Your password has been reset successfully. Please login with your new password.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to reset password. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  React.useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [dispatch, error]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundPrimary} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthHeader title="RESET PASSWORD" subtitle="Enter your new password below" />

        <View style={authStyles.form}>
          <View style={authStyles.inputContainer}>
            <AuthInput
              icon="lock-outline"
              placeholder="New Password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={authStyles.inputContainer}>
            <AuthInput
              icon="lock-outline"
              placeholder="Confirm New Password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry
              showPassword={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <Button
            title={isLoading ? 'Resetting...' : 'Reset Password'}
            onPress={handleResetPassword}
            disabled={isLoading}
            loading={isLoading}
            fullWidth
            size="large"
            style={authStyles.submitButton}
          />
        </View>

        <View style={authStyles.footerLinkRow}>
          <Text style={authStyles.footerText}>Remember your password? </Text>
          <TouchableOpacity onPress={navigateToLogin} disabled={isLoading} activeOpacity={isLoading ? 1 : 0.7}>
            <Text style={authStyles.linkText}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: SPACING.xxxl,
  },
});

export default ResetPasswordScreen;
