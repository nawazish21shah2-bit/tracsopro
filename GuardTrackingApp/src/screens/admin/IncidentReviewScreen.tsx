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
import { useNotificationBell } from '../../hooks/useNotificationBell';
import { ReportsIcon, EmergencyIcon, CheckCircleIcon } from '../../components/ui/AppIcons';
import { CameraIcon, MicIcon, CloudIcon } from '../../components/ui/FeatherIcons';
import SegmentTabs from '../../components/shifts/SegmentTabs';
import { getReportSourceLabel, getReportTypeLabel } from '../../utils/reportUtils';

interface IncidentReviewScreenProps {
  navigation: any;
}

type ReportSourceFilter = 'all' | 'incident' | 'shift';

interface ReviewItem {
  id: string;
  source: 'incident' | 'shift';
  title: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'submitted';
  reportedAt: string;
  guardName?: string;
  siteName?: string;
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

const IncidentReviewScreen: React.FC<IncidentReviewScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const { onNotificationPress, notificationCount } = useNotificationBell({
    notificationsRoute: 'AdminNotifications',
  });

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
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'under_review'>('pending');
  const [sourceFilter, setSourceFilter] = useState<ReportSourceFilter>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReports();
  }, [filterStatus, sourceFilter]);

  const transformIncidentReport = (report: any): ReviewItem => {
    const title = report.reportType
      ? report.reportType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
      : 'Incident Report';

    let status: ReviewItem['status'] = 'pending';
    if (report.status === 'REVIEWED' || report.status === 'RESOLVED') status = 'approved';
    else if (report.status === 'REJECTED') status = 'rejected';
    else if (report.status === 'UNDER_REVIEW') status = 'under_review';
    else if (report.status === 'SUBMITTED' || report.status === 'PENDING') status = 'pending';
    else status = 'pending';

    let severity: ReviewItem['severity'] = 'medium';
    if (report.severity) {
      const sev = report.severity.toLowerCase();
      if (sev === 'critical' || sev === 'high' || sev === 'medium' || sev === 'low') {
        severity = sev as ReviewItem['severity'];
      }
    }

    const guardName = report.guard?.name
      || (report.guard?.user
        ? `${report.guard.user.firstName || ''} ${report.guard.user.lastName || ''}`.trim()
        : undefined);

    return {
      id: report.id,
      source: 'incident',
      title,
      type: report.reportType || 'incident',
      severity,
      description: report.description || '',
      status,
      reportedAt: report.submittedAt || report.createdAt || new Date().toISOString(),
      guardName,
      siteName: report.location?.name || report.locationName,
      mediaFiles: report.media || report.mediaFiles || [],
      voiceTranscription: report.voiceTranscription,
      syncStatus: 'synced',
      guard: report.guard,
    };
  };

  const transformShiftReport = (report: any): ReviewItem => {
    const guardUser = report.guard || report.shift?.guard?.user;
    const guardName = guardUser
      ? `${guardUser.firstName || ''} ${guardUser.lastName || ''}`.trim()
      : 'Unknown Guard';

    return {
      id: report.id,
      source: 'shift',
      title: getReportTypeLabel(report.reportType, 'shift'),
      type: report.reportType || 'SHIFT',
      severity: report.reportType === 'EMERGENCY' ? 'critical' : 'medium',
      description: report.content || '',
      status: 'submitted',
      reportedAt: report.submittedAt || report.createdAt || new Date().toISOString(),
      guardName,
      siteName: report.shift?.site?.name || report.shift?.locationName,
      mediaFiles: [],
      syncStatus: 'synced',
    };
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const [incidentResponse, shiftResponse] = await Promise.all([
        apiService.getAllIncidentReports({ page: 1, limit: 100 }),
        sourceFilter !== 'incident'
          ? apiService.getCompanyShiftReports(1, 100)
          : Promise.resolve({ success: true, data: { reports: [] } }),
      ]);

      if (!incidentResponse.success && sourceFilter !== 'shift') {
        throw new Error(incidentResponse.message || 'Failed to load incident reports');
      }

      const incidentItems = (incidentResponse.data?.reports || []).map(transformIncidentReport);
      const shiftItems = shiftResponse.success
        ? (shiftResponse.data?.reports || []).map(transformShiftReport)
        : [];

      let combined: ReviewItem[] = [];
      if (sourceFilter === 'incident') {
        combined = incidentItems;
      } else if (sourceFilter === 'shift') {
        combined = shiftItems;
      } else {
        combined = [...incidentItems, ...shiftItems].sort(
          (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
        );
      }

      if (sourceFilter !== 'shift' && filterStatus !== 'all') {
        combined = combined.filter((item) => {
          if (item.source === 'shift') return sourceFilter === 'all';
          return item.status === filterStatus;
        });
      }

      setReviewItems(combined);
    } catch (error: any) {
      console.error('Error loading reports:', error);
      const errorMessage = error.message || 'Failed to load reports';
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
    await loadReports();
  };

  const handleReviewItem = (item: ReviewItem) => {
    setSelectedItem(item);
    setReviewNotes('');
    if (item.source === 'shift') {
      setViewModal(true);
    } else {
      setReviewModal(true);
    }
  };

  const handleApproveIncident = async () => {
    if (!selectedItem || selectedItem.source !== 'incident') return;

    try {
      const response = await apiService.respondToReport(
        selectedItem.id, 
        'REVIEWED',
        reviewNotes.trim() || undefined
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to approve incident');
      }

      Alert.alert('Success', 'Incident approved successfully');
      setReviewModal(false);
      setReviewNotes('');
      await loadReports();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to approve incident');
    }
  };

  const handleRejectIncident = async () => {
    if (!selectedItem || selectedItem.source !== 'incident') return;

    if (!reviewNotes.trim()) {
      Alert.alert('Error', 'Please provide rejection notes');
      return;
    }

    try {
      const response = await apiService.respondToReport(
        selectedItem.id,
        'RESOLVED',
        reviewNotes.trim()
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to reject incident');
      }

      Alert.alert('Success', 'Incident reviewed with notes');
      setReviewModal(false);
      setReviewNotes('');
      await loadReports();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to review incident');
    }
  };

  const getSeverityColor = (severity: ReviewItem['severity']) => {
    switch (severity) {
      case 'critical': return '#DC2626'; // Red
      case 'high': return '#F59E0B'; // Orange
      case 'medium': return '#F59E0B'; // Orange
      case 'low': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusColor = (status: ReviewItem['status']) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'under_review': return COLORS.primary;
      case 'approved': return COLORS.success;
      case 'rejected': return COLORS.error;
      case 'submitted': return COLORS.info;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusLabel = (status: ReviewItem['status']) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'under_review': return 'Under Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'submitted': return 'Submitted';
      default: return status;
    }
  };

  const renderReviewItem = ({ item }: { item: ReviewItem }) => (
    <TouchableOpacity 
      style={styles.incidentCard}
      onPress={() => handleReviewItem(item)}
      activeOpacity={0.7}
    >
      <View style={styles.incidentHeader}>
        <Text style={styles.incidentTitle} numberOfLines={2}>{item.title}</Text>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.sourceRow}>
        <View style={[styles.sourceBadge, item.source === 'shift' ? styles.sourceBadgeShift : styles.sourceBadgeIncident]}>
          <Text style={[styles.sourceBadgeText, item.source === 'shift' ? styles.sourceTextShift : styles.sourceTextIncident]}>
            {getReportSourceLabel(item.source)}
          </Text>
        </View>
        {item.guardName ? <Text style={styles.guardLine}>{item.guardName}</Text> : null}
      </View>
      
      <Text style={styles.incidentType}>{item.type.replace('_', ' ').toUpperCase()}</Text>
      {item.siteName ? <Text style={styles.siteLine}>{item.siteName}</Text> : null}
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
            handleReviewItem(item);
          }}
        >
          <Text style={styles.actionButtonText}>
            {item.source === 'shift' ? 'View' : getStatusLabel(item.status)}
          </Text>
        </TouchableOpacity>
      </View>
      
      {item.source === 'incident' ? (
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
      ) : null}
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
        
        {selectedItem && selectedItem.source === 'incident' && (
          <View style={styles.modalContent}>
            <Text style={styles.detailTitle}>{selectedItem.title}</Text>
            <Text style={styles.detailType}>
              {selectedItem.type.replace('_', ' ')} - {selectedItem.severity}
            </Text>
            {selectedItem.guardName ? (
              <Text style={styles.detailMeta}>Guard: {selectedItem.guardName}</Text>
            ) : null}
            {selectedItem.siteName ? (
              <Text style={styles.detailMeta}>Site: {selectedItem.siteName}</Text>
            ) : null}
            <Text style={styles.detailDescription}>{selectedItem.description}</Text>
            
            {selectedItem.voiceTranscription && (
              <View style={styles.voiceSection}>
                <Text style={styles.voiceTitle}>Voice Transcription:</Text>
                <Text style={styles.voiceText}>{selectedItem.voiceTranscription}</Text>
              </View>
            )}
            
            <View style={styles.mediaSection}>
              <Text style={styles.mediaTitle}>Media Files: {selectedItem.mediaFiles.length}</Text>
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

  const renderViewModal = () => (
    <Modal
      visible={viewModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Shift Report</Text>
          <TouchableOpacity onPress={() => setViewModal(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        {selectedItem && selectedItem.source === 'shift' && (
          <View style={styles.modalContent}>
            <Text style={styles.detailTitle}>{selectedItem.title}</Text>
            {selectedItem.guardName ? (
              <Text style={styles.detailMeta}>Guard: {selectedItem.guardName}</Text>
            ) : null}
            {selectedItem.siteName ? (
              <Text style={styles.detailMeta}>Site: {selectedItem.siteName}</Text>
            ) : null}
            <Text style={styles.detailMeta}>
              Submitted: {new Date(selectedItem.reportedAt).toLocaleString()}
            </Text>
            <Text style={styles.detailDescription}>{selectedItem.description}</Text>
            <TouchableOpacity
              style={[styles.reviewButton, styles.approveButton, { marginTop: SPACING.lg }]}
              onPress={() => setViewModal(false)}
            >
              <Text style={styles.reviewButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="admin"
        title="Reports Review"
        showLogo={false}
        onMenuPress={openDrawer}
        onNotificationPress={onNotificationPress}
        notificationCount={notificationCount}
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
      <SegmentTabs
        tabs={[
          { key: 'all' as const, label: 'All' },
          { key: 'incident' as const, label: 'Incidents' },
          { key: 'shift' as const, label: 'Shift' },
        ]}
        activeKey={sourceFilter}
        onChange={setSourceFilter}
      />
      {sourceFilter !== 'shift' ? (
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'All', icon: ReportsIcon, inactiveColor: COLORS.textSecondary },
          { key: 'pending', label: 'Pending', icon: EmergencyIcon, inactiveColor: COLORS.textSecondary },
          { key: 'under_review', label: 'Under Review', icon: CheckCircleIcon, inactiveColor: COLORS.textSecondary },
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
      ) : null}
      
      {loading && !reviewItems.length ? (
        <LoadingOverlay visible={true} message="Loading reports..." />
      ) : error && !reviewItems.length ? (
        <View style={styles.errorContainer}>
          {error.toLowerCase().includes('network') || 
           error.toLowerCase().includes('timeout') ||
           error.toLowerCase().includes('connection') ? (
            <NetworkError onRetry={loadReports} />
          ) : (
            <ErrorState error={error} onRetry={loadReports} />
          )}
        </View>
      ) : (
        <FlatList
          data={reviewItems}
          renderItem={renderReviewItem}
          keyExtractor={(item) => `${item.source}-${item.id}`}
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
      
      {loading && reviewItems.length > 0 && <LoadingOverlay visible={true} message="Refreshing..." />}

      {renderReviewModal()}
      {renderViewModal()}
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
    backgroundColor: COLORS.backgroundSecondary,
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
  sourceFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: COLORS.backgroundPrimary,
  },
  sourceFilterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
  },
  sourceFilterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sourceFilterText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  sourceFilterTextActive: {
    color: COLORS.textInverse,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
    flexWrap: 'wrap',
  },
  sourceBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  sourceBadgeIncident: {
    backgroundColor: COLORS.primaryLight + '55',
  },
  sourceBadgeShift: {
    backgroundColor: COLORS.secondary,
  },
  sourceBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  sourceTextIncident: {
    color: COLORS.primaryDark,
  },
  sourceTextShift: {
    color: COLORS.primary,
  },
  guardLine: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  siteLine: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    marginBottom: SPACING.xs,
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
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.small,
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
  detailMeta: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
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
