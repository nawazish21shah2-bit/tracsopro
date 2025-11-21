// Forgot Password Screen Component
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  ScrollView,
} from 'react-native';
import { EmailIcon } from '../../components/ui/AppIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../../store';
import { forgotPassword, clearError } from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../types';
import Button from '../../components/common/Button';
import Logo from '../../assets/images/tracSOpro-logo.png';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSendResetEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      // For now, simulate sending OTP and navigate to email verification
      // In real app, this would call the forgot password API
      navigation.navigate('EmailVerification', { email, isPasswordReset: true });
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  // Clear error when component unmounts or when user starts typing
  React.useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [dispatch, error]);

  if (emailSent) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <EmailIcon size={28} color="#FFFFFF" />
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a password reset link to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              • Check your email inbox{'\n'}
              • Look for an email from Guard Tracker{'\n'}
              • Click the reset link in the email{'\n'}
              • Follow the instructions to reset your password
            </Text>
          </View>

          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={navigateToLogin}
          >
            <Text style={styles.backToLoginButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={Logo} style={styles.logoImage} resizeMode="contain" />
        </View>

        {/* Title */}
        <Text style={styles.title}>FORGOT PASSWORD</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you an OTP to reset your password.
        </Text>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <EmailIcon size={20} color="#1C6CA9" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Email Address"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
          </View>

          <Button
            title={isLoading ? 'Sending OTP...' : 'Send OTP'}
            onPress={handleSendResetEmail}
            disabled={isLoading}
            loading={isLoading}
            fullWidth
            size="large"
            style={{ marginTop: 40 }}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Remember your password? 
            <TouchableOpacity onPress={navigateToLogin} disabled={isLoading}>
              <Text style={styles.loginLink}> Login</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  logoImage: {
    width: 160,
    height: 140,
  },
  title: {
    fontFamily: 'Montserrat',
    fontWeight: '600',
    fontSize: 24,
    lineHeight: 29,
    textAlign: 'center',
    letterSpacing: -0.408,
    color: '#000000',
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  emailText: {
    fontWeight: '600',
    color: '#ffffff',
  },
  form: {
    paddingHorizontal: 20,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 20,
    height: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputIcon: {
    fontSize: 16,
    color: '#6B7280',
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: -0.408,
    color: '#000000',
  },
  instructions: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  backToLoginButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backToLoginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  footerText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 17,
    textAlign: 'center',
    letterSpacing: -0.408,
    color: '#828282',
  },
  loginLink: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: -0.408,
    color: '#1C6CA9',
  },
});

export default ForgotPasswordScreen;
