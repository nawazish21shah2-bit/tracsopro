/**
 * Interactive Map View - Phase 5
 * Real-time guard location display with site boundaries and geofencing
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { 
  Marker, 
  Polygon, 
  Circle, 
  PROVIDER_GOOGLE, 
  PROVIDER_DEFAULT,
  Region,
  MapPressEvent,
} from 'react-native-maps';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { ErrorHandler } from '../../utils/errorHandler';
import { useLiveGuardLocations } from '../../hooks/useLiveGuardLocations';
import { LiveGuardMarker } from '../../types/liveTracking.types';
import GuardMapMarker from '../maps/GuardMapMarker';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import {
  buildLiveGuardSignature,
  isValidCoordinate,
} from '../../utils/liveGuardLocationMapper';
import { computeRegionForPoints } from '../../utils/mapRegionUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface GuardLocation {
  guardId: string;
  guardName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  status: 'active' | 'on_break' | 'offline' | 'emergency';
  siteName?: string;
  lastUpdate: string;
}

interface SiteBoundary {
  siteId: string;
  siteName: string;
  center: { latitude: number; longitude: number };
  radius: number;
  coordinates: { latitude: number; longitude: number }[];
  isActive: boolean;
}

const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

interface InteractiveMapViewProps {
  height?: number;
  showControls?: boolean;
  onGuardSelect?: (guardId: string) => void;
  /** Pre-fetched live markers from parent (preferred) */
  liveGuards?: LiveGuardMarker[];
  /** Optional metadata overlay when parent manages live fetch */
  guardData?: Array<{
    guardId: string;
    guardName: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    status: 'active' | 'on_break' | 'offline' | 'emergency';
    siteName?: string;
  }>;
  enableLiveTracking?: boolean;
  /** once = fit on first markers only; always = refit when markers move (dashboard). */
  autoFit?: 'once' | 'always' | 'never';
}

const toGuardLocation = (guard: LiveGuardMarker): GuardLocation => ({
  guardId: guard.guardId,
  guardName: guard.guardName,
  latitude: guard.latitude,
  longitude: guard.longitude,
  accuracy: guard.accuracy,
  timestamp: guard.timestamp,
  status: guard.status,
  siteName: guard.siteName,
  lastUpdate: formatRelativeTime(new Date(guard.timestamp)) || 'Live',
});

const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({
  height = 300,
  showControls = true,
  onGuardSelect,
  liveGuards: liveGuardsProp,
  guardData,
  enableLiveTracking = true,
  autoFit = 'always',
}) => {
  const { sites } = useSelector((state: RootState) => state.client);
  const supplementalGuards = guardData?.map((guard) => ({
    guardId: guard.guardId,
    guardName: guard.guardName,
    latitude: guard.latitude,
    longitude: guard.longitude,
    accuracy: guard.accuracy,
    status: guard.status,
    siteName: guard.siteName,
    timestamp: Date.now(),
  }));

  const { guards: fetchedLiveGuards, isConnected: hookConnected } = useLiveGuardLocations({
    enabled: enableLiveTracking && !liveGuardsProp,
    supplementalGuards,
  });

  const liveGuards = useMemo(
    () => (liveGuardsProp ?? fetchedLiveGuards).filter((g) => isValidCoordinate(g.latitude, g.longitude)),
    [liveGuardsProp, fetchedLiveGuards]
  );

  const isConnected =
    liveGuardsProp != null
      ? liveGuards.some((g) => Date.now() - (g.timestamp || 0) < 45000)
      : hookConnected;
  
  const [guardLocations, setGuardLocations] = useState<GuardLocation[]>([]);
  const [siteBoundaries, setSiteBoundaries] = useState<SiteBoundary[]>([]);
  const [selectedGuard, setSelectedGuard] = useState<string | null>(null);
  const [showGeofences, setShowGeofences] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(true);

  const mapRef = useRef<MapView>(null);
  const hasAutoFitRef = useRef(false);

  const markerSignature = useMemo(
    () => buildLiveGuardSignature(liveGuards),
    [liveGuards],
  );

  const initialRegion = useMemo(() => {
    if (liveGuards.length === 0) {
      return {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }
    return computeRegionForPoints(
      liveGuards.map((g) => ({ latitude: g.latitude, longitude: g.longitude })),
    );
  }, [liveGuards]);

  const [mapRegion, setMapRegion] = useState<Region>(initialRegion);

  useEffect(() => {
    if (autoFit === 'once' && hasAutoFitRef.current) return;
    setMapRegion(initialRegion);
  }, [initialRegion, autoFit]);

  useEffect(() => {
    loadSiteBoundaries();
  }, []);

  useEffect(() => {
    const markers = liveGuards.map(toGuardLocation);
    setGuardLocations((prev) => {
      const prevSig = buildLiveGuardSignature(
        prev.map((g) => ({
          guardId: g.guardId,
          guardName: g.guardName,
          latitude: g.latitude,
          longitude: g.longitude,
          accuracy: g.accuracy,
          status: g.status,
          siteName: g.siteName,
          timestamp: g.timestamp,
        })),
      );
      if (prevSig === markerSignature) return prev;
      return markers;
    });
  }, [markerSignature, liveGuards]);

  useEffect(() => {
    if (!isLiveMode || autoFit === 'never') return;
    if (autoFit === 'once' && hasAutoFitRef.current) return;
    if (liveGuards.length === 0) return;

    const coordinates = liveGuards.map((guard) => ({
      latitude: guard.latitude,
      longitude: guard.longitude,
    }));

    siteBoundaries.forEach((site) => {
      coordinates.push(site.center);
    });

    const timer = setTimeout(() => {
      if (!mapRef.current) return;

      if (coordinates.length === 1) {
        const only = coordinates[0];
        mapRef.current.animateToRegion(
          {
            latitude: only.latitude,
            longitude: only.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          600,
        );
      } else {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
          animated: true,
        });
      }
      hasAutoFitRef.current = true;
    }, 350);

    return () => clearTimeout(timer);
  }, [markerSignature, isLiveMode, siteBoundaries, autoFit, liveGuards.length]);

  // Update site boundaries when sites change
  useEffect(() => {
    if (sites && sites.length > 0) {
      loadSiteBoundaries();
    }
  }, [sites]);

  const loadSiteBoundaries = async () => {
    try {
      // Use real site data from Redux state
      if (!sites || sites.length === 0) {
        setSiteBoundaries([]);
        return;
      }

      // Convert sites to site boundaries format
      const siteBoundaries: SiteBoundary[] = sites
        .filter(
          (site: any) =>
            Number.isFinite(site.latitude) && Number.isFinite(site.longitude) && site.isActive,
        )
        .map((site: any) => {
          const center = {
            latitude: site.latitude,
            longitude: site.longitude,
          };
          
          // Create a simple square boundary around the site (can be enhanced with actual geofence data)
          const radius = Math.max(20, Math.round(site.radiusMeters || 100));
          const latDelta = radius / 111000; // Approximate conversion: 1 degree ≈ 111km
          const lngDelta = radius / (111000 * Math.cos(center.latitude * Math.PI / 180));
          
          const coordinates = [
            { latitude: center.latitude + latDelta, longitude: center.longitude + lngDelta },
            { latitude: center.latitude + latDelta, longitude: center.longitude - lngDelta },
            { latitude: center.latitude - latDelta, longitude: center.longitude - lngDelta },
            { latitude: center.latitude - latDelta, longitude: center.longitude + lngDelta },
          ];

          return {
            siteId: site.id,
            siteName: site.name,
            center,
            radius,
            coordinates,
            isActive: site.isActive,
          };
        });

      setSiteBoundaries(siteBoundaries);
    } catch (error) {
      ErrorHandler.handleError(error, 'load_site_boundaries', false);
      setSiteBoundaries([]);
    }
  };

  const handleGuardPress = (guardId: string) => {
    setSelectedGuard(guardId);
    if (onGuardSelect) {
      onGuardSelect(guardId);
    }

    const guard = guardLocations.find(g => g.guardId === guardId);
    if (guard && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: guard.latitude,
        longitude: guard.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      const newRegion = {
        ...mapRegion,
        latitudeDelta: mapRegion.latitudeDelta * 0.5,
        longitudeDelta: mapRegion.longitudeDelta * 0.5,
      };
      mapRef.current.animateToRegion(newRegion, 500);
      setMapRegion(newRegion);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const newRegion = {
        ...mapRegion,
        latitudeDelta: Math.min(mapRegion.latitudeDelta * 2, 1),
        longitudeDelta: Math.min(mapRegion.longitudeDelta * 2, 1),
      };
      mapRef.current.animateToRegion(newRegion, 500);
      setMapRegion(newRegion);
    }
  };

  const toggleLiveMode = () => {
    setIsLiveMode((prev) => !prev);
  };

  const getGuardStatusColor = (status: GuardLocation['status']) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'on_break': return COLORS.warning;
      case 'offline': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const renderMapView = () => (
    <View style={[styles.mapContainer, { height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
      >
        {/* Guard Markers */}
        {guardLocations.map((guard) => (
          <GuardMapMarker
            key={guard.guardId}
            guardId={guard.guardId}
            guardName={guard.guardName}
            latitude={guard.latitude}
            longitude={guard.longitude}
            status={guard.status}
            siteName={guard.siteName}
            accuracy={guard.accuracy}
            selected={selectedGuard === guard.guardId}
            onPress={handleGuardPress}
          />
        ))}

        {/* Site Boundaries - Geofences */}
        {showGeofences && siteBoundaries.map((site) => (
          <React.Fragment key={site.siteId}>
            {/* Circular geofence */}
            <Circle
              center={site.center}
              radius={site.radius}
              strokeColor={COLORS.primary + '80'}
              fillColor={COLORS.primary + '20'}
              strokeWidth={2}
            />
            {/* Polygon boundary if coordinates are available */}
            {site.coordinates && site.coordinates.length > 0 && (
              <Polygon
                coordinates={site.coordinates}
                strokeColor={COLORS.primary + '80'}
                fillColor={COLORS.primary + '10'}
                strokeWidth={2}
              />
            )}
          </React.Fragment>
        ))}
      </MapView>

      {/* Live Status Indicator */}
      <View style={styles.liveIndicator}>
        <View style={[styles.liveDot, { backgroundColor: isConnected && isLiveMode ? COLORS.success : COLORS.warning }]} />
        <Text style={styles.liveText}>
          {isLiveMode ? (isConnected ? 'LIVE' : 'POLLING') : 'PAUSED'}
        </Text>
        {guardLocations.length > 0 && (
          <Text style={styles.guardCountText}> · {guardLocations.length}</Text>
        )}
      </View>

      {guardLocations.length === 0 && (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <Text style={styles.emptyTitle}>No live guard locations</Text>
          <Text style={styles.emptySubtitle}>
            Guards appear here after check-in with GPS enabled
          </Text>
        </View>
      )}

      {/* Map Controls */}
      {showControls && (
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn}>
            <Text style={styles.controlText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={handleZoomOut}>
            <Text style={styles.controlText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.controlButton, styles.toggleButton]}
            onPress={() => setShowGeofences(!showGeofences)}
          >
            <Text style={styles.controlText}>🏢</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.controlButton, styles.liveButton]}
            onPress={toggleLiveMode}
          >
            <Text style={styles.controlText}>{isLiveMode ? '⏸️' : '▶️'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderGuardInfo = () => {
    if (!selectedGuard) return null;

    const guard = guardLocations.find(g => g.guardId === selectedGuard);
    if (!guard) return null;
    const nearestBoundary = siteBoundaries
      .map((boundary) => ({
        boundary,
        distanceMeters: calculateDistanceMeters(
          guard.latitude,
          guard.longitude,
          boundary.center.latitude,
          boundary.center.longitude,
        ),
      }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters)[0];
    const isInsideSiteRadius = nearestBoundary
      ? nearestBoundary.distanceMeters <= nearestBoundary.boundary.radius
      : undefined;

    return (
      <View style={styles.guardInfoPanel}>
        <View style={styles.guardInfoHeader}>
          <Text style={styles.guardName}>{guard.guardName}</Text>
          <TouchableOpacity onPress={() => setSelectedGuard(null)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.guardSite}>{guard.siteName || 'Site unknown'}</Text>
        <View style={styles.guardStatus}>
          <View style={[styles.statusDot, { backgroundColor: getGuardStatusColor(guard.status) }]} />
          <Text style={styles.statusText}>{guard.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <Text style={styles.lastUpdate}>Last update: {guard.lastUpdate}</Text>
        <Text style={styles.accuracy}>Accuracy: ±{Math.round(guard.accuracy)}m</Text>
        {nearestBoundary ? (
          <Text
            style={[
              styles.radiusStatus,
              { color: isInsideSiteRadius ? COLORS.success : COLORS.warning },
            ]}
          >
            {isInsideSiteRadius ? 'Inside radius' : 'Outside radius'} ·{' '}
            {Math.round(nearestBoundary.distanceMeters)}m / {nearestBoundary.boundary.radius}m
          </Text>
        ) : null}
        <Text style={styles.coordinates}>
          {guard.latitude.toFixed(5)}, {guard.longitude.toFixed(5)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderMapView()}
      {renderGuardInfo()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundSecondary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.backgroundPrimary,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  selectedMarker: {
    borderColor: COLORS.primary,
    borderWidth: 3,
    transform: [{ scale: 1.2 }],
  },
  markerText: {
    fontSize: 16,
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapTitle: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  siteBoundary: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.primary + '80',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  siteLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textAlign: 'center',
  },
  guardMarker: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.backgroundPrimary,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  liveIndicator: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundPrimary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  liveText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  guardCountText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  mapControls: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md,
    gap: SPACING.xs,
  },
  controlButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  toggleButton: {
    backgroundColor: COLORS.info,
  },
  liveButton: {
    backgroundColor: COLORS.success,
  },
  controlText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  guardInfoPanel: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  guardInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  guardName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  closeButton: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textSecondary,
  },
  guardSite: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  guardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  lastUpdate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  accuracy: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  coordinates: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  radiusStatus: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: SPACING.xs,
  },
});

export default InteractiveMapView;
export type { GuardLocation, SiteBoundary };
