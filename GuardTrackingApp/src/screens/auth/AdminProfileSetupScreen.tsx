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
import Button from '../../components/common/Button';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import { AuthStackParamList } from '../../types';
import { AppDispatch } from '../../store';
import { getCurrentUser } from '../../store/slices/authSlice';
import apiService from '../../services/api';
import { authStyles } from '../../styles/authStyles';
import { COLORS, SPACING } from '../../styles/globalStyles';

type AdminProfileSetupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'AdminProfileSetup'>;
type AdminProfileSetupScreenRouteProp = RouteProp<AuthStackParamList, 'AdminProfileSetup'>;

interface ProfileData {
  // Company fields
  companyName: string;
  companyRegistrationNumber: string;
  taxId: string;
  website: string;
  
  // Address fields
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const AdminProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<AdminProfileSetupScreenNavigationProp>();
  const route = useRoute<AdminProfileSetupScreenRouteProp>();
  const dispatch = useDispatch<AppDispatch>();
  const accountType = route.params?.accountType || 'company';

  const [profileData, setProfileData] = useState<ProfileData>({
    companyName: '',
    companyRegistrationNumber: '',
    taxId: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Company validations
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

    // Address validations
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
        companyName: profileData.companyName.trim(),
        companyRegistrationNumber: profileData.companyRegistrationNumber.trim(),
        taxId: profileData.taxId.trim(),
        website: profileData.website.trim() || undefined,
      };

      // Call API to update admin profile (using client profile API for now, or create admin-specific)
      // Note: You may need to create updateAdminProfile API method
      const result = await apiService.updateClientProfile(profileUpdateData);
      
      if (result.success) {
        // Refresh user data to get updated profile
        await dispatch(getCurrentUser());
        
        Alert.alert(
          'Profile Created',
          'Your company admin profile has been created successfully!',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigation will be handled by AppNavigator based on auth state
                console.log('Admin profile setup complete');
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
    <View style={authStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundPrimary} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AuthHeader
          title="COMPANY PROFILE"
          subtitle="Complete your company information to manage your organization"
        />

        <View style={authStyles.form}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Company Information</Text>

            <View style={authStyles.inputContainer}>
              <AuthInput
                label="Company Name"
                required
                icon="business"
                placeholder="Enter company name"
                value={profileData.companyName}
                onChangeText={(text) => handleInputChange('companyName', text)}
                error={errors.companyName}
              />
            </View>

            <View style={authStyles.inputContainer}>
              <AuthInput
                label="Company Registration Number"
                required
                icon="description"
                placeholder="Enter registration number"
                value={profileData.companyRegistrationNumber}
                onChangeText={(text) => handleInputChange('companyRegistrationNumber', text)}
                error={errors.companyRegistrationNumber}
              />
            </View>

            <View style={authStyles.inputContainer}>
              <AuthInput
                label="Tax ID"
                required
                icon="credit-card"
                placeholder="Enter tax ID"
                value={profileData.taxId}
                onChangeText={(text) => handleInputChange('taxId', text)}
                error={errors.taxId}
              />
            </View>

            <View style={authStyles.inputContainer}>
              <AuthInput
                label="Website"
                icon="language"
                placeholder="https://www.company.com"
                value={profileData.website}
                onChangeText={(text) => handleInputChange('website', text)}
                keyboardType="url"
                autoCapitalize="none"
                error={errors.website}
              />
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Address Information</Text>

            <View style={authStyles.inputContainer}>
              <AuthInput
                label="Street Address"
                required
                icon="location-on"
                placeholder="Enter street address"
                value={profileData.address}
                onChangeText={(text) => handleInputChange('address', text)}
                error={errors.address}
              />
            </View>

            <View style={styles.rowContainer}>
              <View style={[authStyles.inputContainer, styles.halfWidth]}>
                <AuthInput
                  label="City"
                  required
                  placeholder="City"
                  value={profileData.city}
                  onChangeText={(text) => handleInputChange('city', text)}
                  error={errors.city}
                />
              </View>

              <View style={[authStyles.inputContainer, styles.halfWidth]}>
                <AuthInput
                  label="State"
                  required
                  placeholder="State"
                  value={profileData.state}
                  onChangeText={(text) => handleInputChange('state', text)}
                  error={errors.state}
                />
              </View>
            </View>

            <View style={authStyles.inputContainer}>
              <AuthInput
                label="ZIP Code"
                required
                icon="pin"
                placeholder="12345 or 12345-6789"
                value={profileData.zipCode}
                onChangeText={(text) => handleInputChange('zipCode', text)}
                keyboardType="numeric"
                error={errors.zipCode}
              />
            </View>
          </View>
        </View>

        <View style={authStyles.authActions}>
          <Button
            title="Complete Setup"
            onPress={handleSubmit}
            fullWidth
            size="large"
            loading={isLoading}
            style={authStyles.submitButton}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: SPACING.xxxl,
  },
  sectionContainer: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  halfWidth: {
    flex: 1,
  },
});

export default AdminProfileSetupScreen;

