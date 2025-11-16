/**
 * Enhanced Incident Report Screen - Phase 4
 * Advanced incident reporting with media, voice-to-text, and offline sync
 */

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
import { RootState } from '../../store';
import enhancedIncidentService, { EnhancedIncident, VoiceRecording } from '../../services/enhancedIncidentService';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { ErrorHandler } from '../../utils/errorHandler';

interface EnhancedIncidentReportScreenProps {
  navigation: any;
  route: any;
}

const EnhancedIncidentReportScreen: React.FC<EnhancedIncidentReportScreenProps> = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { shiftId } = route.params || {};

  const [incident, setIncident] = useState<EnhancedIncident | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceRecordings, setVoiceRecordings] = useState<VoiceRecording[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: 'other' as EnhancedIncident['type'],
    severity: 'medium' as EnhancedIncident['severity'],
    title: '',
    description: '',
  });

  useEffect(() => {
    initializeService();
    loadVoiceRecordings();
  }, []);

  const initializeService = async () => {
    try {
      await enhancedIncidentService.initialize();
    } catch (error) {
      ErrorHandler.handleError(error, 'initialize_incident_service');
    }
  };

  const loadVoiceRecordings = () => {
    const recordings = enhancedIncidentService.getVoiceRecordings();
    setVoiceRecordings(recordings);
  };

  const handleCreateIncident = async () => {
    try {
      if (!formData.title.trim() || !formData.description.trim()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const newIncident = await enhancedIncidentService.createIncident({
        ...formData,
        shiftId,
      });

      setIncident(newIncident);
      Alert.alert('Success', 'Incident created successfully');
    } catch (error) {
      ErrorHandler.handleError(error, 'create_incident');
      Alert.alert('Error', 'Failed to create incident');
    }
  };

  const handleAddMedia = async () => {
    try {
      if (!incident) return;

      const mediaFile = await enhancedIncidentService.addMediaToIncident(incident.id, 'image');
      if (mediaFile) {
        // Refresh incident data
        const updatedIncident = enhancedIncidentService.getIncidentById(incident.id);
        if (updatedIncident) {
          setIncident(updatedIncident);
        }
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'add_media');
      Alert.alert('Error', 'Failed to add media');
    }
  };

  const handleStartVoiceRecording = async () => {
    try {
      const recording = await enhancedIncidentService.startVoiceRecording();
      if (recording) {
        setIsRecording(true);
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'start_voice_recording');
      Alert.alert('Error', 'Failed to start voice recording');
    }
  };

  const handleStopVoiceRecording = async () => {
    try {
      const recording = await enhancedIncidentService.stopVoiceRecording();
      if (recording) {
        setIsRecording(false);
        loadVoiceRecordings();
        Alert.alert('Success', 'Voice recording saved. Transcription in progress...');
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'stop_voice_recording');
      Alert.alert('Error', 'Failed to stop voice recording');
      setIsRecording(false);
    }
  };

  const handleAddVoiceToIncident = async (recordingId: string) => {
    try {
      if (!incident) return;

      const success = await enhancedIncidentService.addVoiceToIncident(incident.id, recordingId);
      if (success) {
        const updatedIncident = enhancedIncidentService.getIncidentById(incident.id);
        if (updatedIncident) {
          setIncident(updatedIncident);
          setFormData(prev => ({ ...prev, description: updatedIncident.description }));
        }
        Alert.alert('Success', 'Voice transcription added to incident');
      } else {
        Alert.alert('Error', 'Failed to add voice transcription');
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'add_voice_to_incident');
      Alert.alert('Error', 'Failed to add voice transcription');
    }
  };

  const handleSubmitIncident = async () => {
    try {
      if (!incident) return;

      setIsSubmitting(true);
      const success = await enhancedIncidentService.submitIncident(incident.id);
      
      if (success) {
        Alert.alert(
          'Incident Submitted',
          'Your incident has been submitted successfully.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', 'Failed to submit incident');
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'submit_incident');
      Alert.alert('Error', 'Failed to submit incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderIncidentForm = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Incident Details</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Incident Title"
        value={formData.title}
        onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
      />
      
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Incident Description"
        value={formData.description}
        onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
        multiline
        numberOfLines={4}
      />
      
      <TouchableOpacity style={styles.createButton} onPress={handleCreateIncident}>
        <Text style={styles.createButtonText}>Create Incident</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMediaSection = () => {
    if (!incident) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Media Attachments</Text>
        
        <TouchableOpacity style={styles.mediaButton} onPress={handleAddMedia}>
          <Text style={styles.mediaButtonText}>📷 Add Photo/Video</Text>
        </TouchableOpacity>
        
        {incident.mediaFiles.length > 0 && (
          <View style={styles.mediaGrid}>
            {incident.mediaFiles.map((media) => (
              <View key={media.id} style={styles.mediaItem}>
                <Image source={{ uri: media.uri }} style={styles.mediaImage} />
                <Text style={styles.mediaStatus}>{media.uploadStatus}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderVoiceSection = () => {
    if (!incident) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voice Recording</Text>
        
        <TouchableOpacity 
          style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]}
          onPress={isRecording ? handleStopVoiceRecording : handleStartVoiceRecording}
        >
          <Text style={styles.voiceButtonText}>
            {isRecording ? '🔴 Stop Recording' : '🎤 Start Voice Recording'}
          </Text>
        </TouchableOpacity>
        
        {voiceRecordings.length > 0 && (
          <View style={styles.recordingsList}>
            <Text style={styles.recordingsTitle}>Available Recordings:</Text>
            {voiceRecordings.slice(0, 3).map((recording) => (
              <TouchableOpacity 
                key={recording.id} 
                style={styles.recordingItem}
                onPress={() => handleAddVoiceToIncident(recording.id)}
              >
                <Text style={styles.recordingText}>
                  🎵 {recording.duration}s {recording.isTranscribing ? '(Transcribing...)' : ''}
                </Text>
                {recording.transcription && (
                  <Text style={styles.transcriptionPreview}>
                    "{recording.transcription.substring(0, 50)}..."
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderSubmitSection = () => {
    if (!incident) return null;

    return (
      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmitIncident}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Incident Report'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.offlineNote}>
          📱 Reports are saved locally and will sync when online
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enhanced Incident Report</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {!incident ? renderIncidentForm() : (
          <>
            {renderMediaSection()}
            {renderVoiceSection()}
            {renderSubmitSection()}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  headerTitle: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.md,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  section: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
  },
  createButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  mediaButton: {
    backgroundColor: COLORS.info,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  mediaButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  mediaItem: {
    width: 80,
    height: 80,
  },
  mediaImage: {
    width: '100%',
    height: 60,
    borderRadius: 4,
  },
  mediaStatus: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  voiceButton: {
    backgroundColor: COLORS.success,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  voiceButtonRecording: {
    backgroundColor: COLORS.error,
  },
  voiceButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  recordingsList: {
    marginTop: SPACING.sm,
  },
  recordingsTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  recordingItem: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  recordingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
  },
  transcriptionPreview: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  submitButton: {
    backgroundColor: COLORS.success,
    borderRadius: 8,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  submitButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  offlineNote: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default EnhancedIncidentReportScreen;
