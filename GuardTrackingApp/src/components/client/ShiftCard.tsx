/**
 * Pixel-Perfect Shift Card Component for Client Dashboard
 * Matches exact design specifications with shadows, borders, typography
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { Platform } from 'react-native';
import { MapPinIcon } from '../ui/FeatherIcons';
import StatusBadge from './StatusBadge';

const { width: screenWidth } = Dimensions.get('window');

interface ShiftCardProps {
  shift: {
    id: string;
    guardId: string;
    guardName: string;
    guardAvatar?: string;
    siteName: string;
    siteAddress: string;
    siteLatitude?: number;
    siteLongitude?: number;
    guardLatitude?: number;
    guardLongitude?: number;
    shiftTime: string;
    startTime: string;
    endTime: string;
    status: 'Active' | 'Upcoming' | 'Missed' | 'Completed';
    checkInTime?: string;
    checkOutTime?: string;
    description?: string;
    breakTime?: string;
    shiftStartIn?: string;
  };
  onPress?: () => void;
  onViewLocation?: () => void;
  onGuardPress?: (guardId: string) => void;
  onMapPress?: () => void;
  showMap?: boolean;
  mapHeight?: number;
}

const ShiftCard: React.FC<ShiftCardProps> = ({
  shift,
  onPress,
  onViewLocation,
  onGuardPress,
  onMapPress,
  showMap = true,
  mapHeight = 200,
}) => {
  const formatTime = (time?: string) => {
    if (!time) return '--:--';
    try {
      const date = new Date(time);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'Pm' : 'Am';
      const displayHours = hours % 12 || 12;
      return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } catch {
      return time;
    }
  };

  // Default map region (San Francisco Mission District)
  const defaultRegion: Region = {
    latitude: shift.siteLatitude || 37.7599,
    longitude: shift.siteLongitude || -122.4148,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.95}
    >
      {/* Map Section */}
      {showMap && (
        <TouchableOpacity
          style={[styles.mapContainer, { height: mapHeight }]}
          onPress={onMapPress || onViewLocation}
          activeOpacity={0.9}
        >
          <MapView
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
            region={defaultRegion}
            scrollEnabled={true}
            zoomEnabled={true}
            pitchEnabled={false}
            rotateEnabled={false}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            showsScale={false}
            onPress={onMapPress || onViewLocation}
          >
            {/* Site Marker */}
            {shift.siteLatitude && shift.siteLongitude && (
              <Marker
                coordinate={{
                  latitude: shift.siteLatitude,
                  longitude: shift.siteLongitude,
                }}
                title={shift.siteName}
                description={shift.siteAddress}
                pinColor="#1C6CA9"
              />
            )}
            {/* Guard Location Marker (if active shift) */}
            {shift.status === 'Active' && shift.guardLatitude && shift.guardLongitude && (
              <Marker
                coordinate={{
                  latitude: shift.guardLatitude,
                  longitude: shift.guardLongitude,
                }}
                title={shift.guardName}
                description="Guard Location"
              >
                <View style={styles.guardMarker}>
                  <View style={styles.guardMarkerInner}>
                    <Text style={styles.guardMarkerText}>👤</Text>
                  </View>
                </View>
              </Marker>
            )}
          </MapView>
        </TouchableOpacity>
      )}

      {/* Card Content */}
      <View style={styles.cardContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.locationInfo}>
            <View style={styles.locationIconContainer}>
              <MapPinIcon size={20} color="#1C6CA9" />
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationName} numberOfLines={1}>
                {shift.siteName}
              </Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {shift.siteAddress}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {onViewLocation && (
              <TouchableOpacity
                style={styles.viewLocationButton}
                onPress={onViewLocation}
                activeOpacity={0.7}
              >
                <Text style={styles.viewLocationText}>View Location</Text>
              </TouchableOpacity>
            )}
            <StatusBadge status={shift.status} size="small" />
          </View>
        </View>

        {/* Description */}
        {shift.description && (
          <Text style={styles.description} numberOfLines={2}>
            {shift.description}
          </Text>
        )}

        {/* Shift Details */}
        <View style={styles.shiftDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Shift Duration:</Text>
            <Text style={styles.detailValue}>
              {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
            </Text>
          </View>
          {shift.breakTime && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Break Time:</Text>
              <Text style={styles.detailValue}>{shift.breakTime}</Text>
            </View>
          )}
          {shift.shiftStartIn && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shift Start In:</Text>
              <Text style={styles.detailValue}>{shift.shiftStartIn}</Text>
            </View>
          )}
        </View>

        {/* Guard Info */}
        {shift.guardName && (
          <TouchableOpacity
            style={styles.guardInfo}
            onPress={() => onGuardPress?.(shift.guardId)}
            activeOpacity={0.7}
          >
            <View style={styles.guardAvatar}>
              {shift.guardAvatar ? (
                <Image
                  source={{ uri: shift.guardAvatar }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {shift.guardName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.guardDetails}>
              <Text style={styles.guardName}>{shift.guardName}</Text>
              {shift.checkInTime && (
                <Text style={styles.checkInTime}>
                  Checked in at {formatTime(shift.checkInTime)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    // Drop shadow: X 0, Y 4, Blur 4, Spread 0, Color #DCDCDC at 25% opacity
    shadowColor: '#DCDCDC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4, // Android shadow
    // Border/Stroke: Color #DCDCDC, Weight 1, Inside position
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderStyle: 'solid',
    marginBottom: 16,
    // Clip content
    clipToBounds: true,
  },
  mapContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  siteMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  guardMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  guardMarkerInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guardMarkerText: {
    fontSize: 20,
  },
  cardContent: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    marginTop: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  locationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#323232',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 12,
    fontWeight: '400',
    color: '#828282',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  viewLocationButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#DBEAFE',
    borderRadius: 30,
  },
  viewLocationText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1C6CA9',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
  },
  description: {
    fontSize: 12,
    fontWeight: '400',
    color: '#828282',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    lineHeight: 16,
    marginBottom: 12,
  },
  shiftDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#828282',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#323232',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
  },
  guardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  guardAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Inter',
  },
  guardDetails: {
    flex: 1,
  },
  guardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#323232',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    marginBottom: 2,
  },
  checkInTime: {
    fontSize: 12,
    fontWeight: '400',
    color: '#828282',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
  },
});

export default ShiftCard;

