import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
 
import Button from '../../components/common/Button';
import { AuthStackParamList, UserRole } from '../../types';
import { AppDispatch } from '../../store';
import { getCurrentUser } from '../../store/slices/authSlice';
import apiService from '../../services/api';
import Logo from '../../assets/images/tracSOpro-logo.png';
import { CameraIcon, IDCardIcon, CertificationIcon, PersonIcon, AppIcon } from '../../components/ui/AppIcons';

type GuardProfileSetupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'GuardProfileSetup'>;

interface ProfileData {
  profilePicture: string | null;
  experience: string;
  idCardFront: string | null;
  idCardBack: string | null; 
  certifications: string[];
}

const GuardProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<GuardProfileSetupScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const [profileData, setProfileData] = useState<ProfileData>({
    profilePicture: null,
    experience: '',
    idCardFront: null,
    idCardBack: null,
    certifications: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showExperienceDropdown, setShowExperienceDropdown] = useState(false);

  const experienceOptions = [
    'Select experience in years',
    '0-1 years',
    '1-3 years',
    '3-5 years',
    '5-10 years',
    '10+ years',
  ];

  const handleImagePicker = (type: 'profile' | 'idFront' | 'idBack' | 'certification') => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri || '';
        
        switch (type) {
          case 'profile':
            setProfileData(prev => ({ ...prev, profilePicture: imageUri }));
            break;
          case 'idFront':
            setProfileData(prev => ({ ...prev, idCardFront: imageUri }));
            break;
          case 'idBack':
            setProfileData(prev => ({ ...prev, idCardBack: imageUri }));
            break;
          case 'certification':
            setProfileData(prev => ({ 
              ...prev, 
              certifications: [...prev.certifications, imageUri] 
            }));
            break;
        }
      }
    });
  };

  const handleExperienceSelect = (experience: string) => {
    if (experience !== 'Select experience in years') {
      setProfileData(prev => ({ ...prev, experience }));
    }
    setShowExperienceDropdown(false);
  };

  const validateForm = (): boolean => {
    if (!profileData.experience || profileData.experience === 'Select experience in years') {
      Alert.alert('Missing Information', 'Please select your experience level');
      return false;
    }

    if (!profileData.idCardFront) {
      Alert.alert('Missing Information', 'Please upload your ID card front image');
      return false;
    }

    if (!profileData.idCardBack) {
      Alert.alert('Missing Information', 'Please upload your ID card back image');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Upload images first (if any) - for now, we'll send URIs
      // In production, you'd upload to S3/cloud storage first
      const profileDataToSend = {
        experience: profileData.experience,
        profilePictureUrl: profileData.profilePicture,
        idCardFrontUrl: profileData.idCardFront,
        idCardBackUrl: profileData.idCardBack,
        certificationUrls: profileData.certifications,
      };

      // Call API to update guard profile
      const result = await apiService.updateGuardProfile(profileDataToSend);
      
      if (result.success) {
        // Refresh user data to get updated profile
        await dispatch(getCurrentUser());
        
        Alert.alert(
          'Profile Created',
          'Your guard profile has been created successfully!',
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
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={Logo} style={styles.logoImage} resizeMode="contain" />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>SET UP YOUR PROFILE</Text>
        </View>

        {/* Profile Picture */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity 
            style={styles.profilePictureContainer}
            onPress={() => handleImagePicker('profile')}
          >
            {profileData.profilePicture ? (
              <Image 
                source={{ uri: profileData.profilePicture }} 
                style={styles.profilePicture}
              />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <PersonIcon size={40} color="#9CA3AF" />
                <View style={styles.cameraIcon}>
                  <CameraIcon size={16} color="#1C6CA9" />
                </View>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.addPictureText}>Add Picture</Text>
        </View>

        {/* Experience */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Add Experience</Text>
          <TouchableOpacity
            style={styles.dropdownContainer}
            onPress={() => setShowExperienceDropdown(!showExperienceDropdown)}
          >
            <Text style={[
              styles.dropdownText,
              !profileData.experience && styles.dropdownPlaceholder
            ]}>
              {profileData.experience || 'Select experience in years'}
            </Text>
            <AppIcon 
              type="material"
              name={showExperienceDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
          
          {showExperienceDropdown && (
            <View style={styles.dropdownOptions}>
              {experienceOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownOption}
                  onPress={() => handleExperienceSelect(option)}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    index === 0 && styles.dropdownOptionPlaceholder
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ID Verification */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>ID Verification</Text>
          
          {/* ID Card Front */}
          <TouchableOpacity
            style={styles.uploadContainer}
            onPress={() => handleImagePicker('idFront')}
          >
            {profileData.idCardFront ? (
              <Image 
                source={{ uri: profileData.idCardFront }} 
                style={styles.uploadedImage}
              />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <IDCardIcon size={24} color="#9CA3AF" />
                <Text style={styles.uploadText}>Upload ID Card Front Image</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ID Card Back */}
          <TouchableOpacity
            style={styles.uploadContainer}
            onPress={() => handleImagePicker('idBack')}
          >
            {profileData.idCardBack ? (
              <Image 
                source={{ uri: profileData.idCardBack }} 
                style={styles.uploadedImage}
              />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <IDCardIcon size={24} color="#9CA3AF" />
                <Text style={styles.uploadText}>Upload ID Card Back Image</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Certification */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Certification</Text>
          <TouchableOpacity
            style={styles.uploadContainer}
            onPress={() => handleImagePicker('certification')}
          >
            {profileData.certifications.length > 0 ? (
              <View style={styles.certificationsContainer}>
                {profileData.certifications.map((cert, index) => (
                  <Image 
                    key={index}
                    source={{ uri: cert }} 
                    style={styles.certificationImage}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <CertificationIcon size={24} color="#9CA3AF" />
                <Text style={styles.uploadText}>Upload certification documents</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <Button
          title="Submit"
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
    height: 140,
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
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#000000',
    marginBottom: 12,
  },
  profilePictureContainer: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  addPictureText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  dropdownText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    color: '#000000',
  },
  dropdownPlaceholder: {
    color: '#9CA3AF',
  },
  dropdownOptions: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    color: '#000000',
  },
  dropdownOptionPlaceholder: {
    color: '#9CA3AF',
  },
  uploadContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  certificationImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 20,
  },
});

export default GuardProfileSetupScreen;
