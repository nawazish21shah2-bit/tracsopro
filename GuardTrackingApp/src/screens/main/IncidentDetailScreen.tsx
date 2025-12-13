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
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

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
      case 'critical': return COLORS.error;
      case 'high': return COLORS.warning;
      case 'medium': return COLORS.warning;
      case 'low': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'reported': return COLORS.warning;
      case 'investigating': return COLORS.primary;
      case 'resolved': return COLORS.success;
      case 'closed': return COLORS.textSecondary;
      default: return COLORS.textSecondary;
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
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    backgroundColor: COLORS.backgroundPrimary,
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  incidentIcon: {
    fontSize: 32,
    marginRight: SPACING.lg,
  },
  headerText: {
    flex: 1,
  },
  incidentType: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  incidentId: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  severityBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.lg,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.lg,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  section: {
    backgroundColor: COLORS.backgroundPrimary,
    marginTop: 1,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
    marginTop: 2,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  locationAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  locationCoordinates: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    fontFamily: 'monospace',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.lg,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  timelineTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  evidenceContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  evidenceItem: {
    width: 80,
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.sm,
  },
  evidenceIcon: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    marginBottom: SPACING.sm,
  },
  evidenceName: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  notes: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  actionsSection: {
    backgroundColor: COLORS.backgroundPrimary,
    marginTop: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  statusActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  generalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statusActionButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.xxxxl,
  },
});

export default IncidentDetailScreen;
