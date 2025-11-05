// Add Incident Report Screen - Pixel Perfect UI
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
  StatusBar,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { RootState, AppDispatch } from '../../store';
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
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.auth);

  // Form state
  const [reportType, setReportType] = useState('End of the Day Report');
  const [description, setDescription] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Current location and date
  const currentLocation = {
    name: 'Ocean View Vila',
    address: '1321 Baker Street, NY',
    status: 'Active'
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });

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
      // Prepare report data
      const reportData = {
        reportType,
        description,
        location: {
          name: currentLocation.name,
          address: currentLocation.address,
        },
        mediaFiles: mediaItems.map(item => ({
          url: item.uri,
          type: item.type,
          name: item.name,
        }))
      };

      // Submit to backend
      const response = await fetch('http://localhost:3000/api/incident-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify(reportData),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Success',
          'Your incident report has been submitted successfully',
          [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }

    setIsSubmitting(false);
  };

  const removeMedia = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Incident Report</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Location Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <View style={styles.locationIcon}>
              <Text style={styles.locationIconText}>📍</Text>
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
            <Text style={styles.dateLabel}>Date:</Text>
            <Text style={styles.dateValue}>{currentDate}</Text>
          </View>
        </View>

        {/* Report Type Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report type</Text>
          <TouchableOpacity style={styles.dropdown}>
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
          >
            <View style={styles.mediaButtonContent}>
              <Text style={styles.cameraIcon}>📷</Text>
              <Text style={styles.mediaButtonText}>Take a Picture/video</Text>
            </View>
          </TouchableOpacity>

          {/* Upload Button */}
          <TouchableOpacity 
            style={styles.mediaButton}
            onPress={handleUploadMedia}
          >
            <View style={styles.mediaButtonContent}>
              <Text style={styles.uploadIcon}>🖼️</Text>
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
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting Report...' : 'Submit Report'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>📅</Text>
          <Text style={styles.navLabel}>My Shifts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Text style={[styles.navIcon, styles.navIconActive]}>📋</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>💼</Text>
          <Text style={styles.navLabel}>Jobs</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#000000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationIconText: {
    fontSize: 18,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 13,
    color: '#666666',
  },
  statusBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2E7D32',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  dateLabel: {
    fontSize: 14,
    color: '#666666',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  dropdownText: {
    fontSize: 15,
    color: '#000000',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666666',
  },
  descriptionInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    fontSize: 15,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    minHeight: 120,
  },
  mediaButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    marginBottom: 12,
    paddingVertical: 20,
  },
  mediaButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  uploadIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  mediaButtonText: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
  },
  mediaPreview: {
    marginTop: 16,
  },
  mediaPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  mediaItem: {
    position: 'relative',
    marginRight: 12,
  },
  mediaImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMediaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitSection: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  submitButton: {
    backgroundColor: '#1C6CA9',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    // Active state styling
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navIconActive: {
    // Active icon styling
  },
  navLabel: {
    fontSize: 12,
    color: '#666666',
  },
  navLabelActive: {
    color: '#1C6CA9',
    fontWeight: '600',
  },
});

export default AddIncidentReportScreen;
