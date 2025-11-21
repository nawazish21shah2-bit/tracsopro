// Enhanced Login Screen Component
import React, { useState, useCallback } from 'react';
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
import Logo from '../../assets/images/tracSOpro-logo.png';

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
    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(loginUser(formData));
      if (loginUser.fulfilled.match(result)) {
        // Navigation will be handled by AppNavigator based on auth state
      } else {
        Alert.alert('Login Failed', result.payload as string);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  }, [formData, validateForm, dispatch]);

  const navigateToRegister = useCallback(() => {
    navigation.navigate('RoleSelection');
  }, [navigation]);

  const navigateToForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword');
  }, [navigation]);

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
        <View style={styles.logoContainer}>
          <Image source={Logo} style={styles.logoImage} resizeMode="contain" />
        </View>

        {/* Title */}
        <Text style={styles.title}>LOGIN</Text>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <AuthInput
              ref={emailInputRef as any}
              // label="Email"
              icon="email-outline"
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

          {/* Forgot Password */}
          <TouchableOpacity onPress={navigateToForgotPassword} style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

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
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account? 
            <TouchableOpacity onPress={navigateToRegister}>
              <Text style={styles.registerText}> Register now</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 40,
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
    marginBottom: 60,
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
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 3,
    marginRight: 8,
  },
  rememberText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: -0.408,
    color: '#151515',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 16,
  },
  forgotText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: 0.01,
    color: '#1C6CA9',
  },
  loginButton: {
    height: 56,
    backgroundColor: '#1C6CA9',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 40,
  },
  loginButtonDisabled: {
    backgroundColor: '#ACD3F1',
  },
  loginButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: -0.408,
    color: '#FFFFFF',
  },
  arrowIcon: {
    position: 'absolute',
    right: 20,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
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
    marginTop: 4,
  },
});

export default LoginScreen;
