/**
 * Pixel-Perfect Shift Card Component for Client Dashboard
 * Matches exact design specifications with shadows, borders, typography
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { Platform } from 'react-native';
import { MapPinIcon } from '../ui/FeatherIcons';
import ProfileAvatar from '../common/ProfileAvatar';
import { parseDisplayName } from '../../utils/parseDisplayName';
import StatusBadge from './StatusBadge';
import GuardMapMarker from '../maps/GuardMapMarker';
import {
  collectMapPoints,
  computeRegionForPoints,
  isValidLatLng,
  parseCoordinate,
} from '../../utils/mapRegionUtils';

const { width: screenWidth } = Dimensions.get('window');

interface ShiftCardProps {
  shift: {
    id: string;
    guardId?: string | null; // Optional - can be unassigned
    guardName?: string; // Optional - shows "Unassigned" if null
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
  const mapRef = useRef<MapView>(null);

  const siteLat = parseCoordinate(shift.siteLatitude);
  const siteLng = parseCoordinate(shift.siteLongitude);
  const guardLat = parseCoordinate(shift.guardLatitude);
  const guardLng = parseCoordinate(shift.guardLongitude);
  const hasGuardPin = isValidLatLng(guardLat, guardLng);
  const hasSitePin = isValidLatLng(siteLat, siteLng);

  const mapPoints = useMemo(
    () =>
      collectMapPoints({
        siteLatitude: siteLat,
        siteLongitude: siteLng,
        guardLatitude: guardLat,
        guardLongitude: guardLng,
      }),
    [siteLat, siteLng, guardLat, guardLng],
  );

  const mapRegion = useMemo(() => computeRegionForPoints(mapPoints), [mapPoints]);

  useEffect(() => {
    if (!showMap || mapPoints.length === 0 || !mapRef.current) return;

    const timer = setTimeout(() => {
      if (mapPoints.length === 1) {
        mapRef.current?.animateToRegion(mapRegion, 350);
      } else {
        mapRef.current?.fitToCoordinates(mapPoints, {
          edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
          animated: true,
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [showMap, mapPoints, mapRegion]);

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
            ref={mapRef}
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
            initialRegion={mapRegion}
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
            {hasSitePin && (
              <Marker
                coordinate={{
                  latitude: siteLat!,
                  longitude: siteLng!,
                }}
                title={shift.siteName}
                description={shift.siteAddress}
                pinColor="#1C6CA9"
              />
            )}
            {hasGuardPin && (
              <GuardMapMarker
                guardId={shift.guardId || shift.id}
                guardName={shift.guardName || 'Guard'}
                latitude={guardLat!}
                longitude={guardLng!}
                status={shift.status === 'Active' ? 'active' : 'offline'}
                siteName={shift.siteName}
              />
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
        <View style={styles.guardInfo}>
          {shift.guardId && shift.guardName ? (
            <TouchableOpacity
              style={styles.guardInfoTouchable}
              onPress={() => onGuardPress?.(shift.guardId!)}
              activeOpacity={0.7}
            >
              <View style={styles.guardAvatar}>
                <ProfileAvatar
                  {...parseDisplayName(shift.guardName)}
                  profilePictureUrl={shift.guardAvatar}
                  size={40}
                />
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
          ) : (
            <View style={styles.unassignedGuardInfo}>
              <View style={styles.guardAvatar}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>?</Text>
                </View>
              </View>
              <View style={styles.guardDetails}>
                <Text style={styles.unassignedText}>Guard Not Assigned</Text>
                <Text style={styles.unassignedSubtext}>Admin will assign a guard soon</Text>
              </View>
            </View>
          )}
        </View>
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
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  guardInfoTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unassignedGuardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unassignedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#828282',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    marginBottom: 2,
  },
  unassignedSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: '#828282',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    fontStyle: 'italic',
  },
  guardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Inter',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 18,
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

