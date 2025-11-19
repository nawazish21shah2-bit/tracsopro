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
  private mockDataInitialized: boolean = false;

  /**
   * Initialize service
   */
  async initialize(): Promise<void> {
    try {
      await this.loadOfflineIncidents();
      await this.loadVoiceRecordings();
      
      // Initialize mock data for admin view if no incidents exist
      if (this.incidents.length === 0 && !this.mockDataInitialized) {
        await this.initializeMockAdminData();
        this.mockDataInitialized = true;
      }
      
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
      if (this.mockDataInitialized) {
        await AsyncStorage.setItem('mock_data_initialized', 'true');
      }
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
      
      // Check if mock data was previously initialized
      const mockInitialized = await AsyncStorage.getItem('mock_data_initialized');
      this.mockDataInitialized = mockInitialized === 'true';
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
   * Initialize comprehensive mock data for admin dashboard
   */
  private async initializeMockAdminData(): Promise<void> {
    try {
      const mockIncidents: EnhancedIncident[] = [
        // Critical incidents from the last 24 hours
        {
          id: 'incident_001',
          type: 'security_breach',
          severity: 'critical',
          title: 'Unauthorized Access Attempt - Main Entrance',
          description: 'Multiple failed keycard attempts detected at main entrance. Individual attempted to tailgate behind authorized personnel. Security footage captured. Immediate response required.',
          voiceTranscription: 'Security breach at main entrance, unauthorized individual attempted entry multiple times, security team responded immediately',
          location: { latitude: 40.7128, longitude: -74.0060, accuracy: 5, address: 'ABC Corporation HQ, 123 Business Ave' },
          mediaFiles: [
            {
              id: 'media_001',
              type: 'image',
              uri: 'file://security_footage_001.jpg',
              fileName: 'security_breach_evidence.jpg',
              fileSize: 2048000,
              mimeType: 'image/jpeg',
              uploadStatus: 'uploaded',
              timestamp: Date.now() - 3600000,
            }
          ],
          reportedBy: 'guard_mark_hudson',
          reportedAt: Date.now() - 3600000, // 1 hour ago
          status: 'under_review',
          syncStatus: 'synced',
          retryCount: 0,
        },
        {
          id: 'incident_002',
          type: 'medical_emergency',
          severity: 'high',
          title: 'Medical Emergency - Lobby Area',
          description: 'Elderly visitor experienced chest pains and shortness of breath. Emergency services contacted immediately. Paramedics arrived within 8 minutes. Patient stabilized and transported to hospital.',
          location: { latitude: 40.7589, longitude: -73.9851, accuracy: 3, address: 'XYZ Office Complex, 456 Corporate Blvd' },
          mediaFiles: [],
          reportedBy: 'guard_sarah_johnson',
          reportedAt: Date.now() - 7200000, // 2 hours ago
          status: 'approved',
          reviewNotes: 'Excellent response time and proper protocol followed. Well documented.',
          reviewedBy: 'admin_supervisor',
          reviewedAt: Date.now() - 3600000,
          syncStatus: 'synced',
          retryCount: 0,
        },
        {
          id: 'incident_003',
          type: 'fire_alarm',
          severity: 'high',
          title: 'Fire Alarm Activation - 3rd Floor Electrical Room',
          description: 'Smoke detected in electrical room triggered building-wide fire alarm. Fire department responded. False alarm caused by overheated equipment. Building evacuated as per protocol.',
          voiceTranscription: 'Fire alarm activated on third floor, smoke in electrical room, building evacuation in progress, fire department en route',
          location: { latitude: 40.7505, longitude: -73.9934, accuracy: 2, address: 'Tech Tower, 789 Innovation Dr' },
          mediaFiles: [
            {
              id: 'media_002',
              type: 'video',
              uri: 'file://evacuation_footage.mp4',
              fileName: 'evacuation_procedure.mp4',
              fileSize: 15728640,
              mimeType: 'video/mp4',
              uploadStatus: 'uploaded',
              duration: 180,
              timestamp: Date.now() - 14400000,
            }
          ],
          reportedBy: 'guard_james_wilson',
          reportedAt: Date.now() - 14400000, // 4 hours ago
          status: 'approved',
          syncStatus: 'synced',
          retryCount: 0,
        },
        // Medium severity incidents from today
        {
          id: 'incident_004',
          type: 'theft',
          severity: 'medium',
          title: 'Suspected Theft - Employee Parking Garage',
          description: 'Employee reported laptop bag stolen from vehicle in parking garage. Security cameras show suspicious individual near vehicle around estimated time of theft. Police report filed.',
          location: { latitude: 40.7282, longitude: -74.0776, accuracy: 8, address: 'Corporate Plaza, 321 Business Park Way' },
          mediaFiles: [
            {
              id: 'media_003',
              type: 'image',
              uri: 'file://parking_camera_001.jpg',
              fileName: 'suspect_vehicle_footage.jpg',
              fileSize: 1536000,
              mimeType: 'image/jpeg',
              uploadStatus: 'uploaded',
              timestamp: Date.now() - 21600000,
            }
          ],
          reportedBy: 'guard_michael_brown',
          reportedAt: Date.now() - 21600000, // 6 hours ago
          status: 'pending',
          syncStatus: 'synced',
          retryCount: 0,
        },
        {
          id: 'incident_005',
          type: 'vandalism',
          severity: 'medium',
          title: 'Graffiti Vandalism - Exterior Wall',
          description: 'Graffiti discovered on exterior wall of building. Appears to have occurred overnight. Maintenance team notified for cleanup. Security patrol schedule adjusted.',
          location: { latitude: 40.7614, longitude: -73.9776, accuracy: 5, address: 'Metro Business Center, 654 Commerce St' },
          mediaFiles: [
            {
              id: 'media_004',
              type: 'image',
              uri: 'file://vandalism_001.jpg',
              fileName: 'graffiti_damage.jpg',
              fileSize: 2304000,
              mimeType: 'image/jpeg',
              uploadStatus: 'uploaded',
              timestamp: Date.now() - 28800000,
            }
          ],
          reportedBy: 'guard_lisa_garcia',
          reportedAt: Date.now() - 28800000, // 8 hours ago
          status: 'under_review',
          syncStatus: 'synced',
          retryCount: 0,
        },
        // Recent incidents from yesterday
        {
          id: 'incident_006',
          type: 'trespassing',
          severity: 'medium',
          title: 'Unauthorized Individual on Premises After Hours',
          description: 'Motion sensors detected individual in restricted area after business hours. Security responded and found person sleeping in stairwell. Individual removed from premises.',
          location: { latitude: 40.7420, longitude: -74.0020, accuracy: 4, address: 'Financial District Tower, 987 Wall Street' },
          mediaFiles: [],
          reportedBy: 'guard_david_martinez',
          reportedAt: Date.now() - 86400000, // 24 hours ago
          status: 'approved',
          syncStatus: 'synced',
          retryCount: 0,
        },
        {
          id: 'incident_007',
          type: 'equipment_failure',
          severity: 'low',
          title: 'Security Camera Malfunction - Parking Lot',
          description: 'Camera #7 in parking lot showing distorted image. IT department notified. Temporary coverage provided by mobile patrol until repair completed.',
          location: { latitude: 40.7350, longitude: -74.0118, accuracy: 6, address: 'Riverside Office Park, 147 Harbor View Rd' },
          mediaFiles: [],
          reportedBy: 'guard_robert_taylor',
          reportedAt: Date.now() - 93600000, // 26 hours ago
          status: 'approved',
          syncStatus: 'synced',
          retryCount: 0,
        },
        // Older incidents for trend analysis
        {
          id: 'incident_008',
          type: 'other',
          severity: 'low',
          title: 'Suspicious Package - Reception Area',
          description: 'Unattended package reported by reception staff. Package inspection revealed forgotten lunch bag. Owner identified and item returned.',
          location: { latitude: 40.7549, longitude: -73.9840, accuracy: 3, address: 'Midtown Corporate Center, 258 Executive Ave' },
          mediaFiles: [],
          reportedBy: 'guard_amanda_white',
          reportedAt: Date.now() - 172800000, // 48 hours ago
          status: 'approved',
          syncStatus: 'synced',
          retryCount: 0,
        },
        // Pending incidents requiring admin attention
        {
          id: 'incident_009',
          type: 'security_breach',
          severity: 'high',
          title: 'Attempted Break-in - Loading Dock',
          description: 'Evidence of attempted forced entry at loading dock discovered during morning patrol. Lock damaged but entry not gained. Police notified and investigating.',
          voiceTranscription: 'Attempted break-in at loading dock, lock damaged, no entry gained, police investigating, recommend security upgrade',
          location: { latitude: 40.7200, longitude: -74.0100, accuracy: 7, address: 'Industrial Complex, 741 Manufacturing Blvd' },
          mediaFiles: [
            {
              id: 'media_005',
              type: 'image',
              uri: 'file://break_in_attempt.jpg',
              fileName: 'damaged_lock_evidence.jpg',
              fileSize: 1843200,
              mimeType: 'image/jpeg',
              uploadStatus: 'uploaded',
              timestamp: Date.now() - 10800000,
            }
          ],
          reportedBy: 'guard_kevin_anderson',
          reportedAt: Date.now() - 10800000, // 3 hours ago
          status: 'pending',
          syncStatus: 'synced',
          retryCount: 0,
        },
        {
          id: 'incident_010',
          type: 'medical_emergency',
          severity: 'medium',
          title: 'Slip and Fall Incident - Main Lobby',
          description: 'Visitor slipped on wet floor near entrance during rainstorm. Minor injury to ankle. First aid provided. Incident report completed. Recommend additional wet floor signage.',
          location: { latitude: 40.7680, longitude: -73.9820, accuracy: 2, address: 'Premium Office Suites, 159 Professional Plaza' },
          mediaFiles: [],
          reportedBy: 'guard_jennifer_lee',
          reportedAt: Date.now() - 5400000, // 1.5 hours ago
          status: 'pending',
          syncStatus: 'synced',
          retryCount: 0,
        }
      ];

      this.incidents = mockIncidents;
      await this.saveOfflineIncidents();
      
      console.log('📋 Mock admin data initialized with', mockIncidents.length, 'incidents');
    } catch (error) {
      ErrorHandler.handleError(error, 'initialize_mock_admin_data');
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
