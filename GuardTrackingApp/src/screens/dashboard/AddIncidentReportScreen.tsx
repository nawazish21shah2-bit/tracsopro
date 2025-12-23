// Add Incident Report Screen - Updated UI
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Platform,
  Modal,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { RootState } from '../../store';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { LocationIcon, CameraIcon } from '../../components/ui/AppIcons';
import { CalendarIcon, FileTextIcon } from '../../components/ui/FeatherIcons';
import apiService from '../../services/api';

type AddIncidentReportScreenNavigationProp = StackNavigationProp<any, 'AddIncidentReport'>;

interface MediaItem {
  id: string;
  uri: string;
  type: 'image' | 'video';
  name?: string;
}

const AddIncidentReportScreen: React.FC = () => {
  const navigation = useNavigation<AddIncidentReportScreenNavigationProp>();
  const { user, token } = useSelector((state: RootState) => state.auth);

  // Form state
  const [reportType, setReportType] = useState('End of the Day Report');
  const [description, setDescription] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReportTypeModal, setShowReportTypeModal] = useState(false);

  // Get active shift location
  const { activeShift } = useSelector((state: RootState) => state.shifts);
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

  const handleTakePicture = () => {
    const options = {
      mediaType: 'mixed' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        const newMedia: MediaItem = {
          id: Date.now().toString(),
          uri: asset.uri || '',
          type: asset.type?.startsWith('video') ? 'video' : 'image',
          name: asset.fileName,
        };
        setMediaItems(prev => [...prev, newMedia]);
      }
    });
  };

  const handleUploadMedia = () => {
    const options = {
      mediaType: 'mixed' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        const newMedia: MediaItem = {
          id: Date.now().toString(),
          uri: asset.uri || '',
          type: asset.type?.startsWith('video') ? 'video' : 'image',
          name: asset.fileName,
        };
        setMediaItems(prev => [...prev, newMedia]);
      }
    });
  };

  const handleSubmitReport = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please add a description for your report');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare report data with location
      const reportData = {
        reportType,
        description,
        location: {
          name: currentLocation.name,
          address: currentLocation.address,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        mediaFiles: mediaItems.map(item => ({
          url: item.uri,
          type: item.type,
          name: item.name,
        }))
      };

      // Submit to backend using API service
      const response = await apiService.post('/incident-reports', reportData);

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Your incident report has been submitted successfully',
          [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to submit report');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      const errorMessage = error.message || 'Failed to submit report. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeMedia = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
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

        {/* Report Type Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report type</Text>
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
          <Text style={styles.sectionTitle}>Add Description</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Write report description"
            placeholderTextColor="#A0A0A0"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Add Media Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Media</Text>
          
          {/* Take Picture Button */}
          <TouchableOpacity 
            style={styles.mediaButton}
            onPress={handleTakePicture}
            activeOpacity={0.7}
          >
            <View style={styles.mediaButtonContent}>
              <CameraIcon size={24} color={COLORS.textSecondary} />
              <Text style={styles.mediaButtonText}>Take a Picture/video</Text>
            </View>
          </TouchableOpacity>

          {/* Upload Button */}
          <TouchableOpacity 
            style={styles.mediaButton}
            onPress={handleUploadMedia}
            activeOpacity={0.7}
          >
            <View style={styles.mediaButtonContent}>
              <FileTextIcon size={24} color={COLORS.textSecondary} />
              <Text style={styles.mediaButtonText}>Upload a picture/video</Text>
            </View>
          </TouchableOpacity>

          {/* Media Preview */}
          {mediaItems.length > 0 && (
            <View style={styles.mediaPreview}>
              <Text style={styles.mediaPreviewTitle}>Attached Media ({mediaItems.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {mediaItems.map((item) => (
                  <View key={item.id} style={styles.mediaItem}>
                    <Image source={{ uri: item.uri }} style={styles.mediaImage} />
                    <TouchableOpacity 
                      style={styles.removeMediaButton}
                      onPress={() => removeMedia(item.id)}
                    >
                      <Text style={styles.removeMediaText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
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
    backgroundColor: COLORS.backgroundPrimary,
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
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
    ...SHADOWS.small,
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
    borderColor: COLORS.borderLight,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  mediaButton: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.xl,
  },
  mediaButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: SPACING.sm,
  },
  mediaPreview: {
    marginTop: SPACING.lg,
  },
  mediaPreviewTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  mediaItem: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  mediaImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -SPACING.sm,
    right: -SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  removeMediaText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
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
