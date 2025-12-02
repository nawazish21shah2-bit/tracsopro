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
import Icon from 'react-native-vector-icons/Ionicons';
import Button from '../../components/common/Button';
import { AuthStackParamList } from '../../types';
import { AppDispatch } from '../../store';
import { getCurrentUser } from '../../store/slices/authSlice';
import apiService from '../../services/api';
import Logo from '../../assets/images/tracSOpro-logo.png';

type ClientProfileSetupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ClientProfileSetup'>;
type ClientProfileSetupScreenRouteProp = RouteProp<AuthStackParamList, 'ClientProfileSetup'>;

interface ProfileData {
  // Common fields
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Company-specific fields
  companyName: string;
  companyRegistrationNumber: string;
  taxId: string;
  website: string;
}

const ClientProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<ClientProfileSetupScreenNavigationProp>();
  const route = useRoute<ClientProfileSetupScreenRouteProp>();
  const dispatch = useDispatch<AppDispatch>();
  const accountType = route.params?.accountType || 'individual';

  const [profileData, setProfileData] = useState<ProfileData>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    companyName: '',
    companyRegistrationNumber: '',
    taxId: '',
    website: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Common validations
    if (!profileData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!profileData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!profileData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!profileData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(profileData.zipCode.trim())) {
      newErrors.zipCode = 'Please enter a valid ZIP code (12345 or 12345-6789)';
    }

    // Company-specific validations
    if (accountType === 'company') {
      if (!profileData.companyName.trim()) {
        newErrors.companyName = 'Company name is required';
      }

      if (!profileData.companyRegistrationNumber.trim()) {
        newErrors.companyRegistrationNumber = 'Company registration number is required';
      }

      if (!profileData.taxId.trim()) {
        newErrors.taxId = 'Tax ID is required';
      }

      if (profileData.website && !/^https?:\/\/.+/.test(profileData.website.trim())) {
        newErrors.website = 'Please enter a valid website URL (starting with http:// or https://)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Prepare profile update data
      const profileUpdateData = {
        address: profileData.address.trim(),
        city: profileData.city.trim(),
        state: profileData.state.trim(),
        zipCode: profileData.zipCode.trim(),
        country: profileData.country,
        ...(accountType === 'company' && {
          companyName: profileData.companyName.trim(),
          companyRegistrationNumber: profileData.companyRegistrationNumber.trim(),
          taxId: profileData.taxId.trim(),
          website: profileData.website.trim() || undefined,
        }),
      };

      // Call API to update client profile
      const result = await apiService.updateClientProfile(profileUpdateData);
      
      if (result.success) {
        // Refresh user data to get updated profile
        await dispatch(getCurrentUser());
        
        Alert.alert(
          'Profile Created',
          `Your ${accountType} client profile has been created successfully!`,
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigation will be handled by AppNavigator based on auth state
                console.log('Profile setup complete');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to create profile. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
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
          <Text style={styles.title}>
            {accountType === 'company' ? 'COMPANY PROFILE' : 'PROFILE SETUP'}
          </Text>
          <Text style={styles.subtitle}>
            {accountType === 'company' 
              ? 'Complete your company information' 
              : 'Complete your profile information'
            }
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Company-specific fields */}
          {accountType === 'company' && (
            <>
              {/* Company Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Company Name *</Text>
                <View style={[styles.inputWrapper, errors.companyName && styles.inputError]}>
                  <Icon name="business-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter company name"
                    value={profileData.companyName}
                    onChangeText={(text) => handleInputChange('companyName', text)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                {errors.companyName && <Text style={styles.errorText}>{errors.companyName}</Text>}
              </View>

              {/* Company Registration Number */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Company Registration Number *</Text>
                <View style={[styles.inputWrapper, errors.companyRegistrationNumber && styles.inputError]}>
                  <Icon name="document-text-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter registration number"
                    value={profileData.companyRegistrationNumber}
                    onChangeText={(text) => handleInputChange('companyRegistrationNumber', text)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                {errors.companyRegistrationNumber && <Text style={styles.errorText}>{errors.companyRegistrationNumber}</Text>}
              </View>

              {/* Tax ID */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tax ID *</Text>
                <View style={[styles.inputWrapper, errors.taxId && styles.inputError]}>
                  <Icon name="card-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter tax ID"
                    value={profileData.taxId}
                    onChangeText={(text) => handleInputChange('taxId', text)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                {errors.taxId && <Text style={styles.errorText}>{errors.taxId}</Text>}
              </View>

              {/* Website */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Website</Text>
                <View style={[styles.inputWrapper, errors.website && styles.inputError]}>
                  <Icon name="globe-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="https://www.company.com"
                    value={profileData.website}
                    onChangeText={(text) => handleInputChange('website', text)}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
                {errors.website && <Text style={styles.errorText}>{errors.website}</Text>}
              </View>
            </>
          )}

          {/* Address Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Address Information</Text>

            {/* Address */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Street Address *</Text>
              <View style={[styles.inputWrapper, errors.address && styles.inputError]}>
                <Icon name="location-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter street address"
                  value={profileData.address}
                  onChangeText={(text) => handleInputChange('address', text)}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            {/* City and State */}
            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.inputLabel}>City *</Text>
                <View style={[styles.inputWrapper, errors.city && styles.inputError]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="City"
                    value={profileData.city}
                    onChangeText={(text) => handleInputChange('city', text)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.inputLabel}>State *</Text>
                <View style={[styles.inputWrapper, errors.state && styles.inputError]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="State"
                    value={profileData.state}
                    onChangeText={(text) => handleInputChange('state', text)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
              </View>
            </View>

            {/* ZIP Code */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>ZIP Code *</Text>
              <View style={[styles.inputWrapper, errors.zipCode && styles.inputError]}>
                <Icon name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="12345 or 12345-6789"
                  value={profileData.zipCode}
                  onChangeText={(text) => handleInputChange('zipCode', text)}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              {errors.zipCode && <Text style={styles.errorText}>{errors.zipCode}</Text>}
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <Button
          title="Complete Setup"
          onPress={handleSubmit}
          fullWidth
          size="large"
          loading={isLoading}
          style={styles.submitButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logoImage: {
    width: 160,
    height: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Montserrat',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 29,
    textAlign: 'center',
    letterSpacing: 1,
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#6B7280',
  },
  form: {
    marginBottom: 40,
  },
  sectionContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 18,
    color: '#000000',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    color: '#000000',
    paddingVertical: 0,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  errorText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    marginBottom: 20,
  },
});

export default ClientProfileSetupScreen;
