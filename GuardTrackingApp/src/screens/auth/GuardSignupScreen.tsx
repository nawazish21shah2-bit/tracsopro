import React, { useState } from 'react';
import { View, StatusBar, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { registerUser } from '../../store/slices/authSlice';
import Button from '../../components/common/Button';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import PhoneInput from '../../components/auth/PhoneInput';
import AuthFooter from '../../components/auth/AuthFooter';
import { AuthStackParamList, UserRole } from '../../types';
import { authStyles } from '../../styles/authStyles';
import { Country, defaultCountry } from '../../utils/countries';
import { COLORS } from '../../styles/globalStyles';

type GuardSignupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'GuardSignup'>;

interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  invitationCode?: string;
}

const GuardSignupScreen: React.FC = () => {
  const navigation = useNavigation<GuardSignupScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [invitationCode, setInvitationCode] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountry);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else {
      const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
      // Validate phone number length (minimum 7, maximum 15 digits)
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        newErrors.phoneNumber = 'Please enter a valid phone number';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Invitation code validation (Required for Guard)
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

      // Call registration API via Redux
      const registrationData = {
        firstName,
        lastName,
        email: formData.email.toLowerCase().trim(),
        phone: fullPhoneNumber,
        password: formData.password,
        confirmPassword: formData.password, // Backend doesn't need this, but type requires it
        role: UserRole.GUARD,
        invitationCode: invitationCode.trim() || undefined,
      };

      const result = await dispatch(registerUser(registrationData));
      
      if (registerUser.fulfilled.match(result)) {
        const payload = result.payload;
        
        // Check if tokens are returned (dev mode OTP bypass)
        if (payload.token && payload.user) {
          // OTP was bypassed - user is already authenticated, navigate to profile setup
          Alert.alert(
            'Registration Successful',
            payload.message || 'Your account has been created successfully.',
            [{ text: 'Continue', onPress: () => navigation.navigate('GuardProfileSetup') }]
          );
        } else {
          // Normal flow - need OTP verification
          navigation.navigate('GuardOTP', { 
            email: formData.email,
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
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const navigateToLogin = () => navigation.navigate('Login');

  return (
    <View style={authStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundPrimary} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AuthHeader title="SIGN UP" />

        <View style={authStyles.form}>
          <View style={authStyles.inputContainer}>
            <AuthInput
              icon="person-outline"
              placeholder="Full Name"
              value={formData.fullName}
              onChangeText={(text) => updateField('fullName', text)}
              error={errors.fullName}
              autoCapitalize="words"
            />
          </View>

          <View style={authStyles.inputContainer}>
            <AuthInput
              icon="mail-outline"
              placeholder="Email Address"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
          </View>

          <View style={authStyles.inputContainer}>
            <AuthInput
              icon="help-outline"
              placeholder="Invitation Code *"
              value={invitationCode}
              onChangeText={(text) => {
                setInvitationCode(text);
                if (errors.invitationCode) setErrors(prev => ({ ...prev, invitationCode: '' }));
              }}
              autoCapitalize="characters"
              error={errors.invitationCode}
            />
          </View>

          <View style={authStyles.inputContainer}>
            <PhoneInput
              placeholder="Phone Number"
              value={formData.phoneNumber}
              onChangeText={(text) => updateField('phoneNumber', text)}
              onCountryChange={(country) => setSelectedCountry(country)}
              selectedCountry={selectedCountry}
              error={errors.phoneNumber}
            />
          </View>

          <View style={authStyles.inputContainer}>
            <AuthInput
              icon="lock-outline"
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              secureTextEntry={true}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              error={errors.password}
            />
          </View>

          <View style={authStyles.inputContainer}>
            <AuthInput
              icon="lock-outline"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
              error={errors.confirmPassword}
              secureTextEntry
              showPassword={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Continue"
            onPress={handleSignup}
            fullWidth
            size="large"
            loading={isLoading}
            style={styles.submitButton}
          />
        </View>

        <AuthFooter
          text="Already have an account?"
          linkText="Login"
          onLinkPress={navigateToLogin}
          disabled={isLoading}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: SPACING.xxxxl,
  },
  buttonContainer: {
    paddingHorizontal: SPACING.lg, // Same padding as form
    marginTop: SPACING.xxxxl, // 40px spacing above button
  },
  submitButton: {
    // Button styles handled by Button component
  },
});

export default GuardSignupScreen;
