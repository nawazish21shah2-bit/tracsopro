import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Save, Clock, User, MapPin } from 'react-native-feather';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import apiService from '../../services/api';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

interface ShiftFormData {
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  guardId?: string;
  notes?: string;
}

const CreateShiftScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const siteId = (route.params as { siteId?: string })?.siteId;
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [siteInfo, setSiteInfo] = useState<{ name: string; address: string; latitude?: number; longitude?: number } | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [formData, setFormData] = useState<ShiftFormData>({
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    guardId: undefined,
    notes: '',
  });
  const [availableGuards, setAvailableGuards] = useState<any[]>([]);
  const [showGuardDropdown, setShowGuardDropdown] = useState(false);

  // Fetch site info and guards on mount
  React.useEffect(() => {
    if (siteId) {
      fetchSiteInfo();
      fetchAvailableGuards();
    } else {
      // If no siteId provided, show error and go back
      Alert.alert(
        'Error',
        'Site ID is required to create a shift. Please select a site first.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }
  }, [siteId]);

  const fetchSiteInfo = async () => {
    try {
      const result = await apiService.getClientSites(1, 100);
      if (result.success && result.data?.sites) {
        const site = result.data.sites.find((s: any) => s.id === siteId);
        if (site) {
          setSiteInfo({
            name: site.name || 'Site Location',
            address: site.address || 'Site Address',
            latitude: site.latitude,
            longitude: site.longitude,
          });
          
          // Update map region if coordinates available
          if (site.latitude && site.longitude) {
            setMapRegion({
              latitude: site.latitude,
              longitude: site.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching site info:', error);
      }
    }
  };

  const handleInputChange = (field: keyof ShiftFormData, value: string | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value as any
    }));
  };

  const fetchAvailableGuards = async () => {
    try {
      const result = await apiService.getClientGuards(1, 100);
      if (result.success && result.data) {
        const guards = result.data.guards || result.data.items || [];
        setAvailableGuards(guards);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching guards:', error);
      }
    }
  };

  const getGuardName = (guardId?: string) => {
    if (!guardId) return 'Select Guard (Optional)';
    const guard = availableGuards.find(g => g.id === guardId);
    if (!guard) return 'Select Guard (Optional)';
    const firstName = guard.user?.firstName || guard.firstName || '';
    const lastName = guard.user?.lastName || guard.lastName || '';
    return `${firstName} ${lastName}`.trim() || guard.email || 'Unknown Guard';
  };

  const validateForm = (): boolean => {
    if (!formData.startDate || !formData.startTime) {
      Alert.alert('Error', 'Start date and time are required');
      return false;
    }
    if (!formData.endDate || !formData.endTime) {
      Alert.alert('Error', 'End date and time are required');
      return false;
    }
    return true;
  };

  const formatDateTime = (date: string, time: string): string => {
    // Parse date (MM/DD/YYYY) and time (HH:MM AM/PM)
    const [month, day, year] = date.split('/');
    const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    
    if (!timeMatch) {
      throw new Error('Invalid time format. Please use HH:MM AM/PM');
    }
    
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const ampm = timeMatch[3].toUpperCase();
    
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    // Create ISO string: YYYY-MM-DDTHH:MM:SS
    const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    return isoString;
  };

  const handleCreateShift = async () => {
    if (!validateForm()) return;

    if (!siteId) {
      Alert.alert('Error', 'Site ID is required');
      return;
    }

    setLoading(true);
    try {
      // Format dates and times to ISO strings
      const startTime = formatDateTime(formData.startDate, formData.startTime);
      const endTime = formatDateTime(formData.endDate, formData.endTime);
      
      // Validate that start is before end
      if (new Date(startTime) >= new Date(endTime)) {
        Alert.alert('Error', 'Start time must be before end time');
        setLoading(false);
        return;
      }

      // Validate that start is in the future
      if (new Date(startTime) <= new Date()) {
        Alert.alert('Error', 'Start time must be in the future');
        setLoading(false);
        return;
      }

      // Prepare shift data for client shift creation
      const shiftData = {
        siteId,
        guardId: formData.guardId || undefined, // Optional - admin can assign later
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        description: formData.description?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      };

      // Call API - Client creates shift directly (Option B)
      const result = await apiService.createClientShift(shiftData);
      
      if (result.success) {
        Alert.alert(
          'Success',
          'Shift created successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to create shift. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create shift. Please check your input and try again.');
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
        <Text style={styles.headerTitle}>Create Shift</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleCreateShift}
          disabled={loading}
        >
          <Save width={20} height={20} color="#1C6CA9" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Site Location Map */}
        {siteInfo && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin width={20} height={20} color="#1C6CA9" />
              <Text style={styles.sectionTitle}>Site Location</Text>
            </View>
            
            <View style={styles.siteInfoContainer}>
              <Text style={styles.siteName}>{siteInfo.name}</Text>
              <Text style={styles.siteAddress}>{siteInfo.address}</Text>
            </View>

            {(siteInfo.latitude && siteInfo.longitude) ? (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                  region={mapRegion}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  showsUserLocation={false}
                  showsMyLocationButton={false}
                >
                  <Marker
                    coordinate={{
                      latitude: siteInfo.latitude,
                      longitude: siteInfo.longitude,
                    }}
                    title={siteInfo.name}
                    description={siteInfo.address}
                    pinColor={COLORS.primary}
                  />
                </MapView>
              </View>
            ) : (
              <View style={styles.mapPlaceholder}>
                <MapPin size={32} color={COLORS.textSecondary} />
                <Text style={styles.mapPlaceholderText}>
                  Map will be available once site coordinates are set
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Shift Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shift Information</Text>
          
          {/* Guard Selection (Optional) */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <User width={16} height={16} color="#666" />
              <Text style={styles.label}>Assign Guard (Optional)</Text>
            </View>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowGuardDropdown(!showGuardDropdown)}
            >
              <Text style={[
                styles.dropdownText,
                !formData.guardId && styles.placeholderText
              ]}>
                {getGuardName(formData.guardId)}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
            
            {showGuardDropdown && (
              <View style={styles.dropdownList}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    handleInputChange('guardId', undefined);
                    setShowGuardDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>No Guard (Admin will assign later)</Text>
                </TouchableOpacity>
                {availableGuards.map((guard) => {
                  const firstName = guard.user?.firstName || guard.firstName || '';
                  const lastName = guard.user?.lastName || guard.lastName || '';
                  const name = `${firstName} ${lastName}`.trim() || guard.email || 'Unknown';
                  return (
                    <TouchableOpacity
                      key={guard.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        handleInputChange('guardId', guard.id);
                        setShowGuardDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Brief description of the shift duties"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(value) => handleInputChange('notes', value)}
              placeholder="Additional notes or instructions"
              placeholderTextColor="#999"
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock width={20} height={20} color="#1C6CA9" />
            <Text style={styles.sectionTitle}>Schedule</Text>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Start Date *</Text>
              <TextInput
                style={styles.input}
                value={formData.startDate}
                onChangeText={(value) => handleInputChange('startDate', value)}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
              <Text style={styles.label}>Start Time *</Text>
              <TextInput
                style={styles.input}
                value={formData.startTime}
                onChangeText={(value) => handleInputChange('startTime', value)}
                placeholder="HH:MM AM/PM"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>End Date *</Text>
              <TextInput
                style={styles.input}
                value={formData.endDate}
                onChangeText={(value) => handleInputChange('endDate', value)}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
              <Text style={styles.label}>End Time *</Text>
              <TextInput
                style={styles.input}
                value={formData.endTime}
                onChangeText={(value) => handleInputChange('endTime', value)}
                placeholder="HH:MM AM/PM"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>


        {/* Create Button */}
        <TouchableOpacity 
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateShift}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating Shift...' : 'Create Shift'}
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  saveButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  section: {
    backgroundColor: COLORS.backgroundPrimary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
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
    marginLeft: SPACING.sm,
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.backgroundPrimary,
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
    marginLeft: SPACING.md,
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
    backgroundColor: COLORS.textTertiary,
  },
  createButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
  },
  dropdownText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownIcon: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dropdownList: {
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.backgroundPrimary,
    maxHeight: 200,
    ...SHADOWS.small,
  },
  dropdownItem: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dropdownItemText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  siteInfoContainer: {
    marginBottom: SPACING.md,
  },
  siteName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  siteAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  mapContainer: {
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  mapPlaceholderText: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default CreateShiftScreen;
