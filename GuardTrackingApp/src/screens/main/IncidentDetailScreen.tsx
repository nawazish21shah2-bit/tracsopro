// Incident Detail Screen
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { updateIncident, updateIncidentStatus } from '../../store/slices/incidentSlice';
import { Incident, IncidentStatus, SeverityLevel } from '../../types';

type IncidentDetailScreenNavigationProp = StackNavigationProp<any, 'IncidentDetail'>;
type IncidentDetailScreenRouteProp = RouteProp<any, 'IncidentDetail'>;

const IncidentDetailScreen: React.FC = () => {
  const navigation = useNavigation<IncidentDetailScreenNavigationProp>();
  const route = useRoute<IncidentDetailScreenRouteProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { incidents, isLoading } = useSelector((state: RootState) => state.incidents);
  const { user } = useSelector((state: RootState) => state.auth);

  const [incident, setIncident] = useState<Incident | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const { incidentId } = route.params;

  useEffect(() => {
    loadIncident();
  }, [incidentId]);

  const loadIncident = () => {
    const foundIncident = incidents.find(inc => inc.id === incidentId);
    if (foundIncident) {
      setIncident(foundIncident);
    } else {
      Alert.alert('Error', 'Incident not found');
      navigation.goBack();
    }
  };

  const handleStatusUpdate = async (newStatus: IncidentStatus) => {
    if (!incident) return;

    Alert.alert(
      'Update Status',
      `Are you sure you want to change the status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setIsUpdating(true);
            try {
              await dispatch(updateIncidentStatus({ incidentId: incident.id, status: newStatus }));
              setIncident({ ...incident, status: newStatus });
            } catch (error) {
              Alert.alert('Error', 'Failed to update incident status');
            }
            setIsUpdating(false);
          },
        },
      ]
    );
  };

  const handleEditIncident = () => {
    Alert.alert('Edit Incident', 'Incident editing functionality will be implemented');
  };

  const handleAddEvidence = () => {
    Alert.alert('Add Evidence', 'Evidence upload functionality will be implemented');
  };

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical': return '#FF4444';
      case 'high': return '#FF8800';
      case 'medium': return '#FFBB33';
      case 'low': return '#00C851';
      default: return '#6C757D';
    }
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'reported': return '#FF8800';
      case 'investigating': return '#007AFF';
      case 'resolved': return '#00C851';
      case 'closed': return '#6C757D';
      default: return '#6C757D';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'security_breach': return '🚨';
      case 'medical_emergency': return '🏥';
      case 'fire_alarm': return '🔥';
      case 'vandalism': return '💥';
      case 'theft': return '💰';
      case 'trespassing': return '🚫';
      case 'equipment_failure': return '⚙️';
      default: return '📋';
    }
  };

  const getStatusActions = () => {
    if (!incident) return [];

    switch (incident.status) {
      case 'reported':
        return [
          { label: 'Start Investigation', status: 'investigating' as IncidentStatus },
          { label: 'Resolve', status: 'resolved' as IncidentStatus },
        ];
      case 'investigating':
        return [
          { label: 'Resolve', status: 'resolved' as IncidentStatus },
          { label: 'Close', status: 'closed' as IncidentStatus },
        ];
      case 'resolved':
        return [
          { label: 'Close', status: 'closed' as IncidentStatus },
        ];
      default:
        return [];
    }
  };

  if (!incident) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Loading incident...</Text>
      </View>
    );
  }

  const statusActions = getStatusActions();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.incidentIcon}>{getTypeIcon(incident.type)}</Text>
          <View style={styles.headerText}>
            <Text style={styles.incidentType}>
              {incident.type.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.incidentId}>ID: {incident.id.slice(-8)}</Text>
          </View>
        </View>
        
        <View style={styles.badgeContainer}>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(incident.severity) }]}>
            <Text style={styles.badgeText}>{incident.severity.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(incident.status) }]}>
            <Text style={styles.badgeText}>{incident.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{incident.description}</Text>
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.locationContainer}>
          <Text style={styles.locationIcon}>📍</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>{incident.location.name}</Text>
            <Text style={styles.locationAddress}>{incident.location.address}</Text>
            <Text style={styles.locationCoordinates}>
              {incident.location.coordinates.latitude.toFixed(6)}, {incident.location.coordinates.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        
        <View style={styles.timelineItem}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTitle}>Incident Reported</Text>
            <Text style={styles.timelineTime}>
              {new Date(incident.reportedAt).toLocaleString()}
            </Text>
          </View>
        </View>

        {incident.status === 'investigating' && (
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Investigation Started</Text>
              <Text style={styles.timelineTime}>
                {new Date().toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {incident.resolvedAt && (
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Incident Resolved</Text>
              <Text style={styles.timelineTime}>
                {new Date(incident.resolvedAt).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Evidence */}
      {incident.evidence && incident.evidence.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evidence ({incident.evidence.length})</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.evidenceContainer}>
              {incident.evidence.map((evidence, index) => (
                <TouchableOpacity key={index} style={styles.evidenceItem}>
                  <Text style={styles.evidenceIcon}>
                    {evidence.type === 'photo' ? '📷' : 
                     evidence.type === 'video' ? '🎥' : 
                     evidence.type === 'audio' ? '🎵' : '📄'}
                  </Text>
                  <Text style={styles.evidenceName} numberOfLines={1}>
                    {evidence.description || `Evidence ${index + 1}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Notes */}
      {incident.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notes}>{incident.notes}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        {statusActions.length > 0 && (
          <View style={styles.statusActions}>
            {statusActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionButton, styles.statusActionButton]}
                onPress={() => handleStatusUpdate(action.status)}
                disabled={isUpdating}
              >
                <Text style={styles.actionButtonText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.generalActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEditIncident}>
            <Text style={styles.actionButtonText}>Edit Incident</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleAddEvidence}>
            <Text style={styles.actionButtonText}>Add Evidence</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  incidentIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  incidentType: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  incidentId: {
    fontSize: 14,
    color: '#666',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationCoordinates: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    marginRight: 16,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 14,
    color: '#666',
  },
  evidenceContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  evidenceItem: {
    width: 80,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  evidenceIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  evidenceName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  notes: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  actionsSection: {
    backgroundColor: '#ffffff',
    marginTop: 1,
    padding: 20,
    marginBottom: 20,
  },
  statusActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  generalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusActionButton: {
    backgroundColor: '#00C851',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default IncidentDetailScreen;
