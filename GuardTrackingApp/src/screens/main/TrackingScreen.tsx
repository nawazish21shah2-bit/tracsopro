// Location Tracking Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { setTracking, addTrackingData, fetchTrackingHistory } from '../../store/slices/locationSlice';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

const TrackingScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isTracking, trackingData, isLoading } = useSelector((state: RootState) => state.locations);
  const { user } = useSelector((state: RootState) => state.auth);

  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    requestLocationPermission();
    loadTrackingHistory();
  }, []);

  useEffect(() => {
    let watchId: number | null = null;

    if (isTracking) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking]);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to track your patrol route.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Location permission is required for tracking.');
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const startLocationTracking = () => {
    const watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newLocation = { latitude, longitude, accuracy };
        
        setCurrentLocation(newLocation);
        
        // Add to tracking data
        const trackingPoint = {
          id: Date.now().toString(),
          guardId: user?.id || '',
          coordinates: newLocation,
          timestamp: new Date(),
          batteryLevel,
          isOnline,
          accuracy,
        };
        
        dispatch(addTrackingData(trackingPoint));
        
        // Send to server (in real implementation)
        // dispatch(sendLocationUpdate({
        //   guardId: user?.id || '',
        //   coordinates: newLocation,
        //   accuracy,
        //   batteryLevel,
        // }));
      },
      (error) => {
        console.error('Location error:', error);
        Alert.alert('Location Error', 'Unable to get your location. Please check your GPS settings.');
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: 5000, // Update every 5 seconds
        fastestInterval: 2000,
      }
    );
  };

  const stopLocationTracking = () => {
    Geolocation.stopObserving();
  };

  const loadTrackingHistory = async () => {
    if (user?.id) {
      try {
        await dispatch(fetchTrackingHistory({
          guardId: user.id,
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          endDate: new Date(),
        }));
      } catch (error) {
        console.error('Error loading tracking history:', error);
      }
    }
  };

  const toggleTracking = async () => {
    if (!isTracking) {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        dispatch(setTracking(true));
      }
    } else {
      Alert.alert(
        'Stop Tracking',
        'Are you sure you want to stop location tracking?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Stop', onPress: () => dispatch(setTracking(false)) },
        ]
      );
    }
  };

  const getTrackingStatus = () => {
    if (isTracking) {
      return {
        status: 'Active',
        color: '#00C851',
        icon: '🟢',
      };
    } else {
      return {
        status: 'Inactive',
        color: '#FF4444',
        icon: '🔴',
      };
    }
  };

  const getBatteryStatus = () => {
    if (batteryLevel > 50) return '#00C851';
    if (batteryLevel > 20) return '#FF8800';
    return '#FF4444';
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const calculateTotalDistance = () => {
    if (trackingData.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < trackingData.length; i++) {
      const prev = trackingData[i - 1];
      const curr = trackingData[i];
      
      const distance = calculateDistance(
        prev.coordinates.latitude,
        prev.coordinates.longitude,
        curr.coordinates.latitude,
        curr.coordinates.longitude
      );
      
      totalDistance += distance;
    }
    
    return totalDistance;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const status = getTrackingStatus();
  const totalDistance = calculateTotalDistance();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Location Tracking</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusIcon}>{status.icon}</Text>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.status}
          </Text>
        </View>
      </View>

      {/* Current Location */}
      {currentLocation && (
        <View style={styles.locationCard}>
          <Text style={styles.cardTitle}>Current Location</Text>
          <View style={styles.locationInfo}>
            <View style={styles.coordinateRow}>
              <Text style={styles.coordinateLabel}>Latitude:</Text>
              <Text style={styles.coordinateValue}>
                {currentLocation.latitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.coordinateRow}>
              <Text style={styles.coordinateLabel}>Longitude:</Text>
              <Text style={styles.coordinateValue}>
                {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.coordinateRow}>
              <Text style={styles.coordinateLabel}>Accuracy:</Text>
              <Text style={styles.coordinateValue}>
                ±{Math.round(currentLocation.accuracy)}m
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Tracking Controls */}
      <View style={styles.controlsCard}>
        <Text style={styles.cardTitle}>Tracking Controls</Text>
        
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Location Tracking</Text>
          <Switch
            value={isTracking}
            onValueChange={toggleTracking}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isTracking ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={[styles.trackingButton, isTracking && styles.trackingButtonActive]}
          onPress={toggleTracking}
          disabled={isLoading}
        >
          <Text style={[styles.trackingButtonText, isTracking && styles.trackingButtonTextActive]}>
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>Tracking Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{trackingData.length}</Text>
            <Text style={styles.statLabel}>Data Points</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{formatDistance(totalDistance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: getBatteryStatus() }]}>
              {batteryLevel}%
            </Text>
            <Text style={styles.statLabel}>Battery</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: isOnline ? '#00C851' : '#FF4444' }]}>
              {isOnline ? 'ON' : 'OFF'}
            </Text>
            <Text style={styles.statLabel}>Online</Text>
          </View>
        </View>
      </View>

      {/* Recent Tracking Data */}
      <View style={styles.historyCard}>
        <Text style={styles.cardTitle}>Recent Tracking Data</Text>
        
        {trackingData.length > 0 ? (
          trackingData.slice(-5).reverse().map((point, index) => (
            <View key={point.id} style={styles.trackingPoint}>
              <View style={styles.pointInfo}>
                <Text style={styles.pointTime}>
                  {new Date(point.timestamp).toLocaleTimeString()}
                </Text>
                <Text style={styles.pointCoordinates}>
                  {point.coordinates.latitude.toFixed(4)}, {point.coordinates.longitude.toFixed(4)}
                </Text>
              </View>
              <View style={styles.pointStatus}>
                <Text style={[styles.pointAccuracy, { color: point.accuracy < 10 ? '#00C851' : '#FF8800' }]}>
                  ±{Math.round(point.accuracy)}m
                </Text>
                <Text style={[styles.pointBattery, { color: getBatteryStatus() }]}>
                  {point.batteryLevel}%
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No tracking data available</Text>
            <Text style={styles.emptyStateSubtext}>Start tracking to see your location data</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  locationInfo: {
    gap: 8,
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordinateLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  coordinateValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  controlsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  trackingButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  trackingButtonActive: {
    backgroundColor: '#FF4444',
  },
  trackingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  trackingButtonTextActive: {
    color: '#ffffff',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trackingPoint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pointInfo: {
    flex: 1,
  },
  pointTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  pointCoordinates: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  pointStatus: {
    alignItems: 'flex-end',
  },
  pointAccuracy: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  pointBattery: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#CCC',
  },
});

export default TrackingScreen;
