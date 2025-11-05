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
import { PersonIcon, PasswordIcon, EyeIcon, EyeSlashIcon } from '../../components/ui/AppIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { registerUser, clearError } from '../../store/slices/authSlice';
import { AuthStackParamList, UserRole } from '../../types';
import { useTheme } from '../../utils/theme';
import Input from '../../components/common/Input';
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRegister = async () => {
    // Validation
    if (!formData.email || !formData.password || !formData.fullName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isValidEmail(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
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

    try {
      // Split full name into first and last name for API
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const registerData = {
        firstName,
        lastName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: '', // Will be collected in profile setup
        role: formData.role,
      };
      
      const result = await dispatch(registerUser(registerData));
      if (registerUser.fulfilled.match(result)) {
        navigation.navigate('EmailVerification', { email: formData.email });
      } else {
        Alert.alert('Registration Failed', result.payload as string);
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
            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <PersonIcon size={20} color="#1C6CA9" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Full Name"
                placeholderTextColor="#9CA3AF"
                value={formData.fullName}
                onChangeText={(value) => handleInputChange('fullName', value)}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <PersonIcon size={20} color="#1C6CA9" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Email Address"
                placeholderTextColor="#9CA3AF"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <PasswordIcon size={20} color="#F59E0B" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <EyeSlashIcon size={20} color="#6B7280" />
                ) : (
                  <EyeIcon size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <PasswordIcon size={20} color="#F59E0B" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Confirm Password"
                placeholderTextColor="#9CA3AF"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon size={20} color="#6B7280" />
                ) : (
                  <EyeIcon size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
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
    height: 160,
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
