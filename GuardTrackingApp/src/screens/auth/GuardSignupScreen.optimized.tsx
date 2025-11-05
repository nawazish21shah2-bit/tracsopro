import React, { useState } from 'react';
import { View, StatusBar, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Button from '../../components/common/Button';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import PhoneInput from '../../components/auth/PhoneInput';
import AuthFooter from '../../components/auth/AuthFooter';
import { AuthStackParamList } from '../../types';
import { authStyles } from '../../styles/authStyles';

type GuardSignupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'GuardSignup'>;

interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

const GuardSignupScreen: React.FC = () => {
  const navigation = useNavigation<GuardSignupScreenNavigationProp>();
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    const phoneRegex = /^\d{10}$/;
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const fullPhoneNumber = `+1${formData.phoneNumber.replace(/\D/g, '')}`;
      const [firstName, ...lastNameParts] = formData.fullName.trim().split(' ');
      const lastName = lastNameParts.join(' ') || '';

      const registrationData = {
        firstName,
        lastName,
        email: formData.email.toLowerCase().trim(),
        phone: fullPhoneNumber,
        password: formData.password,
        role: 'GUARD',
      };

      console.log('Guard Registration Data:', registrationData);
      await new Promise<void>(resolve => setTimeout(resolve, 1500));

      navigation.navigate('GuardOTP', { 
        email: formData.email,
        isPasswordReset: false 
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView 
        contentContainerStyle={authStyles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AuthHeader title="SIGN UP" />

        <View style={authStyles.form}>
          <AuthInput
            icon="person-outline"
            placeholder="Full Name"
            value={formData.fullName}
            onChangeText={(text) => updateField('fullName', text)}
            error={errors.fullName}
            autoCapitalize="words"
          />

          <AuthInput
            icon="person-outline"
            placeholder="Email Address"
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <PhoneInput
            value={formData.phoneNumber}
            onChangeText={(text) => updateField('phoneNumber', text)}
            error={errors.phoneNumber}
          />

          <AuthInput
            icon="lock-closed-outline"
            placeholder="Password"
            value={formData.password}
            onChangeText={(text) => updateField('password', text)}
            error={errors.password}
            secureTextEntry
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />

          <AuthInput
            icon="lock-closed-outline"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(text) => updateField('confirmPassword', text)}
            error={errors.confirmPassword}
            secureTextEntry
            showPassword={showConfirmPassword}
            onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          />
        </View>

        <Button
          title="Continue"
          onPress={handleSignup}
          fullWidth
          size="large"
          loading={isLoading}
          style={authStyles.submitButton}
        />

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

export default GuardSignupScreen;
