/**
 * Interactive Map View - Phase 5
 * Real-time guard location display with site boundaries and geofencing
 */

import React, { useState, useEffect, useRef } from 'react';
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
  LatLng,
  MapPressEvent,
} from 'react-native-maps';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import WebSocketService from '../../services/WebSocketService';
import locationTrackingService from '../../services/locationTrackingService';
import { ErrorHandler } from '../../utils/errorHandler';

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

interface InteractiveMapViewProps {
  height?: number;
  showControls?: boolean;
  onGuardSelect?: (guardId: string) => void;
  guardData?: Array<{
    guardId: string;
    guardName: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    status: 'active' | 'on_break' | 'offline' | 'emergency';
    siteName?: string;
  }>;
}

const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({
  height = 300,
  showControls = true,
  onGuardSelect,
  guardData,
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { sites } = useSelector((state: RootState) => state.client);
  
  const [guardLocations, setGuardLocations] = useState<GuardLocation[]>([]);
  const [siteBoundaries, setSiteBoundaries] = useState<SiteBoundary[]>([]);
  const [selectedGuard, setSelectedGuard] = useState<string | null>(null);
  const [showGeofences, setShowGeofences] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const mapRef = useRef<MapView>(null);
  const mapUpdateInterval = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initializeMap();
    startLiveUpdates();

    return () => {
      stopLiveUpdates();
    };
  }, []);

  // Update guard locations when guardData prop changes
  useEffect(() => {
    if (guardData && guardData.length > 0) {
      const guardLocations: GuardLocation[] = guardData.map(guard => ({
        guardId: guard.guardId,
        guardName: guard.guardName,
        latitude: guard.latitude,
        longitude: guard.longitude,
        accuracy: guard.accuracy,
        timestamp: Date.now(),
        status: guard.status,
        siteName: guard.siteName,
        lastUpdate: 'Just now',
      }));
      setGuardLocations(guardLocations);
    }
  }, [guardData]);

  const initializeMap = async () => {
    try {
      // Load initial guard locations
      await loadGuardLocations();
      
      // Load site boundaries
      await loadSiteBoundaries();
      
      // Center map on first guard or site
      if (guardLocations.length > 0) {
        const firstGuard = guardLocations[0];
        setMapRegion({
          latitude: firstGuard.latitude,
          longitude: firstGuard.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else if (siteBoundaries.length > 0) {
        const firstSite = siteBoundaries[0];
        setMapRegion({
          latitude: firstSite.center.latitude,
          longitude: firstSite.center.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }

      console.log('📍 Interactive map initialized');
    } catch (error) {
      ErrorHandler.handleError(error, 'initialize_map');
    }
  };

  const loadGuardLocations = async () => {
    try {
      // If guard data is provided as prop, use it
      if (guardData && guardData.length > 0) {
        const guardLocations: GuardLocation[] = guardData.map(guard => ({
          guardId: guard.guardId,
          guardName: guard.guardName,
          latitude: guard.latitude,
          longitude: guard.longitude,
          accuracy: guard.accuracy,
          timestamp: Date.now(),
          status: guard.status,
          siteName: guard.siteName,
          lastUpdate: 'Just now',
        }));
        setGuardLocations(guardLocations);
        return;
      }

      // Otherwise, load from API or use mock data
      const mockGuardLocations: GuardLocation[] = [
        {
          guardId: 'guard_1',
          guardName: 'John Smith',
          latitude: 40.7589,
          longitude: -73.9851,
          accuracy: 5,
          timestamp: Date.now(),
          status: 'active',
          siteName: 'Central Office',
          lastUpdate: '2 min ago',
        },
        {
          guardId: 'guard_2',
          guardName: 'Sarah Johnson',
          latitude: 40.7505,
          longitude: -73.9934,
          accuracy: 8,
          timestamp: Date.now() - 300000, // 5 minutes ago
          status: 'on_break',
          siteName: 'Warehouse A',
          lastUpdate: '5 min ago',
        },
        {
          guardId: 'guard_3',
          guardName: 'Mike Wilson',
          latitude: 40.7614,
          longitude: -73.9776,
          accuracy: 12,
          timestamp: Date.now() - 120000, // 2 minutes ago
          status: 'active',
          siteName: 'Retail Store',
          lastUpdate: '2 min ago',
        },
      ];

      setGuardLocations(mockGuardLocations);
    } catch (error) {
      ErrorHandler.handleError(error, 'load_guard_locations', false);
    }
  };

  const loadSiteBoundaries = async () => {
    try {
      // Simulate loading site boundaries
      const mockSiteBoundaries: SiteBoundary[] = [
        {
          siteId: 'site_1',
          siteName: 'Central Office Building',
          center: { latitude: 40.7589, longitude: -73.9851 },
          radius: 100,
          coordinates: [
            { latitude: 40.7594, longitude: -73.9856 },
            { latitude: 40.7594, longitude: -73.9846 },
            { latitude: 40.7584, longitude: -73.9846 },
            { latitude: 40.7584, longitude: -73.9856 },
          ],
          isActive: true,
        },
        {
          siteId: 'site_2',
          siteName: 'Warehouse Distribution Center',
          center: { latitude: 40.7505, longitude: -73.9934 },
          radius: 150,
          coordinates: [
            { latitude: 40.7512, longitude: -73.9942 },
            { latitude: 40.7512, longitude: -73.9926 },
            { latitude: 40.7498, longitude: -73.9926 },
            { latitude: 40.7498, longitude: -73.9942 },
          ],
          isActive: true,
        },
        {
          siteId: 'site_3',
          siteName: 'Retail Shopping Plaza',
          center: { latitude: 40.7614, longitude: -73.9776 },
          radius: 120,
          coordinates: [
            { latitude: 40.7620, longitude: -73.9782 },
            { latitude: 40.7620, longitude: -73.9770 },
            { latitude: 40.7608, longitude: -73.9770 },
            { latitude: 40.7608, longitude: -73.9782 },
          ],
          isActive: true,
        },
      ];

      setSiteBoundaries(mockSiteBoundaries);
    } catch (error) {
      ErrorHandler.handleError(error, 'load_site_boundaries', false);
    }
  };

  const startLiveUpdates = () => {
    if (mapUpdateInterval.current) {
      clearInterval(mapUpdateInterval.current);
    }

    mapUpdateInterval.current = setInterval(() => {
      if (isLiveMode) {
        updateGuardLocations();
      }
    }, 30000); // Update every 30 seconds
  };

  const stopLiveUpdates = () => {
    if (mapUpdateInterval.current) {
      clearInterval(mapUpdateInterval.current);
      mapUpdateInterval.current = null;
    }
  };

  const updateGuardLocations = async () => {
    try {
      // Simulate real-time location updates
      setGuardLocations(prev => prev.map(guard => ({
        ...guard,
        // Simulate small location changes
        latitude: guard.latitude + (Math.random() - 0.5) * 0.001,
        longitude: guard.longitude + (Math.random() - 0.5) * 0.001,
        timestamp: Date.now(),
        lastUpdate: 'Just now',
      })));
    } catch (error) {
      ErrorHandler.handleError(error, 'update_guard_locations', false);
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
    setIsLiveMode(prev => !prev);
    if (!isLiveMode) {
      startLiveUpdates();
    } else {
      stopLiveUpdates();
    }
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
          <Marker
            key={guard.guardId}
            coordinate={{
              latitude: guard.latitude,
              longitude: guard.longitude,
            }}
            title={guard.guardName}
            description={`Status: ${guard.status} | Site: ${guard.siteName}`}
            onPress={() => handleGuardPress(guard.guardId)}
          >
            <View style={[
              styles.customMarker,
              { backgroundColor: getGuardStatusColor(guard.status) },
              selectedGuard === guard.guardId && styles.selectedMarker,
            ]}>
              <Text style={styles.markerText}>👤</Text>
            </View>
          </Marker>
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
        <View style={[styles.liveDot, { backgroundColor: isLiveMode ? COLORS.success : COLORS.error }]} />
        <Text style={styles.liveText}>{isLiveMode ? 'LIVE' : 'PAUSED'}</Text>
      </View>

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

    return (
      <View style={styles.guardInfoPanel}>
        <View style={styles.guardInfoHeader}>
          <Text style={styles.guardName}>{guard.guardName}</Text>
          <TouchableOpacity onPress={() => setSelectedGuard(null)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.guardSite}>{guard.siteName}</Text>
        <View style={styles.guardStatus}>
          <View style={[styles.statusDot, { backgroundColor: getGuardStatusColor(guard.status) }]} />
          <Text style={styles.statusText}>{guard.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <Text style={styles.lastUpdate}>Last update: {guard.lastUpdate}</Text>
        <Text style={styles.accuracy}>Accuracy: ±{guard.accuracy}m</Text>
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
});

export default InteractiveMapView;
export type { GuardLocation, SiteBoundary };
