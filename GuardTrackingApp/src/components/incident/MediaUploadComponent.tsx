import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { Camera, Image as ImageIcon, Video, Trash2, Plus } from 'react-native-feather';
import cameraService, { PhotoMetadata } from '../../services/cameraService';

const { width } = Dimensions.get('window');

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

interface MediaUploadComponentProps {
  mediaFiles: MediaFile[];
  onMediaAdded: (media: MediaFile) => void;
  onMediaRemoved: (mediaId: string) => void;
  maxFiles?: number;
  allowedTypes?: ('image' | 'video' | 'audio')[];
  incidentId?: string;
  shiftId?: string;
}

const MediaUploadComponent: React.FC<MediaUploadComponentProps> = ({
  mediaFiles,
  onMediaAdded,
  onMediaRemoved,
  maxFiles = 10,
  allowedTypes = ['image', 'video'],
  incidentId,
  shiftId,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<MediaFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const showMediaOptions = () => {
    const options = [
      { text: 'Take Photo', onPress: handleTakePhoto },
      { text: 'Choose from Gallery', onPress: handleSelectFromGallery },
    ];

    if (allowedTypes.includes('video')) {
      options.push({ text: 'Record Video', onPress: handleRecordVideo });
    }

    options.push({ text: 'Cancel', onPress: async () => {} });

    Alert.alert('Add Media', 'Choose an option', options);
  };

  const handleTakePhoto = async () => {
    try {
      setUploading(true);
      const photo = await cameraService.takePhoto('incident', {}, shiftId, incidentId);
      
      if (photo) {
        const mediaFile: MediaFile = {
          id: photo.id,
          type: 'image',
          uri: photo.uri,
          fileName: photo.fileName,
          fileSize: photo.fileSize,
          mimeType: photo.type,
          uploadStatus: 'pending',
          thumbnailUri: photo.uri,
        };
        
        onMediaAdded(mediaFile);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      setUploading(true);
      const photo = await cameraService.selectFromGallery('incident', {}, shiftId, incidentId);
      
      if (photo) {
        const mediaFile: MediaFile = {
          id: photo.id,
          type: 'image',
          uri: photo.uri,
          fileName: photo.fileName,
          fileSize: photo.fileSize,
          mimeType: photo.type,
          uploadStatus: 'pending',
          thumbnailUri: photo.uri,
        };
        
        onMediaAdded(mediaFile);
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRecordVideo = async () => {
    // TODO: Implement video recording
    Alert.alert('Coming Soon', 'Video recording will be available in the next update.');
  };

  const handleRemoveMedia = (mediaId: string) => {
    Alert.alert(
      'Remove Media',
      'Are you sure you want to remove this media file?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onMediaRemoved(mediaId) },
      ]
    );
  };

  const handlePreviewMedia = (media: MediaFile) => {
    setPreviewMedia(media);
    setShowPreview(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: MediaFile['uploadStatus']): string => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'uploading': return '#3B82F6';
      case 'uploaded': return '#10B981';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: MediaFile['uploadStatus']): string => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'uploading': return 'Uploading...';
      case 'uploaded': return 'Uploaded';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  const renderMediaItem = (media: MediaFile) => (
    <View key={media.id} style={styles.mediaItem}>
      <TouchableOpacity
        style={styles.mediaThumbnail}
        onPress={() => handlePreviewMedia(media)}
      >
        {media.type === 'image' ? (
          <Image source={{ uri: media.uri }} style={styles.thumbnailImage} />
        ) : (
          <View style={styles.videoThumbnail}>
            <Video width={24} height={24} color="#FFF" />
            {media.duration && (
              <Text style={styles.videoDuration}>
                {Math.floor(media.duration / 60)}:{(media.duration % 60).toString().padStart(2, '0')}
              </Text>
            )}
          </View>
        )}
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveMedia(media.id)}
        >
          <Trash2 width={16} height={16} color="#FFF" />
        </TouchableOpacity>
      </TouchableOpacity>
      
      <View style={styles.mediaInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {media.fileName}
        </Text>
        <Text style={styles.fileSize}>{formatFileSize(media.fileSize)}</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(media.uploadStatus) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(media.uploadStatus) }]}>
            {getStatusText(media.uploadStatus)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPreviewModal = () => (
    <Modal
      visible={showPreview}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPreview(false)}
    >
      <View style={styles.previewOverlay}>
        <TouchableOpacity
          style={styles.previewCloseArea}
          onPress={() => setShowPreview(false)}
        >
          <View style={styles.previewContainer}>
            {previewMedia?.type === 'image' ? (
              <Image
                source={{ uri: previewMedia.uri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.videoPreview}>
                <Video width={64} height={64} color="#FFF" />
                <Text style={styles.videoPreviewText}>Video Preview</Text>
                <Text style={styles.videoPreviewSubtext}>
                  Tap to play (feature coming soon)
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Media Attachments</Text>
        <Text style={styles.subtitle}>
          {mediaFiles.length}/{maxFiles} files
        </Text>
      </View>

      {mediaFiles.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.mediaList}
          contentContainerStyle={styles.mediaListContent}
        >
          {mediaFiles.map(renderMediaItem)}
        </ScrollView>
      )}

      {mediaFiles.length < maxFiles && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={showMediaOptions}
          disabled={uploading}
        >
          <Plus width={24} height={24} color="#007AFF" />
          <Text style={styles.addButtonText}>
            {uploading ? 'Processing...' : 'Add Photo/Video'}
          </Text>
        </TouchableOpacity>
      )}

      {mediaFiles.length === 0 && (
        <View style={styles.emptyState}>
          <ImageIcon width={48} height={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>No media files added</Text>
          <Text style={styles.emptyStateSubtext}>
            Add photos or videos to support your incident report
          </Text>
        </View>
      )}

      {renderPreviewModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  mediaList: {
    marginBottom: 16,
  },
  mediaListContent: {
    paddingRight: 16,
  },
  mediaItem: {
    marginRight: 12,
    width: 120,
  },
  mediaThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDuration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#FFF',
    fontSize: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaInfo: {
    marginTop: 8,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    width: width - 40,
    height: width - 40,
    maxHeight: 400,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#374151',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreviewText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
  },
  videoPreviewSubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default MediaUploadComponent;
