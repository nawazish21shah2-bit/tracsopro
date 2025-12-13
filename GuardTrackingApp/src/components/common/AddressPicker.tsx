import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT, Region, LatLng, MapPressEvent } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { MapPin, X, ExternalLink, Plus, Minus, Navigation, Layers } from 'react-native-feather';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../styles/globalStyles';

interface AddressPickerProps {
  value: string;
  onChange: (address: string, coordinates?: { latitude: number; longitude: number }) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  onCityChange?: (city: string) => void;
  onStateChange?: (state: string) => void;
  onZipChange?: (zip: string) => void;
}

const AddressPicker: React.FC<AddressPickerProps> = ({
  value,
  onChange,
  placeholder = 'Enter address',
  label = 'Address',
  required = false,
  onCityChange,
  onStateChange,
  onZipChange,
}) => {
  const [showMap, setShowMap] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedCoordinate, setSelectedCoordinate] = useState<LatLng | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const mapRef = useRef<MapView>(null);

  // Simple geocoding using reverse geocoding (you can integrate Google Places API for better results)
  const geocodeAddress = async (coordinate: LatLng): Promise<string> => {
    try {
      setIsGeocoding(true);
      // Using a simple reverse geocoding service
      // In production, use Google Places API or similar
      // Note: Nominatim requires a User-Agent header
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinate.latitude}&lon=${coordinate.longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'GuardTrackingApp/1.0',
          },
        }
      );

      // Check if response is successful
      if (!response.ok) {
        throw new Error(`Geocoding API returned status ${response.status}`);
      }

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON but received ${contentType}. Response: ${text.substring(0, 100)}`);
      }

      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        const addressParts = [];
        
        if (addr.road) addressParts.push(addr.road);
        if (addr.house_number) addressParts.push(addr.house_number);
        const streetAddress = addressParts.join(' ');
        
        const fullAddress = [
          streetAddress,
          addr.city || addr.town || addr.village,
          addr.state,
          addr.postcode,
        ].filter(Boolean).join(', ');

        // Update city, state, zip if callbacks provided
        if (onCityChange) onCityChange(addr.city || addr.town || addr.village || '');
        if (onStateChange) onStateChange(addr.state || '');
        if (onZipChange) onZipChange(addr.postcode || '');

        return fullAddress;
      }
      return `${coordinate.latitude}, ${coordinate.longitude}`;
    } catch (error) {
      // Log error in development only
      if (__DEV__) {
        console.error('Geocoding error:', error);
      }
      return `${coordinate.latitude}, ${coordinate.longitude}`;
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleMapPress = async (event: MapPressEvent) => {
    const coordinate = event.nativeEvent.coordinate;
    setSelectedCoordinate(coordinate);
    
    // Geocode the selected location
    const address = await geocodeAddress(coordinate);
    onChange(address, coordinate);
    
    // Update map region to center on selected location
    setMapRegion({
      ...coordinate,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const handleConfirmLocation = async () => {
    if (selectedCoordinate) {
      const address = await geocodeAddress(selectedCoordinate);
      onChange(address, selectedCoordinate);
      setShowMap(false);
    } else {
      Alert.alert('No Location Selected', 'Please tap on the map to select a location');
    }
  };

  const handleUseCurrentLocation = () => {
    // Get current location and set it
    Geolocation.getCurrentPosition(
      async (position) => {
        const coordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setSelectedCoordinate(coordinate);
        const address = await geocodeAddress(coordinate);
        onChange(address, coordinate);
        setMapRegion({
          ...coordinate,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...coordinate,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }
      },
      (error) => {
        Alert.alert('Location Error', 'Unable to get current location. Please enable location services.');
        if (__DEV__) {
          console.error('Location error:', error);
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleOpenGoogleMaps = async () => {
    try {
      const lat = mapRegion.latitude;
      const lon = mapRegion.longitude;
      let url = '';

      if (Platform.OS === 'ios') {
        // Try to open Google Maps app first, fallback to Apple Maps
        const googleMapsUrl = `comgooglemaps://?center=${lat},${lon}&zoom=14&views=map`;
        const appleMapsUrl = `maps://?ll=${lat},${lon}&q=${lat},${lon}`;
        
        const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
        if (canOpenGoogleMaps) {
          url = googleMapsUrl;
        } else {
          url = appleMapsUrl;
        }
      } else {
        // Android - use Google Maps
        url = `geo:${lat},${lon}?q=${lat},${lon}`;
      }

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to web version
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Unable to open maps. Please make sure you have a maps app installed.',
        [{ text: 'OK' }]
      );
      if (__DEV__) {
        console.error('Error opening maps:', error);
      }
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      const newRegion = {
        ...mapRegion,
        latitudeDelta: mapRegion.latitudeDelta * 0.5,
        longitudeDelta: mapRegion.longitudeDelta * 0.5,
      };
      mapRef.current.animateToRegion(newRegion, 300);
      setMapRegion(newRegion);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const newRegion = {
        ...mapRegion,
        latitudeDelta: Math.min(mapRegion.latitudeDelta * 2, 180),
        longitudeDelta: Math.min(mapRegion.longitudeDelta * 2, 360),
      };
      mapRef.current.animateToRegion(newRegion, 300);
      setMapRegion(newRegion);
    }
  };

  const handleCenterOnLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const coordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        const newRegion = {
          ...coordinate,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
          setMapRegion(newRegion);
        }
      },
      (error) => {
        Alert.alert('Location Error', 'Unable to get current location. Please enable location services.');
        if (__DEV__) {
          console.error('Location error:', error);
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleToggleMapType = () => {
    const mapTypes: Array<'standard' | 'satellite' | 'hybrid'> = ['standard', 'satellite', 'hybrid'];
    const currentIndex = mapTypes.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % mapTypes.length;
    setMapType(mapTypes[nextIndex]);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline
        />
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => setShowMap(true)}
        >
          <MapPin size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showMap}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMap(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Location on Map</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMap(false)}
            >
              <X size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
              onPress={handleMapPress}
              showsUserLocation={true}
              showsMyLocationButton={false}
              mapType={mapType}
            >
              {selectedCoordinate && (
                <Marker
                  coordinate={selectedCoordinate}
                  title="Selected Location"
                  pinColor={COLORS.primary}
                />
              )}
            </MapView>
            
            {/* Map Control Buttons */}
            <View style={styles.mapControls}>
              <TouchableOpacity
                style={[styles.mapControlButton, styles.mapControlButtonWithBorder]}
                onPress={handleZoomIn}
                activeOpacity={0.7}
              >
                <Plus size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.mapControlButton, styles.mapControlButtonWithBorder]}
                onPress={handleZoomOut}
                activeOpacity={0.7}
              >
                <Minus size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.mapControlButton, styles.mapControlButtonWithBorder]}
                onPress={handleCenterOnLocation}
                activeOpacity={0.7}
              >
                <Navigation size={20} color={COLORS.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.mapControlButton}
                onPress={handleToggleMapType}
                activeOpacity={0.7}
              >
                <Layers size={20} color={COLORS.textPrimary} />
                {mapType !== 'standard' && (
                  <View style={styles.mapTypeIndicator}>
                    <Text style={styles.mapTypeIndicatorText}>
                      {mapType === 'satellite' ? 'S' : 'H'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            
            {isGeocoding && (
              <View style={styles.geocodingOverlay}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.geocodingText}>Getting address...</Text>
              </View>
            )}
          </View>

          <View style={styles.modalFooter}>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleUseCurrentLocation}
              >
                <MapPin size={18} color={COLORS.primary} />
                <Text style={styles.actionButtonText}>Current Location</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleOpenGoogleMaps}
              >
                <ExternalLink size={18} color={COLORS.primary} />
                <Text style={styles.actionButtonText}>Open Google Maps</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowMap(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirmLocation}
                disabled={!selectedCoordinate}
              >
                <Text style={styles.confirmButtonText}>Confirm Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  required: {
    color: COLORS.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    minHeight: 44,
  },
  mapButton: {
    padding: SPACING.sm,
    marginRight: SPACING.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundPrimary,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  geocodingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  geocodingText: {
    marginTop: SPACING.sm,
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  mapControls: {
    position: 'absolute',
    right: SPACING.md,
    top: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  mapControlButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundPrimary,
    position: 'relative',
  },
  mapControlButtonWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  mapTypeIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapTypeIndicatorText: {
    fontSize: 8,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  modalFooter: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundPrimary,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
  },
  actionButtonText: {
    marginLeft: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  button: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: '#FFFFFF',
  },
});

export default AddressPicker;

