/**
 * Admin Incident Review Screen - Phase 4
 * Admin workflow for reviewing and managing incident reports
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import enhancedIncidentService, { EnhancedIncident } from '../../services/enhancedIncidentService';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';

interface IncidentReviewScreenProps {
  navigation: any;
}

const IncidentReviewScreen: React.FC<IncidentReviewScreenProps> = ({ navigation }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [incidents, setIncidents] = useState<EnhancedIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<EnhancedIncident | null>(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'under_review'>('pending');

  useEffect(() => {
    initializeService();
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [filterStatus]);

  const initializeService = async () => {
    try {
      await enhancedIncidentService.initialize();
      loadIncidents();
    } catch (error) {
      console.error('Error initializing incident service:', error);
    }
  };

  const loadIncidents = () => {
    const allIncidents = enhancedIncidentService.getIncidents({
      status: filterStatus === 'all' ? undefined : filterStatus as any,
    });
    setIncidents(allIncidents);
  };

  const handleReviewIncident = (incident: EnhancedIncident) => {
    setSelectedIncident(incident);
    setReviewNotes('');
    setReviewModal(true);
  };

  const handleApproveIncident = async () => {
    if (!selectedIncident) return;

    // In a real implementation, this would update the backend
    Alert.alert('Success', 'Incident approved successfully');
    setReviewModal(false);
    loadIncidents();
  };

  const handleRejectIncident = async () => {
    if (!selectedIncident) return;

    if (!reviewNotes.trim()) {
      Alert.alert('Error', 'Please provide rejection notes');
      return;
    }

    // In a real implementation, this would update the backend
    Alert.alert('Success', 'Incident rejected with notes');
    setReviewModal(false);
    loadIncidents();
  };

  const getSeverityColor = (severity: EnhancedIncident['severity']) => {
    switch (severity) {
      case 'critical': return COLORS.error;
      case 'high': return '#FF8800';
      case 'medium': return COLORS.warning;
      case 'low': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusColor = (status: EnhancedIncident['status']) => {
    switch (status) {
      case 'pending': return COLORS.warning;
      case 'under_review': return COLORS.info;
      case 'approved': return COLORS.success;
      case 'rejected': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const renderIncidentItem = ({ item }: { item: EnhancedIncident }) => (
    <TouchableOpacity 
      style={styles.incidentCard}
      onPress={() => handleReviewIncident(item)}
    >
      <View style={styles.incidentHeader}>
        <Text style={styles.incidentTitle}>{item.title}</Text>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.incidentType}>{item.type.replace('_', ' ').toUpperCase()}</Text>
      <Text style={styles.incidentDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.incidentFooter}>
        <Text style={styles.incidentDate}>
          {new Date(item.reportedAt).toLocaleDateString()}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>
      
      <View style={styles.incidentMeta}>
        <Text style={styles.metaText}>📷 {item.mediaFiles.length} files</Text>
        <Text style={styles.metaText}>🎤 {item.voiceTranscription ? 'Voice' : 'No voice'}</Text>
        <Text style={styles.metaText}>📡 {item.syncStatus}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderReviewModal = () => (
    <Modal
      visible={reviewModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Review Incident</Text>
          <TouchableOpacity onPress={() => setReviewModal(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        
        {selectedIncident && (
          <View style={styles.modalContent}>
            <Text style={styles.detailTitle}>{selectedIncident.title}</Text>
            <Text style={styles.detailType}>
              {selectedIncident.type.replace('_', ' ')} - {selectedIncident.severity}
            </Text>
            <Text style={styles.detailDescription}>{selectedIncident.description}</Text>
            
            {selectedIncident.voiceTranscription && (
              <View style={styles.voiceSection}>
                <Text style={styles.voiceTitle}>Voice Transcription:</Text>
                <Text style={styles.voiceText}>{selectedIncident.voiceTranscription}</Text>
              </View>
            )}
            
            <View style={styles.mediaSection}>
              <Text style={styles.mediaTitle}>Media Files: {selectedIncident.mediaFiles.length}</Text>
            </View>
            
            <TextInput
              style={styles.reviewInput}
              placeholder="Add review notes..."
              value={reviewNotes}
              onChangeText={setReviewNotes}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.reviewActions}>
              <TouchableOpacity 
                style={[styles.reviewButton, styles.approveButton]}
                onPress={handleApproveIncident}
              >
                <Text style={styles.reviewButtonText}>✓ Approve</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.reviewButton, styles.rejectButton]}
                onPress={handleRejectIncident}
              >
                <Text style={styles.reviewButtonText}>✗ Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incident Review</Text>
        <View style={styles.filterContainer}>
          {['all', 'pending', 'under_review'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus(status as any)}
            >
              <Text style={[
                styles.filterText,
                filterStatus === status && styles.filterTextActive
              ]}>
                {status.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <FlatList
        data={incidents}
        renderItem={renderIncidentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      {renderReviewModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundPrimary,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  filterTextActive: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  listContainer: {
    padding: SPACING.md,
  },
  incidentCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  incidentTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  severityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  severityText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  incidentType: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  incidentDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  incidentDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textTransform: 'capitalize',
  },
  incidentMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  metaText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  closeButton: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.textSecondary,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.md,
  },
  detailTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  detailType: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'capitalize',
  },
  detailDescription: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  voiceSection: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  voiceTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  voiceText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  mediaSection: {
    marginBottom: SPACING.md,
  },
  mediaTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  reviewInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  reviewButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  reviewButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
  },
});

export default IncidentReviewScreen;
