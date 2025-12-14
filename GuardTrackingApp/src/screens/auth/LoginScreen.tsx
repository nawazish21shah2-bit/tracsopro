// Enhanced Login Screen Component
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
} from 'react-native';
import { ArrowRightIcon } from '../../components/ui/AppIcons';
import { AppIcon } from '../../components/ui/AppIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../../store';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../types';
import Input from '../../components/common/Input';
import AuthInput from '../../components/auth/AuthInput';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { createLoginValidator, ValidationResult } from '../../utils/validation';
import { useTheme } from '../../utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logo from '../../assets/images/tracSOpro-logo.png';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { authStyles, AUTH_INPUT_GAP } from '../../styles/authStyles';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const { theme } = useTheme();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Refs for input focus management
  const emailInputRef = React.useRef<TextInput>(null);
  const passwordInputRef = React.useRef<TextInput>(null);

  const validator = createLoginValidator();

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  }, [validationErrors]);

  const validateForm = useCallback((): boolean => {
    const validation: ValidationResult = validator.validateForm(formData);
    setValidationErrors(validation.errors);
    return validation.isValid;
  }, [formData, validator]);

  const handleLogin = useCallback(async () => {
    // Prevent multiple submissions
    if (isLoading) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      // Save credentials if remember me is checked
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedEmail', formData.email);
        await AsyncStorage.setItem('rememberedPassword', formData.password);
      } else {
        // Clear saved credentials if remember me is unchecked
        await AsyncStorage.removeItem('rememberedEmail');
        await AsyncStorage.removeItem('rememberedPassword');
      }

      const result = await dispatch(loginUser(formData));
      if (loginUser.fulfilled.match(result)) {
        // Log success for debugging
        if (__DEV__) {
          console.log('✅ Login successful, user:', result.payload.user?.email, 'role:', result.payload.user?.role);
        }
        // Navigation will be handled by AppNavigator based on auth state
        // The AppNavigator will detect isAuthenticated change and navigate to Main
      } else {
        const errorMessage = result.payload as string;
        if (__DEV__) {
          console.error('❌ Login failed:', errorMessage);
        }
        Alert.alert('Login Failed', errorMessage);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  }, [formData, validateForm, dispatch, rememberMe]);

  const navigateToRegister = useCallback(() => {
    navigation.navigate('RoleSelection');
  }, [navigation]);

  const navigateToForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword');
  }, [navigation]);

  // Load saved credentials on mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('rememberedEmail');
        const savedPassword = await AsyncStorage.getItem('rememberedPassword');
        if (savedEmail && savedPassword) {
          setFormData({
            email: savedEmail,
            password: savedPassword,
          });
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    };

    loadSavedCredentials();
  }, []);

  // Clear error when component unmounts
  React.useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError());
      }
    };
  }, [dispatch, error]);

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Logo */}
        <View style={authStyles.logoContainer}>
          <Image source={Logo} style={authStyles.logoImage} resizeMode="contain" />
        </View>

        {/* Title */}
        <Text style={authStyles.title}>LOGIN</Text>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <AuthInput
              ref={emailInputRef as any}
              // label="Email"
              icon="mail-outline"
              placeholder="Email Address"
              value={formData.email}
              onChangeText={(v) => handleInputChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <AuthInput
              ref={passwordInputRef as any}
              // label="Password"
              icon="lock-outline"
              placeholder="Password"
              value={formData.password}
              onChangeText={(v) => handleInputChange('password', v)}
              secureTextEntry
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          {/* Remember Me and Forgot Password */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              onPress={() => setRememberMe(!rememberMe)} 
              style={styles.rememberContainer}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && (
                  <AppIcon 
                    type="material" 
                    name="check" 
                    size={16} 
                    color="#FFFFFF" 
                  />
                )}
              </View>
              <Text style={styles.rememberText}>Remember Me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={navigateToForgotPassword} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <Button
            title={isLoading ? 'Signing In...' : 'Login'}
            onPress={handleLogin}
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
            <Text style={authStyles.footerText}>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={navigateToRegister}
              disabled={isLoading}
              activeOpacity={isLoading ? 1 : 0.7}
            >
              <Text style={[authStyles.linkText, isLoading && styles.disabledLink]}>Register now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  // Logo, title, footer styles moved to authStyles.ts
  form: {
    paddingHorizontal: SPACING.lg,
    flex: 1,
  },
  inputContainer: {
    marginBottom: AUTH_INPUT_GAP, // 16px - consistent spacing
  },
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
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xl, // 20px - reduced space between password field and Remember Me
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xs,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rememberText: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 17,
    letterSpacing: 0.01,
    color: COLORS.textPrimary,
  },
  forgotText: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 17,
    letterSpacing: 0.01,
    color: COLORS.primary,
  },
  loginButton: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: SPACING.xxxxl,
    ...SHADOWS.small,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.primaryLight,
  },
  loginButtonText: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: -0.408,
    color: COLORS.textInverse,
  },
  arrowIcon: {
    position: 'absolute',
    right: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
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

export default LoginScreen;
