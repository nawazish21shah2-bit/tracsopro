import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { registerUser } from '../../store/slices/authSlice';
import Button from '../../components/common/Button';
import PhoneInput from '../../components/auth/PhoneInput';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthFooter from '../../components/auth/AuthFooter';
import { AuthStackParamList, UserRole } from '../../types';
import { Country, defaultCountry } from '../../utils/countries';
import { COLORS, SPACING } from '../../styles/globalStyles';
import { authStyles } from '../../styles/authStyles';
import { showRegistrationError } from '../../utils/registrationErrorHandler';

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else {
      const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
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

    if (!invitationCode.trim()) {
      newErrors.invitationCode =
        'Invitation code is required. Please contact your security company administrator.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSignup = async () => {
    if (isLoading || !validateForm()) return;

    setIsLoading(true);
    try {
      const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
      const fullPhoneNumber = `${selectedCountry.dialCode}${phoneDigits}`;
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      const registrationData = {
        firstName,
        lastName,
        email: formData.email.toLowerCase().trim(),
        phone: fullPhoneNumber,
        password: formData.password,
        confirmPassword: formData.password,
        role: UserRole.CLIENT,
        accountType: accountType.toUpperCase(),
        invitationCode: invitationCode.trim() || undefined,
      };

      const result = await dispatch(registerUser(registrationData));

      if (registerUser.fulfilled.match(result)) {
        const payload = result.payload;
        if (payload.token && payload.user) {
          Alert.alert(
            'Registration Successful',
            payload.message || 'Your account has been created successfully.',
            [{ text: 'Continue', onPress: () => navigation.navigate('ClientProfileSetup', { accountType }) }],
          );
        } else {
          navigation.navigate('ClientOTP', {
            email: formData.email,
            accountType,
            isPasswordReset: false,
          });
        }
      } else {
        showRegistrationError({ error: result.payload, navigation });
      }
    } catch (error) {
      showRegistrationError({ error, navigation });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundPrimary} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AuthHeader title="SIGN UP" />

        <View style={[authStyles.form, styles.form]}>
          <View style={authStyles.inputContainer}>
            <AuthInput
              icon="person-outline"
              placeholder="Full Name"
              value={formData.fullName}
              onChangeText={(text) => updateField('fullName', text)}
              autoCapitalize="words"
              error={errors.fullName}
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
              icon="vpn-key"
              placeholder="Invitation Code *"
              value={invitationCode}
              onChangeText={(text) => {
                setInvitationCode(text);
                if (errors.invitationCode) setErrors((prev) => ({ ...prev, invitationCode: '' }));
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
              secureTextEntry
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
              secureTextEntry
              showPassword={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
              error={errors.confirmPassword}
            />
          </View>
        </View>

        <View style={authStyles.authActions}>
          <Button
            title="Continue"
            onPress={handleSignup}
            fullWidth
            size="large"
            loading={isLoading}
            style={authStyles.submitButton}
          />
        </View>

        <AuthFooter
          text="Already have an account?"
          linkText="Login"
          onLinkPress={() => navigation.navigate('Login')}
          disabled={isLoading}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: SPACING.lg,
  },
  form: {
    flex: 0,
  },
});

export default ClientSignupScreen;
