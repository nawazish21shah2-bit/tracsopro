// Profile Setup Screen Component
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../utils/theme';
import { AuthStackParamList } from '../../types';
import Button from '../../components/common/Button';
import Logo from '../../assets/images/tracSOpro-logo.png';

type ProfileSetupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'GuardProfileSetup'>;

const ProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<ProfileSetupScreenNavigationProp>();
  const { theme } = useTheme();

  const [formData, setFormData] = useState({
    experience: '',
    idCardFront: null,
    idCardBack: null,
    certification: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showExperienceDropdown, setShowExperienceDropdown] = useState(false);

  const experienceOptions = [
    '0-1 years',
    '1-3 years',
    '3-5 years',
    '5-10 years',
    '10+ years'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImagePicker = (field: string) => {
    // Simulate image picker
    Alert.alert(
      'Upload Image',
      `Select ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
      [
        { text: 'Camera', onPress: () => {
          setFormData(prev => ({ ...prev, [field]: 'camera_image.jpg' }));
        }},
        { text: 'Gallery', onPress: () => {
          setFormData(prev => ({ ...prev, [field]: 'gallery_image.jpg' }));
        }},
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(() => resolve(), 2000));
      
      // Navigate to main app dashboard
      Alert.alert(
        'Success', 
        'Profile setup completed successfully! Welcome to tracSOpro.',
        [
          { 
            text: 'Continue', 
            onPress: () => {
              // In a real app, this would trigger authentication state change
              // For now, we'll simulate successful login by navigating to Login
              // The AppNavigator will handle the transition to Dashboard
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to setup profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background.primary} />
      
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
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>SET UP YOUR PROFILE</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Add Experience */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Add Experience</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowExperienceDropdown(!showExperienceDropdown)}
            >
              <Text style={[styles.dropdownText, !formData.experience && styles.placeholderText]}>
                {formData.experience || 'Select experience in years'}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
            
            {showExperienceDropdown && (
              <View style={styles.dropdownList}>
                {experienceOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, experience: option }));
                      setShowExperienceDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ID Verification */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>ID Verification</Text>
            
            <TouchableOpacity
              style={styles.uploadCard}
              onPress={() => handleImagePicker('idCardFront')}
            >
              <View style={styles.uploadIconContainer}>
                <Icon name="image-outline" size={24} color="#6B7280" />
              </View>
              <Text style={styles.uploadText}>
                {formData.idCardFront ? 'ID Card Front - Selected' : 'Upload ID Card Front Image'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.uploadCard}
              onPress={() => handleImagePicker('idCardBack')}
            >
              <View style={styles.uploadIconContainer}>
                <Icon name="image-outline" size={24} color="#6B7280" />
              </View>
              <Text style={styles.uploadText}>
                {formData.idCardBack ? 'ID Card Back - Selected' : 'Upload ID Card Back Image'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Certification */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Certification</Text>
            
            <TouchableOpacity
              style={styles.uploadCard}
              onPress={() => handleImagePicker('certification')}
            >
              <View style={styles.uploadIconContainer}>
                <Icon name="document-outline" size={24} color="#6B7280" />
              </View>
              <Text style={styles.uploadText}>
                {formData.certification ? 'Certification - Selected' : 'Upload certification documents'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <Button
            title={isLoading ? 'Setting up...' : 'Submit'}
            onPress={handleSubmit}
            disabled={isLoading}
            loading={isLoading}
            fullWidth
            size="large"
            style={{ marginTop: 20 }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
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
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 19,
    color: '#000000',
    marginBottom: 16,
  },
  dropdown: {
    height: 56,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: -0.408,
    color: '#000000',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#6B7280',
  },
  dropdownList: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 17,
    color: '#374151',
  },
  uploadCard: {
    height: 72,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  uploadText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: -0.408,
    color: '#6B7280',
    flex: 1,
  },
});

export default ProfileSetupScreen;
