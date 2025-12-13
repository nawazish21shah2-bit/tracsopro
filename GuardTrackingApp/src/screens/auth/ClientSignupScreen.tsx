import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { registerUser } from '../../store/slices/authSlice';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from '../../components/common/Button';
import PhoneInput from '../../components/auth/PhoneInput';
import { AuthStackParamList, UserRole } from '../../types';
import Logo from '../../assets/images/tracSOpro-logo.png';
import { Country, defaultCountry } from '../../utils/countries';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

type ClientSignupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ClientSignup'>;
type ClientSignupScreenRouteProp = RouteProp<AuthStackParamList, 'ClientSignup'>;

const ClientSignupScreen: React.FC = () => {
  const navigation = useNavigation<ClientSignupScreenNavigationProp>();
  const route = useRoute<ClientSignupScreenRouteProp>();
  const dispatch = useDispatch<AppDispatch>();
  const accountType = route.params?.accountType || 'individual';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [invitationCode, setInvitationCode] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountry);

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else {
      const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
      // Validate phone number length (minimum 7, maximum 15 digits)
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        newErrors.phoneNumber = 'Please enter a valid phone number';
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

    // Invitation code validation (Required for Client)
    if (!invitationCode.trim()) {
      newErrors.invitationCode = 'Invitation code is required. Please contact your security company administrator.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    // Prevent multiple submissions
    if (isLoading) {
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Format phone number with country code
      const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
      const fullPhoneNumber = `${selectedCountry.dialCode}${phoneDigits}`;
      
      // Split full name into first and last name
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Prepare registration data
      const registrationData = {
        firstName,
        lastName,
        email: formData.email.toLowerCase().trim(),
        phone: fullPhoneNumber,
        password: formData.password,
        confirmPassword: formData.password, // Backend doesn't need this, but type requires it
        role: UserRole.CLIENT,
        accountType: accountType.toUpperCase(),
        invitationCode: invitationCode.trim() || undefined,
      };

      // Call registration API via Redux
      const result = await dispatch(registerUser(registrationData));
      
      if (registerUser.fulfilled.match(result)) {
        const payload = result.payload;
        
        // Check if tokens are returned (dev mode OTP bypass)
        if (payload.token && payload.user) {
          // OTP was bypassed - user is already authenticated, navigate to profile setup
          Alert.alert(
            'Registration Successful',
            payload.message || 'Your account has been created successfully.',
            [{ text: 'Continue', onPress: () => navigation.navigate('ClientProfileSetup', { accountType }) }]
          );
        } else {
          // Normal flow - need OTP verification
          navigation.navigate('ClientOTP', { 
            email: formData.email,
            accountType,
            isPasswordReset: false 
          });
        }
      } else {
        // Registration failed
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
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('Too many')) {
          Alert.alert(
            'Rate Limit Exceeded',
            'Too many registration attempts. Please wait a few minutes before trying again.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Registration Failed', errorMessage || 'Failed to create account. Please try again.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundPrimary} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={Logo} style={styles.logoImage} resizeMode="contain" />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>SIGN UP</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, errors.fullName && styles.inputError]}>
              <Icon name="person-outline" size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Full Name"
                value={formData.fullName}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, fullName: text }));
                  if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                }}
                placeholderTextColor={COLORS.textTertiary}
                autoCapitalize="words"
              />
            </View>
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
              <Icon name="person-outline" size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Email Address"
                value={formData.email}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, email: text }));
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Invitation Code */}
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, errors.invitationCode && styles.inputError]}>
              <Icon name="ticket-outline" size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Invitation Code *"
                value={invitationCode}
                onChangeText={(text) => {
                  setInvitationCode(text);
                  if (errors.invitationCode) setErrors(prev => ({ ...prev, invitationCode: '' }));
                }}
                placeholderTextColor={COLORS.textTertiary}
                autoCapitalize="characters"
              />
            </View>
            {errors.invitationCode && <Text style={styles.errorText}>{errors.invitationCode}</Text>}
          </View>

          {/* Phone Number */}
          <View style={styles.inputContainer}>
            <PhoneInput
              value={formData.phoneNumber}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, phoneNumber: text }));
                if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: '' }));
              }}
              onCountryChange={(country) => setSelectedCountry(country)}
              selectedCountry={selectedCountry}
              error={errors.phoneNumber}
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
              <Icon name="lock-closed-outline" size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                value={formData.password}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, password: text }));
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                placeholderTextColor={COLORS.textTertiary}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Icon 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color={COLORS.textTertiary} 
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
              <Icon name="lock-closed-outline" size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, confirmPassword: text }));
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }}
                placeholderTextColor={COLORS.textTertiary}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Icon 
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color={COLORS.textTertiary} 
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>
        </View>

        {/* Continue Button */}
        <Button
          title="Continue"
          onPress={handleSignup}
          fullWidth
          size="large"
          loading={isLoading}
          style={styles.continueButton}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account? 
            <TouchableOpacity 
              onPress={navigateToLogin}
              disabled={isLoading}
              activeOpacity={isLoading ? 1 : 0.7}
            >
              <Text style={[styles.loginText, isLoading && styles.disabledLink]}> Login</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xxxxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxxxl,
  },
  logoImage: {
    width: 160,
    height: 140,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxxxl,
  },
  title: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    lineHeight: 29,
    textAlign: 'center',
    letterSpacing: 1,
    color: COLORS.textPrimary,
  },
  form: {
    marginBottom: SPACING.xxxxl,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    height: 56,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    marginRight: SPACING.md,
  },
  textInput: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: SPACING.xs,
  },
  errorText: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  continueButton: {
    marginBottom: SPACING.xxl,
  },
  footer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  footerText: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  loginText: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
  },
  disabledLink: {
    opacity: 0.5,
  },
});

export default ClientSignupScreen;
