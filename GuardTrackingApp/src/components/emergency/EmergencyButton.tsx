import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Alert,
  Animated,
  Vibration,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { triggerEmergencyAlert } from '../../store/slices/emergencySlice';
import Geolocation from 'react-native-geolocation-service';
import { AlertTriangle, Phone, Shield, Heart } from 'react-native-feather';

interface EmergencyButtonProps {
  size?: 'small' | 'medium' | 'large';
  style?: any;
  onEmergencyTriggered?: (alertId: string) => void;
}

interface EmergencyType {
  id: 'PANIC' | 'MEDICAL' | 'SECURITY' | 'FIRE' | 'CUSTOM';
  label: string;
  icon: React.ReactNode;
  color: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const EmergencyButton: React.FC<EmergencyButtonProps> = ({
  size = 'large',
  style,
  onEmergencyTriggered,
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { loading } = useSelector((state: RootState) => state.emergency);
  
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const emergencyTypes: EmergencyType[] = [
    {
      id: 'PANIC',
      label: 'Panic Alert',
      icon: <AlertTriangle width={24} height={24} color="#FFF" />,
      color: '#DC2626',
      severity: 'CRITICAL',
    },
    {
      id: 'MEDICAL',
      label: 'Medical Emergency',
      icon: <Heart width={24} height={24} color="#FFF" />,
      color: '#EF4444',
      severity: 'HIGH',
    },
    {
      id: 'SECURITY',
      label: 'Security Breach',
      icon: <Shield width={24} height={24} color="#FFF" />,
      color: '#F59E0B',
      severity: 'HIGH',
    },
    {
      id: 'FIRE',
      label: 'Fire Emergency',
      icon: <AlertTriangle width={24} height={24} color="#FFF" />,
      color: '#DC2626',
      severity: 'CRITICAL',
    },
    {
      id: 'CUSTOM',
      label: 'Other Emergency',
      icon: <Phone width={24} height={24} color="#FFF" />,
      color: '#7C3AED',
      severity: 'MEDIUM',
    },
  ];

  const buttonSizes = {
    small: { width: 60, height: 60, fontSize: 12 },
    medium: { width: 80, height: 80, fontSize: 14 },
    large: { width: 100, height: 100, fontSize: 16 },
  };

  const currentSize = buttonSizes[size];

  // Get current location helper function
  const getCurrentLocation = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            address: `${position.coords.latitude}, ${position.coords.longitude}`,
          });
        },
        (error) => {
          console.error('Location error:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  };

  // Start pulsing animation
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleEmergencyPress = () => {
    // Vibrate to provide haptic feedback
    Vibration.vibrate([0, 100, 50, 100]);
    
    // Show type selector
    setShowTypeSelector(true);
  };

  const handleEmergencyTypeSelect = async (emergencyType: EmergencyType) => {
    try {
      setShowTypeSelector(false);
      
      // Get current location
      const location = await getCurrentLocation();
      
      if (!location) {
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Emergency alert will be sent without location data.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue', onPress: () => sendEmergencyAlert(emergencyType, null) },
          ]
        );
        return;
      }

      // Confirm emergency alert
      Alert.alert(
        `${emergencyType.label}`,
        'Are you sure you want to trigger this emergency alert? This will immediately notify all administrators and emergency contacts.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'SEND ALERT',
            style: 'destructive',
            onPress: () => sendEmergencyAlert(emergencyType, location),
          },
        ]
      );
    } catch (error) {
      console.error('Error handling emergency type selection:', error);
      Alert.alert('Error', 'Failed to process emergency alert. Please try again.');
    }
  };

  const sendEmergencyAlert = async (emergencyType: EmergencyType, location: any) => {
    try {
      const alertData = {
        type: emergencyType.id,
        severity: emergencyType.severity,
        location: location || {
          latitude: 0,
          longitude: 0,
          accuracy: 0,
          address: 'Location unavailable',
        },
        message: `${emergencyType.label} triggered by ${user?.firstName} ${user?.lastName}`,
      };

      // Dispatch emergency alert
      const result = await dispatch(triggerEmergencyAlert(alertData) as any);
      
      if (result.type === 'emergency/triggerAlert/fulfilled') {
        // Success feedback
        Vibration.vibrate([0, 200, 100, 200, 100, 200]);
        
        Alert.alert(
          'Emergency Alert Sent',
          `Your ${emergencyType.label.toLowerCase()} has been sent to all administrators. Help is on the way.`,
          [{ text: 'OK' }]
        );

        // Call callback if provided
        if (onEmergencyTriggered) {
          onEmergencyTriggered(result.payload.id);
        }
      } else {
        throw new Error('Failed to send emergency alert');
      }
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      Alert.alert(
        'Alert Failed',
        'Failed to send emergency alert. Please try again or contact emergency services directly.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderTypeSelector = () => (
    <Modal
      visible={showTypeSelector}
      transparent
      animationType="fade"
      onRequestClose={() => setShowTypeSelector(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowTypeSelector(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.typeSelectorContainer}>
              <Text style={styles.typeSelectorTitle}>Select Emergency Type</Text>
              <Text style={styles.typeSelectorSubtitle}>
                Choose the type of emergency to send appropriate alert
              </Text>
              
              {emergencyTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.typeOption, { borderLeftColor: type.color }]}
                  onPress={() => handleEmergencyTypeSelect(type)}
                  disabled={loading}
                >
                  <View style={[styles.typeIcon, { backgroundColor: type.color }]}>
                    {type.icon}
                  </View>
                  <View style={styles.typeContent}>
                    <Text style={styles.typeLabel}>{type.label}</Text>
                    <Text style={styles.typeSeverity}>Severity: {type.severity}</Text>
                  </View>
                  <View style={styles.typeArrow}>
                    <Text style={styles.arrowText}>→</Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowTypeSelector(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            width: currentSize.width,
            height: currentSize.height,
            transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
          },
          style,
        ]}
      >
        <TouchableOpacity
          style={[
            styles.emergencyButton,
            {
              width: currentSize.width,
              height: currentSize.height,
            },
            isPressed && styles.pressed,
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleEmergencyPress}
          disabled={loading}
          activeOpacity={0.8}
        >
          <AlertTriangle 
            width={currentSize.width * 0.4} 
            height={currentSize.height * 0.4} 
            color="#FFFFFF" 
          />
          <Text style={[styles.buttonText, { fontSize: currentSize.fontSize }]}>
            SOS
          </Text>
        </TouchableOpacity>
      </Animated.View>
      
      {renderTypeSelector()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyButton: {
    backgroundColor: '#DC2626',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  pressed: {
    backgroundColor: '#B91C1C',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  typeSelectorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  typeSelectorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  typeSelectorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  typeContent: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  typeSeverity: {
    fontSize: 12,
    color: '#6B7280',
  },
  typeArrow: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 18,
    color: '#6B7280',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default EmergencyButton;
