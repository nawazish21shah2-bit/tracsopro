// Add Incident Report Screen - Updated UI
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState } from '../../store';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SectionHeader from '../../components/ui/SectionHeader';
import ReportMediaPicker from '../../components/reports/ReportMediaPicker';
import { ReportMediaItem, uploadReportMediaItems } from '../../utils/reportMediaUtils';
import { LocationIcon } from '../../components/ui/AppIcons';
import { CalendarIcon } from '../../components/ui/FeatherIcons';
import { incidentApi } from '../../services/api/incidentApi';
import FormInput from '../../components/common/FormInput';

type AddIncidentReportScreenNavigationProp = StackNavigationProp<any, 'AddIncidentReport'>;

const AddIncidentReportScreen: React.FC = () => {
  const navigation = useNavigation<AddIncidentReportScreenNavigationProp>();
  const { activeShift } = useSelector((state: RootState) => state.shifts);

  const [reportType, setReportType] = useState('End of the Day Report');
  const [description, setDescription] = useState('');
  const [mediaItems, setMediaItems] = useState<ReportMediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReportTypeModal, setShowReportTypeModal] = useState(false);

  const [currentLocation, setCurrentLocation] = useState<{
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    status: string;
  }>({
    name: activeShift?.locationName || 'Current Location',
    address: activeShift?.locationAddress || 'Getting location...',
    status: activeShift ? 'Active' : 'No Active Shift'
  });
  const [locationLoading, setLocationLoading] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });

  // Get current GPS location
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      
      // Use active shift location if available
      if (activeShift?.locationName && activeShift?.locationAddress) {
        setCurrentLocation({
          name: activeShift.locationName,
          address: activeShift.locationAddress,
          status: 'Active'
        });
        setLocationLoading(false);
        return;
      }

      // Otherwise get GPS location
      // Request location permission
      let hasPermission = false;
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to add incident reports.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS permission is handled automatically by react-native-geolocation-service
        hasPermission = true;
      }

      if (!hasPermission) {
        setCurrentLocation({
          name: 'Location Permission Required',
          address: 'Please enable location services',
          status: 'Permission Denied'
        });
        setLocationLoading(false);
        return;
      }

      // Get current position
      const location = await new Promise<any>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => reject(error),
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
      });

      // Format address from coordinates (reverse geocoding can be added later with Google Maps API)
      const address = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;

      setCurrentLocation({
        name: 'Current Location',
        address: address,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        status: 'Active'
      });
    } catch (error) {
      console.error('Error getting location:', error);
      setCurrentLocation({
        name: 'Location Error',
        address: 'Unable to get location',
        status: 'Error'
      });
    } finally {
      setLocationLoading(false);
    }
  };

  const reportTypes = [
    'End of the Day Report',
    'Incident Report',
    'Security Breach',
    'Medical Emergency',
    'Fire Alarm',
    'Equipment Failure',
    'Maintenance Issue',
    'Visitor Log',
    'Other'
  ];

  const handleReportTypeSelect = (type: string) => {
    setReportType(type);
  };

  const handleSubmitReport = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please add a description for your report');
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedMedia = mediaItems.length > 0
        ? await uploadReportMediaItems(mediaItems)
        : [];

      const reportData = {
        reportType,
        description,
        location: {
          name: currentLocation.name,
          address: currentLocation.address,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        mediaFiles: uploadedMedia,
      };

      const response = await incidentApi.createIncidentReport(reportData);

      if (response.success) {
        Alert.alert(
          'Success',
          'Your incident report has been submitted successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit report');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      const errorMessage = error.message || 'Failed to submit report. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="guard"
        title="Add Incident Report"
        showLogo={false}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Location Card */}
        <View style={styles.locationCard}>
          <View style={styles.cardAccent} />
          <View style={styles.cardBody}>
          <View style={styles.locationHeader}>
            <View style={styles.locationIconContainer}>
              <LocationIcon size={20} color={COLORS.primary} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{currentLocation.name}</Text>
              <Text style={styles.locationAddress}>{currentLocation.address}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{currentLocation.status}</Text>
            </View>
          </View>
          
          <View style={styles.dateRow}>
            <View style={styles.dateIconContainer}>
              <CalendarIcon size={16} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.dateLabel}>Date:</Text>
            <Text style={styles.dateValue}>{currentDate}</Text>
          </View>
          </View>
        </View>

        {/* Report Type Section */}
        <View style={styles.section}>
          <SectionHeader title="Report type" subtitle="Select the type of incident" />
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setShowReportTypeModal(true)}
          >
            <Text style={styles.dropdownText}>{reportType}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <SectionHeader title="Description" subtitle="What happened on site?" />
          <FormInput
            value={description}
            onChangeText={setDescription}
            placeholder="Write report description"
            multiline
            numberOfLines={6}
          />
        </View>

        {/* Photo evidence */}
        <View style={styles.sectionFlush}>
          <ReportMediaPicker
            items={mediaItems}
            onChange={setMediaItems}
            shiftId={activeShift?.id}
            maxItems={6}
            title="Photo evidence"
            hint="Take or choose photos to attach to this report"
          />
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!description.trim() || isSubmitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitReport}
            disabled={!description.trim() || isSubmitting}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting Report...' : 'Submit Report'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Report Type Modal */}
      <Modal
        visible={showReportTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReportTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Report Type</Text>
              <TouchableOpacity 
                onPress={() => setShowReportTypeModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {reportTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.modalOption,
                    reportType === type && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setReportType(type);
                    setShowReportTypeModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    reportType === type && styles.modalOptionTextSelected
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scrollContent: {
    paddingBottom: SPACING.xl * 2,
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundPrimary,
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  cardAccent: {
    width: 4,
    backgroundColor: COLORS.primary,
  },
  cardBody: {
    flex: 1,
    padding: SPACING.lg,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  locationAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.success,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  dateIconContainer: {
    marginRight: SPACING.sm,
  },
  dateLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  dateValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  section: {
    backgroundColor: COLORS.backgroundPrimary,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    ...SHADOWS.small,
  },
  sectionFlush: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  dropdownText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  descriptionInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    minHeight: 120,
    textAlignVertical: 'top',
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  submitSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
  },
  submitButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.backgroundPrimary,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '70%',
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.textSecondary,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalOption: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalOptionSelected: {
    backgroundColor: COLORS.backgroundTertiary,
  },
  modalOptionText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  modalOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default AddIncidentReportScreen;
