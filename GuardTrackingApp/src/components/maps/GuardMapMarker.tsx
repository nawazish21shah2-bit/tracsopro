import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { COLORS } from '../../styles/globalStyles';
import { LiveGuardStatus } from '../../types/liveTracking.types';

interface GuardMapMarkerProps {
  guardId: string;
  guardName: string;
  latitude: number;
  longitude: number;
  status?: LiveGuardStatus;
  siteName?: string;
  accuracy?: number;
  selected?: boolean;
  onPress?: (guardId: string) => void;
}

const statusColor = (status?: LiveGuardStatus) => {
  switch (status) {
    case 'on_break':
      return COLORS.warning;
    case 'offline':
      return COLORS.error;
    case 'emergency':
      return COLORS.error;
    default:
      return COLORS.success;
  }
};

const GuardMapMarker: React.FC<GuardMapMarkerProps> = ({
  guardId,
  guardName,
  latitude,
  longitude,
  status = 'active',
  siteName,
  accuracy,
  selected = false,
  onPress,
}) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 400);
    return () => clearTimeout(timer);
  }, [latitude, longitude, selected, status]);

  return (
    <Marker
      identifier={guardId}
      coordinate={{ latitude, longitude }}
      title={guardName}
      description={[siteName, `Status: ${status}`, accuracy ? `±${Math.round(accuracy)}m` : null]
        .filter(Boolean)
        .join(' · ')}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      onPress={() => onPress?.(guardId)}
    >
      <View
        style={[
          styles.marker,
          { backgroundColor: statusColor(status) },
          selected && styles.selected,
        ]}
      >
        <Text style={styles.icon}>👤</Text>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  marker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.backgroundPrimary,
    elevation: 4,
  },
  selected: {
    borderColor: COLORS.primary,
    borderWidth: 3,
    transform: [{ scale: 1.15 }],
  },
  icon: {
    fontSize: 16,
  },
});

export default GuardMapMarker;
