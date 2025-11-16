/**
 * Enhanced Incident Service - Phase 4
 * Advanced incident reporting with media, voice-to-text, and offline capabilities
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorHandler } from '../utils/errorHandler';
import { cacheService } from './cacheService';
import cameraService, { PhotoMetadata } from './cameraService';
import locationTrackingService from './locationTrackingService';
import WebSocketService from './WebSocketService';
import notificationService from './notificationService';

interface EnhancedIncident {
  id: string;
  type: 'security_breach' | 'medical_emergency' | 'fire_alarm' | 'vandalism' | 'theft' | 'trespassing' | 'equipment_failure' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  voiceTranscription?: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
  };
  mediaFiles: MediaFile[];
  reportedBy: string;
  reportedAt: number;
  shiftId?: string;
  status: 'draft' | 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: number;
  syncStatus: 'offline' | 'syncing' | 'synced' | 'failed';
  lastSyncAttempt?: number;
  retryCount: number;
}

interface MediaFile {
  id: string;
  type: 'image' | 'video' | 'audio';
  uri: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'failed';
  uploadUrl?: string;
  thumbnailUri?: string;
  duration?: number; // for video/audio
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
}

interface VoiceRecording {
  id: string;
  uri: string;
  duration: number;
  transcription?: string;
  isTranscribing: boolean;
  timestamp: number;
}

class EnhancedIncidentService {
  private incidents: EnhancedIncident[] = [];
  private voiceRecordings: VoiceRecording[] = [];
  private isRecording: boolean = false;
  private currentRecording: VoiceRecording | null = null;

  /**
   * Initialize service
   */
  async initialize(): Promise<void> {
    try {
      await this.loadOfflineIncidents();
      await this.loadVoiceRecordings();
      console.log('📋 Enhanced Incident Service initialized');
    } catch (error) {
      ErrorHandler.handleError(error, 'incident_service_init');
    }
  }

  /**
   * Create new incident with enhanced features
   */
  async createIncident(incidentData: {
    type: EnhancedIncident['type'];
    severity: EnhancedIncident['severity'];
    title: string;
    description: string;
    shiftId?: string;
  }): Promise<EnhancedIncident> {
    try {
      const location = locationTrackingService.getLastKnownLocation();
      if (!location) {
        throw new Error('Unable to get current location for incident');
      }

      const incident: EnhancedIncident = {
        id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...incidentData,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        },
        mediaFiles: [],
        reportedBy: 'current_user', // This would come from auth
        reportedAt: Date.now(),
        status: 'draft',
        syncStatus: 'offline',
        retryCount: 0,
      };

      this.incidents.push(incident);
      await this.saveOfflineIncidents();

      console.log(`📋 Incident created: ${incident.id}`);
      return incident;
    } catch (error) {
      ErrorHandler.handleError(error, 'create_incident');
      throw error;
    }
  }

  /**
   * Add media to incident
   */
  async addMediaToIncident(incidentId: string, mediaType: 'image' | 'video'): Promise<MediaFile | null> {
    try {
      const incident = this.incidents.find(i => i.id === incidentId);
      if (!incident) {
        throw new Error('Incident not found');
      }

      // Use existing camera service
      const photo = await cameraService.showPhotoOptions('incident', undefined, incidentId);
      if (!photo) return null;

      const mediaFile: MediaFile = {
        id: photo.id,
        type: mediaType,
        uri: photo.uri,
        fileName: photo.fileName,
        fileSize: photo.fileSize,
        mimeType: photo.type,
        uploadStatus: 'pending',
        location: photo.location,
        timestamp: photo.timestamp,
      };

      incident.mediaFiles.push(mediaFile);
      await this.saveOfflineIncidents();

      // Add to upload queue
      await this.queueMediaUpload(mediaFile, incidentId);

      console.log(`📋 Media added to incident ${incidentId}: ${mediaFile.fileName}`);
      return mediaFile;
    } catch (error) {
      ErrorHandler.handleError(error, 'add_media_to_incident');
      return null;
    }
  }

  /**
   * Start voice recording for incident
   */
  async startVoiceRecording(): Promise<VoiceRecording | null> {
    try {
      if (this.isRecording) {
        console.log('📋 Already recording voice');
        return null;
      }

      // In a real implementation, you would use react-native-audio-recorder-player
      // For now, we'll simulate the recording
      const recording: VoiceRecording = {
        id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uri: `file://voice_recordings/recording_${Date.now()}.m4a`,
        duration: 0,
        isTranscribing: false,
        timestamp: Date.now(),
      };

      this.currentRecording = recording;
      this.isRecording = true;

      console.log('📋 Voice recording started');
      return recording;
    } catch (error) {
      ErrorHandler.handleError(error, 'start_voice_recording');
      return null;
    }
  }

  /**
   * Stop voice recording and transcribe
   */
  async stopVoiceRecording(): Promise<VoiceRecording | null> {
    try {
      if (!this.isRecording || !this.currentRecording) {
        console.log('📋 No active recording to stop');
        return null;
      }

      // Simulate recording duration
      this.currentRecording.duration = Math.floor(Math.random() * 60) + 10; // 10-70 seconds
      this.isRecording = false;

      this.voiceRecordings.push(this.currentRecording);
      await this.saveVoiceRecordings();

      // Start transcription
      await this.transcribeVoiceRecording(this.currentRecording.id);

      const recording = this.currentRecording;
      this.currentRecording = null;

      console.log(`📋 Voice recording stopped: ${recording.duration}s`);
      return recording;
    } catch (error) {
      ErrorHandler.handleError(error, 'stop_voice_recording');
      return null;
    }
  }

  /**
   * Transcribe voice recording to text
   */
  private async transcribeVoiceRecording(recordingId: string): Promise<void> {
    try {
      const recording = this.voiceRecordings.find(r => r.id === recordingId);
      if (!recording) return;

      recording.isTranscribing = true;
      await this.saveVoiceRecordings();

      // Simulate transcription API call
      // In real implementation, use services like Google Speech-to-Text, AWS Transcribe, etc.
      setTimeout(async () => {
        try {
          // Simulate transcription result
          const sampleTranscriptions = [
            "Security breach detected at the main entrance. Unauthorized individual attempted to enter the building at approximately 2:30 PM.",
            "Medical emergency in the lobby area. Elderly visitor experienced chest pains and required immediate assistance.",
            "Fire alarm activated on the third floor. Smoke detected in the electrical room, emergency services contacted.",
            "Equipment failure reported. Main elevator is out of service, maintenance team has been notified.",
            "Suspicious activity observed in the parking garage. Unknown vehicle parked in restricted area for extended period."
          ];

          recording.transcription = sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)];
          recording.isTranscribing = false;
          
          await this.saveVoiceRecordings();
          
          console.log(`📋 Voice transcription completed: ${recordingId}`);
          
          // Notify user
          await notificationService.sendImmediateNotification(
            'Voice Transcription Ready',
            'Your voice recording has been transcribed and is ready to use.',
            { type: 'voice_transcription_complete', recordingId }
          );
        } catch (error) {
          recording.isTranscribing = false;
          ErrorHandler.handleError(error, 'transcribe_voice_recording', false);
        }
      }, 3000); // Simulate 3-second transcription time

    } catch (error) {
      ErrorHandler.handleError(error, 'transcribe_voice_recording');
    }
  }

  /**
   * Add voice transcription to incident
   */
  async addVoiceToIncident(incidentId: string, recordingId: string): Promise<boolean> {
    try {
      const incident = this.incidents.find(i => i.id === incidentId);
      const recording = this.voiceRecordings.find(r => r.id === recordingId);

      if (!incident || !recording || !recording.transcription) {
        return false;
      }

      incident.voiceTranscription = recording.transcription;
      
      // Append to description if not empty
      if (incident.description.trim()) {
        incident.description += '\n\n[Voice Transcription]\n' + recording.transcription;
      } else {
        incident.description = recording.transcription;
      }

      await this.saveOfflineIncidents();

      console.log(`📋 Voice transcription added to incident ${incidentId}`);
      return true;
    } catch (error) {
      ErrorHandler.handleError(error, 'add_voice_to_incident');
      return false;
    }
  }

  /**
   * Submit incident (online/offline)
   */
  async submitIncident(incidentId: string): Promise<boolean> {
    try {
      const incident = this.incidents.find(i => i.id === incidentId);
      if (!incident) {
        throw new Error('Incident not found');
      }

      incident.status = 'pending';
      incident.syncStatus = 'offline';
      await this.saveOfflineIncidents();

      // Try to sync immediately if online
      const synced = await this.syncIncident(incident);
      
      if (synced) {
        incident.status = 'submitted';
        incident.syncStatus = 'synced';
        
        // Send real-time notification via WebSocket
        WebSocketService.sendCustomEvent('incident_submitted', {
          incidentId: incident.id,
          type: incident.type,
          severity: incident.severity,
          location: incident.location,
          reportedBy: incident.reportedBy,
          timestamp: incident.reportedAt,
        });

        await notificationService.sendImmediateNotification(
          'Incident Submitted',
          `Your ${incident.type.replace('_', ' ')} incident has been submitted successfully.`,
          { type: 'incident_submitted', incidentId }
        );
      } else {
        // Queue for later sync
        await cacheService.addToSyncQueue('incident_submit', {
          incidentId: incident.id,
          incidentData: incident,
          timestamp: Date.now(),
        });

        await notificationService.sendImmediateNotification(
          'Incident Queued',
          'Your incident has been saved and will be submitted when connection is restored.',
          { type: 'incident_queued', incidentId }
        );
      }

      await this.saveOfflineIncidents();
      console.log(`📋 Incident submitted: ${incidentId} (synced: ${synced})`);
      return true;
    } catch (error) {
      ErrorHandler.handleError(error, 'submit_incident');
      return false;
    }
  }

  /**
   * Sync incident to backend
   */
  private async syncIncident(incident: EnhancedIncident): Promise<boolean> {
    try {
      incident.syncStatus = 'syncing';
      incident.lastSyncAttempt = Date.now();

      // Simulate API call
      // In real implementation, this would call the backend API
      const success = Math.random() > 0.2; // 80% success rate simulation

      if (success) {
        incident.syncStatus = 'synced';
        incident.retryCount = 0;
        return true;
      } else {
        incident.syncStatus = 'failed';
        incident.retryCount += 1;
        return false;
      }
    } catch (error) {
      incident.syncStatus = 'failed';
      incident.retryCount += 1;
      ErrorHandler.handleError(error, 'sync_incident', false);
      return false;
    }
  }

  /**
   * Queue media upload
   */
  private async queueMediaUpload(mediaFile: MediaFile, incidentId: string): Promise<void> {
    try {
      await cacheService.addToSyncQueue('media_upload', {
        mediaId: mediaFile.id,
        incidentId,
        mediaFile,
        timestamp: Date.now(),
      });

      console.log(`📋 Media queued for upload: ${mediaFile.fileName}`);
    } catch (error) {
      ErrorHandler.handleError(error, 'queue_media_upload', false);
    }
  }

  /**
   * Retry failed syncs
   */
  async retryFailedSyncs(): Promise<void> {
    try {
      const failedIncidents = this.incidents.filter(
        i => i.syncStatus === 'failed' && i.retryCount < 3
      );

      for (const incident of failedIncidents) {
        await this.syncIncident(incident);
      }

      await this.saveOfflineIncidents();
      console.log(`📋 Retried ${failedIncidents.length} failed syncs`);
    } catch (error) {
      ErrorHandler.handleError(error, 'retry_failed_syncs');
    }
  }

  /**
   * Get incidents with filters
   */
  getIncidents(filters: {
    status?: EnhancedIncident['status'];
    type?: EnhancedIncident['type'];
    severity?: EnhancedIncident['severity'];
    syncStatus?: EnhancedIncident['syncStatus'];
  } = {}): EnhancedIncident[] {
    let filtered = [...this.incidents];

    if (filters.status) {
      filtered = filtered.filter(i => i.status === filters.status);
    }
    if (filters.type) {
      filtered = filtered.filter(i => i.type === filters.type);
    }
    if (filters.severity) {
      filtered = filtered.filter(i => i.severity === filters.severity);
    }
    if (filters.syncStatus) {
      filtered = filtered.filter(i => i.syncStatus === filters.syncStatus);
    }

    return filtered.sort((a, b) => b.reportedAt - a.reportedAt);
  }

  /**
   * Get incident by ID
   */
  getIncidentById(incidentId: string): EnhancedIncident | null {
    return this.incidents.find(i => i.id === incidentId) || null;
  }

  /**
   * Get voice recordings
   */
  getVoiceRecordings(): VoiceRecording[] {
    return [...this.voiceRecordings].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get incident statistics
   */
  getIncidentStats() {
    const total = this.incidents.length;
    const byStatus = {
      draft: this.incidents.filter(i => i.status === 'draft').length,
      pending: this.incidents.filter(i => i.status === 'pending').length,
      submitted: this.incidents.filter(i => i.status === 'submitted').length,
      under_review: this.incidents.filter(i => i.status === 'under_review').length,
      approved: this.incidents.filter(i => i.status === 'approved').length,
      rejected: this.incidents.filter(i => i.status === 'rejected').length,
    };
    const bySeverity = {
      low: this.incidents.filter(i => i.severity === 'low').length,
      medium: this.incidents.filter(i => i.severity === 'medium').length,
      high: this.incidents.filter(i => i.severity === 'high').length,
      critical: this.incidents.filter(i => i.severity === 'critical').length,
    };
    const bySyncStatus = {
      offline: this.incidents.filter(i => i.syncStatus === 'offline').length,
      syncing: this.incidents.filter(i => i.syncStatus === 'syncing').length,
      synced: this.incidents.filter(i => i.syncStatus === 'synced').length,
      failed: this.incidents.filter(i => i.syncStatus === 'failed').length,
    };

    return {
      total,
      byStatus,
      bySeverity,
      bySyncStatus,
      totalMediaFiles: this.incidents.reduce((sum, i) => sum + i.mediaFiles.length, 0),
      totalVoiceRecordings: this.voiceRecordings.length,
    };
  }

  /**
   * Delete incident
   */
  async deleteIncident(incidentId: string): Promise<boolean> {
    try {
      const index = this.incidents.findIndex(i => i.id === incidentId);
      if (index === -1) return false;

      this.incidents.splice(index, 1);
      await this.saveOfflineIncidents();

      console.log(`📋 Incident deleted: ${incidentId}`);
      return true;
    } catch (error) {
      ErrorHandler.handleError(error, 'delete_incident');
      return false;
    }
  }

  /**
   * Save incidents to offline storage
   */
  private async saveOfflineIncidents(): Promise<void> {
    try {
      await AsyncStorage.setItem('offline_incidents', JSON.stringify(this.incidents));
    } catch (error) {
      ErrorHandler.handleError(error, 'save_offline_incidents', false);
    }
  }

  /**
   * Load incidents from offline storage
   */
  private async loadOfflineIncidents(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('offline_incidents');
      if (stored) {
        this.incidents = JSON.parse(stored);
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'load_offline_incidents', false);
    }
  }

  /**
   * Save voice recordings to storage
   */
  private async saveVoiceRecordings(): Promise<void> {
    try {
      await AsyncStorage.setItem('voice_recordings', JSON.stringify(this.voiceRecordings));
    } catch (error) {
      ErrorHandler.handleError(error, 'save_voice_recordings', false);
    }
  }

  /**
   * Load voice recordings from storage
   */
  private async loadVoiceRecordings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('voice_recordings');
      if (stored) {
        this.voiceRecordings = JSON.parse(stored);
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'load_voice_recordings', false);
    }
  }

  /**
   * Clear old data
   */
  async clearOldData(daysOld: number = 30): Promise<void> {
    try {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      
      // Keep only recent incidents that are not synced
      this.incidents = this.incidents.filter(
        i => i.reportedAt > cutoffTime || i.syncStatus !== 'synced'
      );
      
      // Keep only recent voice recordings
      this.voiceRecordings = this.voiceRecordings.filter(
        r => r.timestamp > cutoffTime
      );

      await this.saveOfflineIncidents();
      await this.saveVoiceRecordings();

      console.log(`📋 Cleared old data (older than ${daysOld} days)`);
    } catch (error) {
      ErrorHandler.handleError(error, 'clear_old_data');
    }
  }
}

export default new EnhancedIncidentService();
export type { EnhancedIncident, MediaFile, VoiceRecording };
