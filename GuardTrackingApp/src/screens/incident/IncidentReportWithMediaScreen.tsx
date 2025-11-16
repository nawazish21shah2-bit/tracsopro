import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { useNavigation, useRoute } from '@react-navigation/native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import MediaUploadComponent from '../../components/incident/MediaUploadComponent';
import { AlertTriangle, MapPin, Clock, User } from 'react-native-feather';

interface MediaFile {
  id: string;
  type: 'image' | 'video' | 'audio';
  uri: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'failed';
  thumbnailUri?: string;
  duration?: number;
}

interface IncidentFormData {
  type: string;
  severity: string;
  title: string;
  description: string;
  location: string;
  mediaFiles: MediaFile[];
}

const IncidentReportWithMediaScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const { shiftId } = (route.params as any) || {};

  const [formData, setFormData] = useState<IncidentFormData>({
    type: 'other',
    severity: 'medium',
    title: '',
    description: '',
    location: '',
    mediaFiles: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const incidentTypes = [
    { value: 'security_breach', label: 'Security Breach' },
    { value: 'medical_emergency', label: 'Medical Emergency' },
    { value: 'fire_alarm', label: 'Fire Alarm' },
    { value: 'vandalism', label: 'Vandalism' },
    { value: 'theft', label: 'Theft' },
    { value: 'trespassing', label: 'Trespassing' },
    { value: 'equipment_failure', label: 'Equipment Failure' },
    { value: 'other', label: 'Other' },
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', color: '#10B981' },
    { value: 'medium', label: 'Medium', color: '#F59E0B' },
    { value: 'high', label: 'High', color: '#EF4444' },
    { value: 'critical', label: 'Critical', color: '#DC2626' },
  ];

  useEffect(() => {
    // Get current location for the incident
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      // This would use the location service to get current address
      setFormData(prev => ({
        ...prev,
        location: 'Current Location (GPS coordinates will be attached)',
      }));
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleInputChange = (field: keyof IncidentFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMediaAdded = (media: MediaFile) => {
    setFormData(prev => ({
      ...prev,
      mediaFiles: [...prev.mediaFiles, media],
    }));
  };

  const handleMediaRemoved = (mediaId: string) => {
    setFormData(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter(file => file.id !== mediaId),
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the incident.');
      return false;
    }

    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Please provide a description of the incident.');
      return false;
    }

    if (formData.description.trim().length < 10) {
      Alert.alert('Validation Error', 'Please provide a more detailed description (at least 10 characters).');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Create incident report object
      const incidentReport = {
        id: `incident_${Date.now()}`,
        ...formData,
        reportedBy: user?.id,
        reportedAt: new Date().toISOString(),
        shiftId,
        status: 'submitted',
      };

      // TODO: Submit to backend API
      console.log('Submitting incident report:', incidentReport);

      // Simulate API call
`        await new Promise<void>(resolve => setTimeout(resolve, 2000));`

      Alert.alert(
        'Report Submitted',
        'Your incident report has been submitted successfully. You will be notified when it is reviewed.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting incident report:', error);
      Alert.alert(
        'Submission Failed',
        'Failed to submit incident report. Please try again or save as draft.',
        [
          { text: 'Try Again', onPress: handleSubmit },
          { text: 'Save Draft', onPress: handleSaveDraft },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      // TODO: Save as draft to local storage
      Alert.alert('Draft Saved', 'Your incident report has been saved as a draft.');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert('Error', 'Failed to save draft.');
    }
  };

  const renderTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Incident Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
        {incidentTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeOption,
              formData.type === type.value && styles.typeOptionSelected,
            ]}
            onPress={() => handleInputChange('type', type.value)}
          >
            <Text
              style={[
                styles.typeOptionText,
                formData.type === type.value && styles.typeOptionTextSelected,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSeveritySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Severity Level</Text>
      <View style={styles.severityGrid}>
        {severityLevels.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.severityOption,
              { borderColor: level.color },
              formData.severity === level.value && { backgroundColor: level.color + '20' },
            ]}
            onPress={() => handleInputChange('severity', level.value)}
          >
            <View style={[styles.severityDot, { backgroundColor: level.color }]} />
            <Text
              style={[
                styles.severityText,
                { color: formData.severity === level.value ? level.color : '#374151' },
              ]}
            >
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaWrapper>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <AlertTriangle width={24} height={24} color="#EF4444" />
            <Text style={styles.headerTitle}>Incident Report</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Incident Type */}
          {renderTypeSelector()}

          {/* Severity Level */}
          {renderSeveritySelector()}

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Brief summary of the incident"
              value={formData.title}
              onChangeText={(text) => handleInputChange('title', text)}
              maxLength={100}
            />
            <Text style={styles.charCount}>{formData.title.length}/100</Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Provide detailed information about what happened, when it occurred, and any relevant circumstances..."
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              multiline
              numberOfLines={6}
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{formData.description.length}/1000</Text>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationContainer}>
              <MapPin width={20} height={20} color="#6B7280" />
              <Text style={styles.locationText}>{formData.location}</Text>
            </View>
          </View>

          {/* Media Upload */}
          <MediaUploadComponent
            mediaFiles={formData.mediaFiles}
            onMediaAdded={handleMediaAdded}
            onMediaRemoved={handleMediaRemoved}
            maxFiles={5}
            allowedTypes={['image', 'video']}
            shiftId={shiftId}
          />

          {/* Metadata */}
          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <User width={16} height={16} color="#6B7280" />
              <Text style={styles.metadataText}>
                Reported by: {user?.firstName} {user?.lastName}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Clock width={16} height={16} color="#6B7280" />
              <Text style={styles.metadataText}>
                {new Date().toLocaleString()}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.draftButton}
            onPress={handleSaveDraft}
            disabled={isSubmitting}
          >
            <Text style={styles.draftButtonText}>Save Draft</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  cancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
  },
  typeOption: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeOptionSelected: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3B82F6',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  typeOptionTextSelected: {
    color: '#3B82F6',
  },
  severityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  severityOption: {
    flex: 1,
    minWidth: '22%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  severityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  metadata: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  draftButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  draftButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default IncidentReportWithMediaScreen;
