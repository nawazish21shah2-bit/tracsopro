import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Save } from 'react-native-feather';
import { ChevronLeftIcon } from '../../components/ui/FeatherIcons';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import AddressPicker from '../../components/common/AddressPicker';
import FormInput from '../../components/common/FormInput';
import { siteService, CreateSiteData } from '../../services/siteService';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { useSubscriptionLimits } from '../../hooks/useSubscriptionLimits';
import { showActionErrorAlert } from '../../utils/subscriptionLimitAlert';
import { validateSiteForm } from '../../utils/siteFormValidation';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

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
  radiusMeters: string;
}

const DEFAULT_SITE_RADIUS_METERS = 100;
const MIN_SITE_RADIUS_METERS = 20;
const MAX_SITE_RADIUS_METERS = 2000;

const AddSiteScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { ensureCanAdd, refresh: refreshLimits, canAdd, getBlockReason } = useSubscriptionLimits();
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
    radiusMeters: String(DEFAULT_SITE_RADIUS_METERS),
  });
  const handleInputChange = (field: keyof SiteFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useFocusEffect(
    useCallback(() => {
      refreshLimits();
    }, [refreshLimits])
  );

  const siteLimitReached = !canAdd('sites');
  const siteLimitReason = getBlockReason('sites');

  const validateForm = (): boolean => {
    const validation = validateSiteForm(formData);
    if (!validation.valid) {
      Alert.alert('Missing Information', validation.message || 'Please complete all required fields.');
      return false;
    }
    const radius = Number.parseInt(formData.radiusMeters, 10);
    if (!Number.isFinite(radius) || radius < MIN_SITE_RADIUS_METERS || radius > MAX_SITE_RADIUS_METERS) {
      Alert.alert(
        'Invalid Radius',
        `Radius must be a number between ${MIN_SITE_RADIUS_METERS}m and ${MAX_SITE_RADIUS_METERS}m.`
      );
      return false;
    }
    return true;
  };

  const handleSaveSite = async () => {
    if (!validateForm()) return;

    const allowed = await ensureCanAdd('sites');
    if (!allowed) return;

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
        radiusMeters: Number.parseInt(formData.radiusMeters, 10),
      };

      await siteService.createSite(siteData);
      await refreshLimits();
      
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
      if (__DEV__) {
        console.error('Error creating site:', error);
      }
      showActionErrorAlert('Create Site', error, { role: user?.role, resource: 'sites' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper includeTop>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeftIcon size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Site</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveSite}
          disabled={loading || siteLimitReached}
        >
          <Save width={20} height={20} color="#1C6CA9" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {siteLimitReached && (
          <View style={styles.limitBanner}>
            <Text style={styles.limitBannerText}>
              {siteLimitReason || 'Your plan site limit has been reached. You cannot add another site until the plan is upgraded.'}
            </Text>
          </View>
        )}

        {/* Site Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Site Information</Text>
          
          <FormInput
            label="Site Name"
            required
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            placeholder="Enter site name"
            containerStyle={styles.inputGroup}
          />

          <FormInput
            label="Description"
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="Brief description of the site"
            multiline
            numberOfLines={3}
            containerStyle={styles.inputGroup}
          />

          <FormInput
            label="Security Requirements"
            value={formData.requirements}
            onChangeText={(value) => handleInputChange('requirements', value)}
            placeholder="Specific security requirements (e.g., licensed guard, 2+ years experience)"
            multiline
            numberOfLines={3}
            containerStyle={styles.inputGroup}
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            {/* <MapPin width={20} height={20} color="#1C6CA9" /> */}
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          
          <AddressPicker
            value={formData.address}
            onChange={(address) => handleInputChange('address', address)}
            onCityChange={(city) => handleInputChange('city', city)}
            onStateChange={(state) => handleInputChange('state', state)}
            onZipChange={(zip) => handleInputChange('zipCode', zip)}
            label="Street Address"
            placeholder="Enter or select address on map"
            required
          />

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <FormInput
                label="City"
                required
                value={formData.city}
                onChangeText={(value) => handleInputChange('city', value)}
                placeholder="City"
              />
            </View>
            
            <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
              <FormInput
                label="State"
                value={formData.state}
                onChangeText={(value) => handleInputChange('state', value)}
                placeholder="State"
              />
            </View>
          </View>

          <FormInput
            label="ZIP Code"
            value={formData.zipCode}
            onChangeText={(value) => handleInputChange('zipCode', value)}
            placeholder="ZIP Code"
            keyboardType="numeric"
            containerStyle={styles.inputGroup}
          />

          <FormInput
            label="Site Radius (meters)"
            required
            value={formData.radiusMeters}
            onChangeText={(value) => handleInputChange('radiusMeters', value.replace(/[^0-9]/g, ''))}
            placeholder="100"
            keyboardType="numeric"
            helperText={`Guards can only check in within this radius (${MIN_SITE_RADIUS_METERS}m - ${MAX_SITE_RADIUS_METERS}m).`}
            containerStyle={styles.inputGroup}
          />
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <FormInput
            label="Contact Person"
            required
            value={formData.contactPerson}
            onChangeText={(value) => handleInputChange('contactPerson', value)}
            placeholder="Site manager or contact person"
            containerStyle={styles.inputGroup}
          />

          <FormInput
            label="Contact Phone"
            value={formData.contactPhone}
            onChangeText={(value) => handleInputChange('contactPhone', value)}
            placeholder="Phone number"
            keyboardType="phone-pad"
            containerStyle={styles.inputGroup}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.createButton, (loading || siteLimitReached) && styles.createButtonDisabled]}
          onPress={handleSaveSite}
          disabled={loading || siteLimitReached}
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
    backgroundColor: COLORS.backgroundPrimary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.formPadding || SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    // Border only, no shadow for minimal style
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.fieldGap || SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  inputGroup: {
    marginBottom: SPACING.fieldGap || SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
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
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sectionGap || SPACING.xxl,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  createButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    marginTop: SPACING.xs,
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  limitBanner: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  limitBannerText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
  },
});

export default AddSiteScreen;
