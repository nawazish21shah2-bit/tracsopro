import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { MapPinIcon, ExternalLinkIcon } from './FeatherIcons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

interface LocationCardProps {
  location: string;
  address: string;
  onViewLocation?: () => void;
  showExternalLink?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  address,
  onViewLocation,
  showExternalLink = true,
  style,
  children,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.locationInfo}>
          <MapPinIcon size={20} color={COLORS.primary} />
          <View style={styles.locationText}>
            <Text style={styles.locationName}>{location}</Text>
            <Text style={styles.locationAddress}>{address}</Text>
          </View>
        </View>
        {showExternalLink && onViewLocation && (
          <TouchableOpacity style={styles.externalLinkButton} onPress={onViewLocation}>
            <ExternalLinkIcon size={16} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  locationText: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  locationName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  externalLinkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LocationCard;
