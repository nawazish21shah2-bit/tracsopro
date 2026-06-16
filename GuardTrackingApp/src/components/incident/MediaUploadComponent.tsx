import React from 'react';
import { View, StyleSheet } from 'react-native';
import ReportMediaPicker from '../reports/ReportMediaPicker';
import { ReportMediaItem } from '../../utils/reportMediaUtils';
import { SPACING } from '../../styles/globalStyles';

export interface MediaFile {
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

function toReportItems(files: MediaFile[]): ReportMediaItem[] {
  return files.map((file) => ({
    id: file.id,
    uri: file.uri,
    type: file.type === 'video' ? 'video' : 'image',
    fileName: file.fileName,
    fileSize: file.fileSize,
  }));
}

function toMediaFile(item: ReportMediaItem): MediaFile {
  return {
    id: item.id,
    type: item.type,
    uri: item.uri,
    fileName: item.fileName || `photo_${item.id}.jpg`,
    fileSize: item.fileSize || 0,
    mimeType: item.type === 'video' ? 'video/mp4' : 'image/jpeg',
    uploadStatus: 'pending',
    thumbnailUri: item.uri,
  };
}

const MediaUploadComponent: React.FC<MediaUploadComponentProps> = ({
  mediaFiles,
  onMediaAdded,
  onMediaRemoved,
  maxFiles = 10,
  shiftId,
}) => {
  const items = toReportItems(mediaFiles);

  const handleChange = (next: ReportMediaItem[]) => {
    if (next.length > items.length) {
      const added = next.find((item) => !items.some((existing) => existing.id === item.id));
      if (added) {
        onMediaAdded(toMediaFile(added));
      }
      return;
    }

    const removed = items.find((item) => !next.some((existing) => existing.id === item.id));
    if (removed) {
      onMediaRemoved(removed.id);
    }
  };

  return (
    <View style={styles.wrap}>
      <ReportMediaPicker
        items={items}
        onChange={handleChange}
        maxItems={maxFiles}
        shiftId={shiftId}
        title="Photo evidence"
        hint="Take or choose photos to support this report"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginVertical: SPACING.sm,
  },
});

export default MediaUploadComponent;
