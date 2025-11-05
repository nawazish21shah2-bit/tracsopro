import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, MapPin, Save } from 'react-native-feather';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { siteService, CreateSiteData } from '../../services/siteService';

interface SiteFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  description: string;
  requirements: string;
  contactPerson: string;
  contactPhone: string;
}

const AddSiteScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SiteFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    description: '',
    requirements: '',
    contactPerson: '',
    contactPhone: '',
  });

  const handleInputChange = (field: keyof SiteFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Site name is required');
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert('Error', 'Address is required');
      return false;
    }
    if (!formData.city.trim()) {
      Alert.alert('Error', 'City is required');
      return false;
    }
    if (!formData.contactPerson.trim()) {
      Alert.alert('Error', 'Contact person is required');
      return false;
    }
    return true;
  };

  const handleSaveSite = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const siteData: CreateSiteData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zipCode: formData.zipCode.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        contactPerson: formData.contactPerson.trim(),
        contactPhone: formData.contactPhone.trim(),
      };

      const createdSite = await siteService.createSite(siteData);
      console.log('Site created successfully:', createdSite);
      
      Alert.alert(
        'Success',
        'Site created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error creating site:', error);
      Alert.alert(
        'Error', 
        error instanceof Error ? error.message : 'Failed to create site. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft width={24} height={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Site</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveSite}
          disabled={loading}
        >
          <Save width={20} height={20} color="#1C6CA9" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Site Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Site Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Site Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter site name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Brief description of the site"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Security Requirements</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.requirements}
              onChangeText={(value) => handleInputChange('requirements', value)}
              placeholder="Specific security requirements (e.g., licensed guard, 2+ years experience)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin width={20} height={20} color="#1C6CA9" />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address *</Text>
            <TextInput
              style={styles.input}
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              placeholder="Enter street address"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(value) => handleInputChange('city', value)}
                placeholder="City"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                value={formData.state}
                onChangeText={(value) => handleInputChange('state', value)}
                placeholder="State"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ZIP Code</Text>
            <TextInput
              style={[styles.input, styles.zipInput]}
              value={formData.zipCode}
              onChangeText={(value) => handleInputChange('zipCode', value)}
              placeholder="ZIP Code"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Person *</Text>
            <TextInput
              style={styles.input}
              value={formData.contactPerson}
              onChangeText={(value) => handleInputChange('contactPerson', value)}
              placeholder="Site manager or contact person"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.contactPhone}
              onChangeText={(value) => handleInputChange('contactPhone', value)}
              placeholder="Phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleSaveSite}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating Site...' : 'Create Site'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  saveButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 12,
  },
  zipInput: {
    width: 120,
  },
  createButton: {
    backgroundColor: '#1C6CA9',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddSiteScreen;
