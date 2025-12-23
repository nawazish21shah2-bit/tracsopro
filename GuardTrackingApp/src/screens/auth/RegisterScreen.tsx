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
import { globalStyles, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { authStyles, AUTH_INPUT_GAP } from '../../styles/authStyles';
import Logo from '../../assets/images/tracSOpro-logo.png';
import PhoneInput from '../../components/auth/PhoneInput';
import { Country } from '../../utils/countries';
import { showRegistrationError } from '../../utils/registrationErrorHandler';

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
    phone: '',
    password: '',
    confirmPassword: '',
    role: UserRole.GUARD,
  });
  
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

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

    // Phone validation (optional but validate format if provided)
    if (formData.phone && formData.phone.trim().length > 0) {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        newErrors.phone = 'Please enter a valid phone number';
      }
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
    // Prevent multiple submissions
    if (isLoading) {
      return;
    }

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
        phone: formData.phone || '', // Phone number from input
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
        // Use streamlined error handler for consistent UX
        showRegistrationError({
          error: result.payload,
          navigation,
        });
      }
    } catch (error) {
      showRegistrationError({
        error,
        navigation,
      });
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
        <View style={authStyles.logoContainer}>
          <Image source={Logo} style={authStyles.logoImage} resizeMode="contain" />
        </View>

        {/* Title */}
        <Text style={authStyles.title}>SIGN UP</Text>

        {/* Form */}
        <View style={authStyles.form}>
          <View style={authStyles.inputContainer}>
            <AuthInput
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

          <View style={authStyles.inputContainer}>
            <AuthInput
              icon="mail-outline"
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

          <View style={authStyles.inputContainer}>
            <PhoneInput
              placeholder="Phone Number"
              value={formData.phone}
              onChangeText={(v) => {
                handleInputChange('phone', v);
                if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
              }}
              onCountryChange={(country) => setSelectedCountry(country)}
              selectedCountry={selectedCountry || undefined}
              error={errors.phone}
            />
          </View>

          <View style={authStyles.inputContainer}>
            <AuthInput
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

          <View style={authStyles.inputContainer}>
            <AuthInput
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
        <View style={authStyles.footer}>
          <View style={styles.footerRow}>
            <Text style={authStyles.footerText}>Already have an account? </Text>
            <TouchableOpacity 
              onPress={navigateToLogin} 
              disabled={isLoading}
              activeOpacity={isLoading ? 1 : 0.7}
            >
              <Text style={[authStyles.linkText, isLoading && styles.disabledLink]}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: SPACING.xxxxl,
  },
  // Logo, title, form, inputContainer styles moved to authStyles.ts
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
  },
  iconContainer: {
    width: 20,
    height: 20,
    marginRight: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputIcon: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  eyeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 17,
    letterSpacing: -0.408,
    color: COLORS.textPrimary,
  },
  // Footer styles moved to authStyles.ts
  disabledLink: {
    opacity: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
  },
});

export default RegisterScreen;
