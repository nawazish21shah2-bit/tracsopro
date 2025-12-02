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
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import apiService from '../../services/api';
import { LoadingOverlay, ErrorState, NetworkError } from '../../components/ui/LoadingStates';
import { RefreshControl } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import AdminProfileDrawer from '../../components/admin/AdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { ReportsIcon, EmergencyIcon, CheckCircleIcon } from '../../components/ui/AppIcons';
import { CameraIcon, MicIcon, CloudIcon } from '../../components/ui/FeatherIcons';

interface IncidentReviewScreenProps {
  navigation: any;
}

const IncidentReviewScreen: React.FC<IncidentReviewScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logoutUser()).unwrap();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };
  interface IncidentReport {
    id: string;
    title: string;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    status: 'pending' | 'under_review' | 'approved' | 'rejected';
    reportedAt: string;
    mediaFiles: any[];
    voiceTranscription?: string;
    syncStatus?: string;
    guard?: {
      user?: {
        firstName?: string;
        lastName?: string;
        email?: string;
      };
    };
  }

  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'under_review'>('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, [filterStatus]);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getAllIncidentReports({
        page: 1,
        limit: 100,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load incident reports');
      }

      const backendReports = response.data.reports || [];
      
      // Transform backend reports to match UI format
      const transformedReports: IncidentReport[] = backendReports.map((report: any) => {
        // Map reportType to a title
        const title = report.reportType 
          ? report.reportType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
          : 'Incident Report';
        
        // Map status
        let status: IncidentReport['status'] = 'pending';
        if (report.status === 'APPROVED') status = 'approved';
        else if (report.status === 'REJECTED') status = 'rejected';
        else if (report.status === 'UNDER_REVIEW') status = 'under_review';
        else status = 'pending';

        // Map severity (default to medium if not provided)
        let severity: IncidentReport['severity'] = 'medium';
        if (report.severity) {
          const sev = report.severity.toLowerCase();
          if (sev === 'critical' || sev === 'high' || sev === 'medium' || sev === 'low') {
            severity = sev as IncidentReport['severity'];
          }
        }

        return {
          id: report.id,
          title,
          type: report.reportType || 'incident',
          severity,
          description: report.description || '',
          status,
          reportedAt: report.submittedAt || report.createdAt || new Date().toISOString(),
          mediaFiles: report.media || [],
          voiceTranscription: report.voiceTranscription,
          syncStatus: 'synced',
          guard: report.guard,
        };
      });

      // Filter by status
      let filtered = transformedReports;
      if (filterStatus !== 'all') {
        filtered = transformedReports.filter(r => r.status === filterStatus);
      }

      setIncidents(filtered);
    } catch (error: any) {
      console.error('Error loading incident reports:', error);
      const errorMessage = error.message || 'Failed to load incident reports';
      setError(errorMessage);
      if (!refreshing) {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIncidents();
  };

  const handleReviewIncident = (incident: IncidentReport) => {
    setSelectedIncident(incident);
    setReviewNotes('');
    setReviewModal(true);
  };

  const handleApproveIncident = async () => {
    if (!selectedIncident) return;

    try {
      const response = await apiService.updateIncidentReport(selectedIncident.id, {
        status: 'APPROVED',
        reviewNotes: reviewNotes.trim() || undefined,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to approve incident');
      }

      Alert.alert('Success', 'Incident approved successfully');
      setReviewModal(false);
      setReviewNotes('');
      await loadIncidents();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to approve incident');
    }
  };

  const handleRejectIncident = async () => {
    if (!selectedIncident) return;

    if (!reviewNotes.trim()) {
      Alert.alert('Error', 'Please provide rejection notes');
      return;
    }

    try {
      const response = await apiService.updateIncidentReport(selectedIncident.id, {
        status: 'REJECTED',
        reviewNotes: reviewNotes.trim(),
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to reject incident');
      }

      Alert.alert('Success', 'Incident rejected with notes');
      setReviewModal(false);
      setReviewNotes('');
      await loadIncidents();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject incident');
    }
  };

  const getSeverityColor = (severity: IncidentReport['severity']) => {
    switch (severity) {
      case 'critical': return '#DC2626'; // Red
      case 'high': return '#F59E0B'; // Orange
      case 'medium': return '#F59E0B'; // Orange
      case 'low': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusColor = (status: IncidentReport['status']) => {
    switch (status) {
      case 'pending': return '#F59E0B'; // Orange
      case 'under_review': return COLORS.primary; // Blue
      case 'approved': return COLORS.success; // Green
      case 'rejected': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusLabel = (status: IncidentReport['status']) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'under_review': return 'Under Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const renderIncidentItem = ({ item }: { item: IncidentReport }) => (
    <TouchableOpacity 
      style={styles.incidentCard}
      onPress={() => handleReviewIncident(item)}
      activeOpacity={0.7}
    >
      <View style={styles.incidentHeader}>
        <Text style={styles.incidentTitle} numberOfLines={2}>{item.title}</Text>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.incidentType}>{item.type.replace('_', ' ').toUpperCase()}</Text>
      <Text style={styles.incidentDescription} numberOfLines={3}>
        {item.description}
      </Text>
      
      <View style={styles.incidentFooter}>
        <Text style={styles.incidentDate}>
          {new Date(item.reportedAt).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
          })}
        </Text>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: getStatusColor(item.status) }]}
          onPress={(e) => {
            e.stopPropagation();
            handleReviewIncident(item);
          }}
        >
          <Text style={styles.actionButtonText}>{getStatusLabel(item.status)}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.incidentMeta}>
        <View style={styles.metaItem}>
          <View style={styles.metaIcon}>
            <CameraIcon size={16} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.metaText}>{item.mediaFiles.length} files</Text>
        </View>
        <View style={styles.metaItem}>
          <View style={styles.metaIcon}>
            <MicIcon size={16} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.metaText}>{item.voiceTranscription ? 'Voice' : 'No voice'}</Text>
        </View>
        <View style={styles.metaItem}>
          <View style={styles.metaIcon}>
            <CloudIcon size={16} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.metaText}>{item.syncStatus}</Text>
        </View>
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
    <SafeAreaWrapper>
      <SharedHeader
        variant="admin"
        title="Incident Review"
        showLogo={false}
        onMenuPress={openDrawer}
        profileDrawer={
          <AdminProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToIncidentReview={() => {
              closeDrawer();
            }}
          />
        }
      />
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'All', icon: ReportsIcon, inactiveColor: '#7A7A7A' },
          { key: 'pending', label: 'Pending', icon: EmergencyIcon, inactiveColor: '#DC2626' },
          { key: 'under_review', label: 'Under Review', icon: CheckCircleIcon, inactiveColor: '#16A34A' },
        ].map((status) => {
          const isActive = filterStatus === status.key;
          const IconComponent = status.icon;
          const iconColor = isActive ? COLORS.textInverse : status.inactiveColor;
          const textColor = isActive ? COLORS.textInverse : status.inactiveColor;
          return (
            <TouchableOpacity
              key={status.key}
              style={[
                styles.filterButton,
                isActive && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus(status.key as any)}
            >
              <View style={styles.filterIcon}>
                <IconComponent size={16} color={iconColor} />
              </View>
              <Text style={[
                styles.filterText,
                isActive ? styles.filterTextActive : { color: textColor }
              ]}>
                {status.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {loading && !incidents.length ? (
        <LoadingOverlay visible={true} message="Loading incident reports..." />
      ) : error && !incidents.length ? (
        <View style={styles.errorContainer}>
          {error.toLowerCase().includes('network') || 
           error.toLowerCase().includes('timeout') ||
           error.toLowerCase().includes('connection') ? (
            <NetworkError onRetry={loadIncidents} />
          ) : (
            <ErrorState error={error} onRetry={loadIncidents} />
          )}
        </View>
      ) : (
        <FlatList
          data={incidents}
          renderItem={renderIncidentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No incident reports found</Text>
            </View>
          }
        />
      )}
      
      {loading && incidents.length > 0 && <LoadingOverlay visible={true} message="Refreshing..." />}
      
      {renderReviewModal()}
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundPrimary,
    gap: SPACING.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: '#ECECEC',
    gap: SPACING.xs,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  filterTextActive: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  list: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  listContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  incidentCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  incidentTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.md,
    lineHeight: 20,
  },
  severityBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.round,
  },
  severityText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  incidentType: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  incidentDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  incidentDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  actionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  incidentMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaIcon: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: SPACING.lg,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default IncidentReviewScreen;
