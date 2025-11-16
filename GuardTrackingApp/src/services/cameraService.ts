/**
 * Camera Service for Photo Capture and Verification
 * Handles photo capture for check-in verification and incident reporting
 */

import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorHandler } from '../utils/errorHandler';
import { cacheService } from './cacheService';
import locationTrackingService from './locationTrackingService';

interface PhotoMetadata {
  id: string;
  uri: string;
  fileName: string;
  fileSize: number;
  type: string;
  width: number;
  height: number;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  purpose: 'check_in' | 'check_out' | 'incident' | 'patrol' | 'shift_documentation';
  shiftId?: string;
  incidentId?: string;
  compressed: boolean;
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'failed';
}

interface CameraOptions {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  includeBase64: boolean;
  storageOptions: {
    skipBackup: boolean;
    path: string;
  };
}

class CameraService {
  private defaultOptions: CameraOptions = {
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
    includeBase64: false,
    storageOptions: {
      skipBackup: true,
      path: 'GuardTrackingApp',
    },
  };

  /**
   * Request camera permissions
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);

        return (
          granted[PermissionsAndroid.PERMISSIONS.CAMERA] === 'granted' &&
          granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === 'granted'
        );
      }
      
      // iOS permissions are handled automatically by react-native-image-picker
      return true;
    } catch (error) {
      ErrorHandler.handleError(error, 'camera_permission_request');
      return false;
    }
  }

  /**
   * Take photo with camera
   */
  async takePhoto(
    purpose: PhotoMetadata['purpose'],
    options: Partial<CameraOptions> = {},
    shiftId?: string,
    incidentId?: string
  ): Promise<PhotoMetadata | null> {
    try {
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access to take photos.',
          [{ text: 'OK' }]
        );
        return null;
      }

      const cameraOptions = { ...this.defaultOptions, ...options };

      return new Promise((resolve) => {
        launchCamera(
          {
            mediaType: 'photo' as MediaType,
            quality: cameraOptions.quality,
            maxWidth: cameraOptions.maxWidth,
            maxHeight: cameraOptions.maxHeight,
            includeBase64: cameraOptions.includeBase64,
            storageOptions: cameraOptions.storageOptions,
          },
          async (response: ImagePickerResponse) => {
            if (response.didCancel || response.errorMessage) {
              resolve(null);
              return;
            }

            if (response.assets && response.assets[0]) {
              const asset = response.assets[0];
              const photoMetadata = await this.processPhoto(asset, purpose, shiftId, incidentId);
              resolve(photoMetadata);
            } else {
              resolve(null);
            }
          }
        );
      });
    } catch (error) {
      ErrorHandler.handleError(error, 'take_photo');
      return null;
    }
  }

  /**
   * Select photo from gallery
   */
  async selectFromGallery(
    purpose: PhotoMetadata['purpose'],
    options: Partial<CameraOptions> = {},
    shiftId?: string,
    incidentId?: string
  ): Promise<PhotoMetadata | null> {
    try {
      const cameraOptions = { ...this.defaultOptions, ...options };

      return new Promise((resolve) => {
        launchImageLibrary(
          {
            mediaType: 'photo' as MediaType,
            quality: cameraOptions.quality,
            maxWidth: cameraOptions.maxWidth,
            maxHeight: cameraOptions.maxHeight,
            includeBase64: cameraOptions.includeBase64,
            storageOptions: cameraOptions.storageOptions,
          },
          async (response: ImagePickerResponse) => {
            if (response.didCancel || response.errorMessage) {
              resolve(null);
              return;
            }

            if (response.assets && response.assets[0]) {
              const asset = response.assets[0];
              const photoMetadata = await this.processPhoto(asset, purpose, shiftId, incidentId);
              resolve(photoMetadata);
            } else {
              resolve(null);
            }
          }
        );
      });
    } catch (error) {
      ErrorHandler.handleError(error, 'select_from_gallery');
      return null;
    }
  }

  /**
   * Process captured/selected photo
   */
  private async processPhoto(
    asset: any,
    purpose: PhotoMetadata['purpose'],
    shiftId?: string,
    incidentId?: string
  ): Promise<PhotoMetadata> {
    try {
      // Get current location
      const location = locationTrackingService.getLastKnownLocation();

      const photoMetadata: PhotoMetadata = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uri: asset.uri,
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        fileSize: asset.fileSize || 0,
        type: asset.type || 'image/jpeg',
        width: asset.width || 0,
        height: asset.height || 0,
        timestamp: Date.now(),
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        } : undefined,
        purpose,
        shiftId,
        incidentId,
        compressed: false,
        uploadStatus: 'pending',
      };

      // Compress photo if needed
      const compressedPhoto = await this.compressPhoto(photoMetadata);

      // Save metadata locally
      await this.savePhotoMetadata(compressedPhoto);

      // Add to upload queue
      await this.addToUploadQueue(compressedPhoto);

      console.log(`📷 Photo captured: ${compressedPhoto.fileName} (${purpose})`);
      return compressedPhoto;
    } catch (error) {
      ErrorHandler.handleError(error, 'process_photo');
      throw error;
    }
  }

  /**
   * Compress photo for upload
   */
  private async compressPhoto(photo: PhotoMetadata): Promise<PhotoMetadata> {
    try {
      // For now, return original photo
      // In a real implementation, you would use a library like react-native-image-resizer
      // to compress the image based on file size and quality requirements
      
      const maxFileSize = 2 * 1024 * 1024; // 2MB
      
      if (photo.fileSize > maxFileSize) {
        // Simulate compression by updating metadata
        // In real implementation, compress the actual image file
        console.log(`📷 Photo compression needed: ${(photo.fileSize / 1024 / 1024).toFixed(2)}MB`);
        
        return {
          ...photo,
          compressed: true,
          // Simulate reduced file size after compression
          fileSize: Math.floor(photo.fileSize * 0.6),
        };
      }

      return photo;
    } catch (error) {
      ErrorHandler.handleError(error, 'compress_photo', false);
      return photo;
    }
  }

  /**
   * Save photo metadata locally
   */
  private async savePhotoMetadata(photo: PhotoMetadata): Promise<void> {
    try {
      const existingPhotos = await this.getStoredPhotos();
      const updatedPhotos = [...existingPhotos, photo];
      
      // Keep only last 100 photos to prevent storage bloat
      const recentPhotos = updatedPhotos.slice(-100);
      
      await AsyncStorage.setItem('photo_metadata', JSON.stringify(recentPhotos));
    } catch (error) {
      ErrorHandler.handleError(error, 'save_photo_metadata', false);
    }
  }

  /**
   * Get stored photos
   */
  async getStoredPhotos(): Promise<PhotoMetadata[]> {
    try {
      const stored = await AsyncStorage.getItem('photo_metadata');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      ErrorHandler.handleError(error, 'get_stored_photos', false);
      return [];
    }
  }

  /**
   * Add photo to upload queue
   */
  private async addToUploadQueue(photo: PhotoMetadata): Promise<void> {
    try {
      await cacheService.addToSyncQueue('photo_upload', {
        photoId: photo.id,
        uri: photo.uri,
        fileName: photo.fileName,
        fileSize: photo.fileSize,
        type: photo.type,
        purpose: photo.purpose,
        shiftId: photo.shiftId,
        incidentId: photo.incidentId,
        location: photo.location,
        timestamp: photo.timestamp,
        compressed: photo.compressed,
      });

      console.log(`📷 Photo added to upload queue: ${photo.id}`);
    } catch (error) {
      ErrorHandler.handleError(error, 'add_photo_to_upload_queue', false);
    }
  }

  /**
   * Update photo upload status
   */
  async updatePhotoUploadStatus(photoId: string, status: PhotoMetadata['uploadStatus']): Promise<void> {
    try {
      const photos = await this.getStoredPhotos();
      const updatedPhotos = photos.map(photo => 
        photo.id === photoId ? { ...photo, uploadStatus: status } : photo
      );
      
      await AsyncStorage.setItem('photo_metadata', JSON.stringify(updatedPhotos));
      console.log(`📷 Photo upload status updated: ${photoId} -> ${status}`);
    } catch (error) {
      ErrorHandler.handleError(error, 'update_photo_upload_status', false);
    }
  }

  /**
   * Get photos by purpose
   */
  async getPhotosByPurpose(purpose: PhotoMetadata['purpose']): Promise<PhotoMetadata[]> {
    try {
      const photos = await this.getStoredPhotos();
      return photos.filter(photo => photo.purpose === purpose);
    } catch (error) {
      ErrorHandler.handleError(error, 'get_photos_by_purpose', false);
      return [];
    }
  }

  /**
   * Get photos by shift ID
   */
  async getPhotosByShift(shiftId: string): Promise<PhotoMetadata[]> {
    try {
      const photos = await this.getStoredPhotos();
      return photos.filter(photo => photo.shiftId === shiftId);
    } catch (error) {
      ErrorHandler.handleError(error, 'get_photos_by_shift', false);
      return [];
    }
  }

  /**
   * Delete photo
   */
  async deletePhoto(photoId: string): Promise<boolean> {
    try {
      const photos = await this.getStoredPhotos();
      const updatedPhotos = photos.filter(photo => photo.id !== photoId);
      
      await AsyncStorage.setItem('photo_metadata', JSON.stringify(updatedPhotos));
      console.log(`📷 Photo deleted: ${photoId}`);
      return true;
    } catch (error) {
      ErrorHandler.handleError(error, 'delete_photo');
      return false;
    }
  }

  /**
   * Get pending uploads
   */
  async getPendingUploads(): Promise<PhotoMetadata[]> {
    try {
      const photos = await this.getStoredPhotos();
      return photos.filter(photo => 
        photo.uploadStatus === 'pending' || photo.uploadStatus === 'failed'
      );
    } catch (error) {
      ErrorHandler.handleError(error, 'get_pending_uploads', false);
      return [];
    }
  }

  /**
   * Retry failed uploads
   */
  async retryFailedUploads(): Promise<void> {
    try {
      const failedPhotos = await this.getPendingUploads();
      
      for (const photo of failedPhotos) {
        await this.addToUploadQueue(photo);
        await this.updatePhotoUploadStatus(photo.id, 'pending');
      }

      console.log(`📷 Retrying ${failedPhotos.length} failed photo uploads`);
    } catch (error) {
      ErrorHandler.handleError(error, 'retry_failed_uploads');
    }
  }

  /**
   * Clear old photos
   */
  async clearOldPhotos(daysOld: number = 30): Promise<void> {
    try {
      const photos = await this.getStoredPhotos();
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      
      const recentPhotos = photos.filter(photo => photo.timestamp > cutoffTime);
      
      await AsyncStorage.setItem('photo_metadata', JSON.stringify(recentPhotos));
      
      const deletedCount = photos.length - recentPhotos.length;
      console.log(`📷 Cleared ${deletedCount} old photos (older than ${daysOld} days)`);
    } catch (error) {
      ErrorHandler.handleError(error, 'clear_old_photos');
    }
  }

  /**
   * Get photo statistics
   */
  async getPhotoStats() {
    try {
      const photos = await this.getStoredPhotos();
      
      const stats = {
        total: photos.length,
        pending: photos.filter(p => p.uploadStatus === 'pending').length,
        uploaded: photos.filter(p => p.uploadStatus === 'uploaded').length,
        failed: photos.filter(p => p.uploadStatus === 'failed').length,
        totalSize: photos.reduce((sum, p) => sum + p.fileSize, 0),
        byPurpose: {
          check_in: photos.filter(p => p.purpose === 'check_in').length,
          check_out: photos.filter(p => p.purpose === 'check_out').length,
          incident: photos.filter(p => p.purpose === 'incident').length,
          patrol: photos.filter(p => p.purpose === 'patrol').length,
          shift_documentation: photos.filter(p => p.purpose === 'shift_documentation').length,
        },
      };

      return stats;
    } catch (error) {
      ErrorHandler.handleError(error, 'get_photo_stats');
      return null;
    }
  }

  /**
   * Show photo selection options
   */
  showPhotoOptions(
    purpose: PhotoMetadata['purpose'],
    shiftId?: string,
    incidentId?: string
  ): Promise<PhotoMetadata | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Add Photo',
        'Choose how you want to add a photo',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const photo = await this.takePhoto(purpose, {}, shiftId, incidentId);
              resolve(photo);
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const photo = await this.selectFromGallery(purpose, {}, shiftId, incidentId);
              resolve(photo);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]
      );
    });
  }
}

export default new CameraService();
export type { PhotoMetadata, CameraOptions };
