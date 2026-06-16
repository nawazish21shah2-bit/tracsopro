import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import cameraService from '../../services/cameraService';
import { ReportMediaItem, photoToReportMediaItem } from '../../utils/reportMediaUtils';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { CameraIcon, FeatherIcon } from '../ui/FeatherIcons';

interface ReportMediaPickerProps {
  items: ReportMediaItem[];
  onChange: (items: ReportMediaItem[]) => void;
  maxItems?: number;
  shiftId?: string;
  title?: string;
  hint?: string;
  compact?: boolean;
}

const ReportMediaPicker: React.FC<ReportMediaPickerProps> = ({
  items,
  onChange,
  maxItems = 6,
  shiftId,
  title = 'Photo evidence',
  hint = 'Add photos to support your report (optional)',
  compact = false,
}) => {
  const [busy, setBusy] = useState(false);

  const addPhoto = useCallback(
    async (source: 'camera' | 'gallery') => {
      if (items.length >= maxItems) {
        Alert.alert('Limit reached', `You can attach up to ${maxItems} photos.`);
        return;
      }

      try {
        setBusy(true);
        const photo =
          source === 'camera'
            ? await cameraService.takePhoto('incident', {}, shiftId)
            : await cameraService.selectFromGallery('incident', {}, shiftId);

        if (photo) {
          onChange([...items, photoToReportMediaItem(photo)]);
        }
      } catch {
        Alert.alert('Error', 'Could not add photo. Please try again.');
      } finally {
        setBusy(false);
      }
    },
    [items, maxItems, onChange, shiftId],
  );

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const atLimit = items.length >= maxItems;

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.accent} />

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.hint}>{hint}</Text>
          </View>
          <Text style={styles.count}>
            {items.length}/{maxItems}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, (busy || atLimit) && styles.actionBtnDisabled]}
            onPress={() => addPhoto('camera')}
            disabled={busy || atLimit}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <CameraIcon size={18} color={COLORS.primary} />
            )}
            <Text style={styles.actionBtnText}>Take photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, (busy || atLimit) && styles.actionBtnDisabled]}
            onPress={() => addPhoto('gallery')}
            disabled={busy || atLimit}
            activeOpacity={0.85}
          >
            <FeatherIcon name="image" size={18} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {items.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbRow}
          >
            {items.map((item) => (
              <View key={item.id} style={styles.thumbWrap}>
                <Image source={{ uri: item.uri }} style={styles.thumb} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeItem(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <FeatherIcon name="x" size={12} color={COLORS.textInverse} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyStrip}>
            <FeatherIcon name="image" size={20} color={COLORS.textTertiary} />
            <Text style={styles.emptyText}>No photos attached yet</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  cardCompact: {
    marginTop: SPACING.sm,
  },
  accent: {
    width: 4,
    backgroundColor: COLORS.primary,
  },
  body: {
    flex: 1,
    padding: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  hint: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  count: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  thumbRow: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  emptyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
});

export default ReportMediaPicker;
