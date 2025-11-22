import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Briefcase } from 'react-native-feather';
import { settingsService } from '../../services/settingsService';

interface CompanyDetailsScreenProps {
  variant?: 'client' | 'guard' | 'admin';
  profileDrawer?: React.ReactNode;
  onSave?: () => void;
}

const CompanyDetailsScreen: React.FC<CompanyDetailsScreenProps> = ({
  variant = 'client',
  profileDrawer,
  onSave,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companyRegistrationNumber: '',
    taxId: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    website: '',
  });

  useEffect(() => {
    loadCompanyDetails();
  }, []);

  const loadCompanyDetails = async () => {
    try {
      setLoading(true);
      const companyDetails = await settingsService.getCompanyDetails();
      if (companyDetails) {
        setFormData({
          companyName: companyDetails.companyName || '',
          companyRegistrationNumber: companyDetails.companyRegistrationNumber || '',
          taxId: companyDetails.taxId || '',
          address: companyDetails.address || '',
          city: companyDetails.city || '',
          state: companyDetails.state || '',
          zipCode: companyDetails.zipCode || '',
          country: companyDetails.country || '',
          website: companyDetails.website || '',
        });
      }
    } catch (error: any) {
      console.error('Error loading company details:', error);
      const errorMessage = error?.message || 'Failed to load company details';
      if (errorMessage.includes('session has expired') || errorMessage.includes('expired')) {
        // Session expired - handled by makeRequest
      } else if (!errorMessage.includes('not found')) {
        // Only show error if it's not a "not found" error (new client)
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.companyName.trim()) {
      Alert.alert('Validation Error', 'Company name is required');
      return;
    }

    try {
      setSaving(true);
      await settingsService.updateCompanyDetails({
        companyName: formData.companyName.trim(),
        companyRegistrationNumber: formData.companyRegistrationNumber.trim() || undefined,
        taxId: formData.taxId.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        zipCode: formData.zipCode.trim() || undefined,
        country: formData.country.trim() || undefined,
        website: formData.website.trim() || undefined,
      });
      
      Alert.alert('Success', 'Company details updated successfully', [
        { text: 'OK', onPress: onSave },
      ]);
    } catch (error: any) {
      console.error('Error updating company details:', error);
      const errorMessage = error?.message || 'Failed to update company details. Please try again.';
      
      if (errorMessage.includes('session has expired') || errorMessage.includes('expired')) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaWrapper>
        <SharedHeader variant={variant} title="Company Details" profileDrawer={profileDrawer} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C6CA9" />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <SharedHeader variant={variant} title="Company Details" profileDrawer={profileDrawer} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Briefcase width={24} height={24} color="#1C6CA9" />
            <Text style={styles.headerText}>Company Information</Text>
          </View>
          <Text style={styles.description}>
            Update your company details and information.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Company Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.companyName}
            onChangeText={(text) => setFormData({ ...formData, companyName: text })}
            placeholder="Enter company name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Registration Number</Text>
          <TextInput
            style={styles.input}
            value={formData.companyRegistrationNumber}
            onChangeText={(text) => setFormData({ ...formData, companyRegistrationNumber: text })}
            placeholder="Enter registration number"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Tax ID</Text>
          <TextInput
            style={styles.input}
            value={formData.taxId}
            onChangeText={(text) => setFormData({ ...formData, taxId: text })}
            placeholder="Enter tax ID"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="Enter street address"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              placeholder="City"
              placeholderTextColor="#999"
            />
          </View>

          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              value={formData.state}
              onChangeText={(text) => setFormData({ ...formData, state: text })}
              placeholder="State"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.label}>Zip Code</Text>
            <TextInput
              style={styles.input}
              value={formData.zipCode}
              onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
              placeholder="Zip Code"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.label}>Country</Text>
            <TextInput
              style={styles.input}
              value={formData.country}
              onChangeText={(text) => setFormData({ ...formData, country: text })}
              placeholder="Country"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            value={formData.website}
            onChangeText={(text) => setFormData({ ...formData, website: text })}
            placeholder="https://example.com"
            placeholderTextColor="#999"
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfCard: {
    flex: 1,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#1C6CA9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CompanyDetailsScreen;

