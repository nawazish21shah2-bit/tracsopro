// Create Incident Screen
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
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../../store';
import { createIncident } from '../../store/slices/incidentSlice';
import { fetchLocations } from '../../store/slices/locationSlice';
import { IncidentType, SeverityLevel, Location } from '../../types';

type CreateIncidentScreenNavigationProp = StackNavigationProp<any, 'CreateIncident'>;

const CreateIncidentScreen: React.FC = () => {
  const navigation = useNavigation<CreateIncidentScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { locations, isLoading: locationsLoading } = useSelector((state: RootState) => state.locations);
  const { isLoading: incidentLoading } = useSelector((state: RootState) => state.incidents);

  const [formData, setFormData] = useState({
    type: IncidentType.OTHER,
    severity: SeverityLevel.MEDIUM,
    description: '',
    location: null as Location | null,
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      await dispatch(fetchLocations());
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please provide a description of the incident');
      return;
    }

    if (!formData.location) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await dispatch(createIncident({
        type: formData.type,
        severity: formData.severity,
        description: formData.description.trim(),
        location: formData.location,
        evidence: [], // Will be implemented later
      }));

      if (createIncident.fulfilled.match(result)) {
        Alert.alert(
          'Success',
          'Incident reported successfully',
          [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
      } else {
        Alert.alert('Error', result.payload as string);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }

    setIsSubmitting(false);
  };

  const getTypeIcon = (type: IncidentType) => {
    switch (type) {
      case 'security_breach': return '🚨';
      case 'medical_emergency': return '🏥';
      case 'fire_alarm': return '🔥';
      case 'vandalism': return '💥';
      case 'theft': return '💰';
      case 'trespassing': return '🚫';
      case 'equipment_failure': return '⚙️';
      default: return '📋';
    }
  };

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical': return '#FF4444';
      case 'high': return '#FF8800';
      case 'medium': return '#FFBB33';
      case 'low': return '#00C851';
      default: return '#6C757D';
    }
  };

  const incidentTypes = [
    { value: IncidentType.SECURITY_BREACH, label: 'Security Breach' },
    { value: IncidentType.MEDICAL_EMERGENCY, label: 'Medical Emergency' },
    { value: IncidentType.FIRE_ALARM, label: 'Fire Alarm' },
    { value: IncidentType.VANDALISM, label: 'Vandalism' },
    { value: IncidentType.THEFT, label: 'Theft' },
    { value: IncidentType.TRESPASSING, label: 'Trespassing' },
    { value: IncidentType.EQUIPMENT_FAILURE, label: 'Equipment Failure' },
    { value: IncidentType.OTHER, label: 'Other' },
  ];

  const severityLevels = [
    { value: SeverityLevel.LOW, label: 'Low', color: '#00C851' },
    { value: SeverityLevel.MEDIUM, label: 'Medium', color: '#FFBB33' },
    { value: SeverityLevel.HIGH, label: 'High', color: '#FF8800' },
    { value: SeverityLevel.CRITICAL, label: 'Critical', color: '#FF4444' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Report Incident</Text>
        <Text style={styles.subtitle}>Provide details about the incident</Text>
      </View>

      {/* Incident Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Incident Type *</Text>
        <View style={styles.typeGrid}>
          {incidentTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeButton,
                formData.type === type.value && styles.typeButtonSelected
              ]}
              onPress={() => handleInputChange('type', type.value)}
            >
              <Text style={styles.typeIcon}>{getTypeIcon(type.value)}</Text>
              <Text style={[
                styles.typeLabel,
                formData.type === type.value && styles.typeLabelSelected
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Severity Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Severity Level *</Text>
        <View style={styles.severityContainer}>
          {severityLevels.map((severity) => (
            <TouchableOpacity
              key={severity.value}
              style={[
                styles.severityButton,
                { borderColor: severity.color },
                formData.severity === severity.value && { backgroundColor: severity.color }
              ]}
              onPress={() => handleInputChange('severity', severity.value)}
            >
              <Text style={[
                styles.severityLabel,
                formData.severity === severity.value && styles.severityLabelSelected
              ]}>
                {severity.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location *</Text>
        {locationsLoading ? (
          <Text style={styles.loadingText}>Loading locations...</Text>
        ) : (
          <View style={styles.locationList}>
            {locations.map((location) => (
              <TouchableOpacity
                key={location.id}
                style={[
                  styles.locationButton,
                  formData.location?.id === location.id && styles.locationButtonSelected
                ]}
                onPress={() => handleInputChange('location', location)}
              >
                <Text style={styles.locationIcon}>📍</Text>
                <View style={styles.locationInfo}>
                  <Text style={[
                    styles.locationName,
                    formData.location?.id === location.id && styles.locationNameSelected
                  ]}>
                    {location.name}
                  </Text>
                  <Text style={styles.locationAddress}>{location.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description *</Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder="Describe what happened in detail..."
          placeholderTextColor="#999"
          value={formData.description}
          onChangeText={(value) => handleInputChange('description', value)}
          multiline
          numberOfLines={4}
          maxLength={1000}
        />
        <Text style={styles.characterCount}>
          {formData.description.length}/1000 characters
        </Text>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Any additional information..."
          placeholderTextColor="#999"
          value={formData.notes}
          onChangeText={(value) => handleInputChange('notes', value)}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
        <Text style={styles.characterCount}>
          {formData.notes.length}/500 characters
        </Text>
      </View>

      {/* Evidence Upload */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Evidence</Text>
        <TouchableOpacity style={styles.evidenceButton}>
          <Text style={styles.evidenceIcon}>📷</Text>
          <Text style={styles.evidenceText}>Add Photos/Videos</Text>
        </TouchableOpacity>
        <Text style={styles.evidenceNote}>
          You can add photos, videos, or documents as evidence
        </Text>
      </View>

      {/* Submit Button */}
      <View style={styles.submitSection}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!formData.description.trim() || !formData.location || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!formData.description.trim() || !formData.location || isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Reporting Incident...' : 'Report Incident'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeButton: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: '#007AFF',
  },
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  severityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  severityLabelSelected: {
    color: '#ffffff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  locationList: {
    gap: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  locationButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationNameSelected: {
    color: '#007AFF',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    textAlignVertical: 'top',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  evidenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  evidenceIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  evidenceText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  evidenceNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  submitSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 1,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateIncidentScreen;
