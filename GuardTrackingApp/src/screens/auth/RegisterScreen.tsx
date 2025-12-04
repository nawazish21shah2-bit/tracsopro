// Register Screen Component
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  TextInput,
  Image,
} from 'react-native';
import { PersonIcon, PasswordIcon } from '../../components/ui/AppIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { registerUser, clearError } from '../../store/slices/authSlice';
import { AuthStackParamList, UserRole } from '../../types';
import { useTheme } from '../../utils/theme';
import Input from '../../components/common/Input';
import AuthInput from '../../components/auth/AuthInput';
import Button from '../../components/common/Button';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import Logo from '../../assets/images/tracSOpro-logo.png';

type RegisterScreenNavigationProp = StackNavigationProp<any, any>;
type RegisterScreenRouteProp = RouteProp<any, any>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const route = useRoute<RegisterScreenRouteProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const { theme } = useTheme();
  
  const accountType = route.params?.accountType || 'individual';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserRole.GUARD,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    } else if (formData.fullName.trim().length > 100) {
      newErrors.fullName = 'Full name must be less than 100 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Split full name into first and last name for API
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const registerData = {
        firstName,
        lastName,
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: '', // Will be collected in profile setup
        role: formData.role,
      };
      
      const result = await dispatch(registerUser(registerData));
      if (registerUser.fulfilled.match(result)) {
        const payload = result.payload;
        
        // Check if tokens are returned (dev mode OTP bypass)
        if (payload.token && payload.user) {
          // OTP was bypassed - user is already authenticated
          Alert.alert(
            'Registration Successful',
            payload.message || 'Your account has been created successfully.',
            [{ text: 'OK', onPress: () => {
              // Navigate to appropriate screen based on role
              if (formData.role === 'GUARD') {
                navigation.navigate('GuardProfileSetup');
              } else {
                navigation.navigate('ClientProfileSetup', { accountType: 'individual' });
              }
            }}]
          );
        } else {
          // Normal flow - need OTP verification
          // Navigate to appropriate OTP screen based on role
          if (formData.role === 'GUARD') {
            navigation.navigate('GuardOTP', { 
              email: formData.email,
              isPasswordReset: false 
            });
          } else {
            navigation.navigate('ClientOTP', { 
              email: formData.email,
              accountType: 'individual',
              isPasswordReset: false 
            });
          }
        }
      } else {
        const errorMessage = result.payload as string;
        
        // Handle specific error cases
        if (errorMessage.includes('already registered')) {
          Alert.alert(
            'Email Already Registered',
            errorMessage.includes('login') 
              ? errorMessage 
              : 'This email is already registered. If you haven\'t verified your email, a new verification code has been sent. Otherwise, please login.',
            [
              { text: 'Login', onPress: () => navigation.navigate('Login') },
              { text: 'OK', style: 'cancel' }
            ]
          );
        } else {
          Alert.alert('Registration Failed', errorMessage || 'Failed to create account. Please try again.');
        }
      }
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

  return (
    <KeyboardAvoidingView
      style={globalStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundPrimary} />
      
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
        <Text style={styles.title}>SIGN UP</Text>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <AuthInput
              label="Full Name"
              icon="person-outline"
              placeholder="Full Name"
              value={formData.fullName}
              onChangeText={(v) => {
                handleInputChange('fullName', v);
                if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
              }}
              autoCapitalize="words"
              editable={!isLoading}
              error={errors.fullName}
            />
          </View>

          <View style={styles.inputContainer}>
            <AuthInput
              label="Email Address"
              icon="email-outline"
              placeholder="Email Address"
              value={formData.email}
              onChangeText={(v) => {
                handleInputChange('email', v);
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              error={errors.email}
            />
          </View>

          <View style={styles.inputContainer}>
            <AuthInput
              label="Password"
              icon="lock-outline"
              placeholder="Password"
              value={formData.password}
              onChangeText={(v) => {
                handleInputChange('password', v);
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
              }}
              secureTextEntry
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              autoCapitalize="none"
              editable={!isLoading}
              error={errors.password}
            />
          </View>

          <View style={styles.inputContainer}>
            <AuthInput
              label="Confirm Password"
              icon="lock-outline"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(v) => {
                handleInputChange('confirmPassword', v);
                if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
              }}
              secureTextEntry
              showPassword={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
              autoCapitalize="none"
              editable={!isLoading}
              error={errors.confirmPassword}
            />
          </View>

          <Button
            title={isLoading ? 'Creating Account...' : 'Continue'}
            onPress={handleRegister}
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
            Already have an account? 
            <TouchableOpacity onPress={navigateToLogin} disabled={isLoading}>
              <Text style={styles.registerText}> Login</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 40,
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
  eyeButton: {
    padding: 4,
    marginLeft: 8,
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
  registerText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: -0.408,
    color: '#1C6CA9',
  },
});

export default RegisterScreen;
