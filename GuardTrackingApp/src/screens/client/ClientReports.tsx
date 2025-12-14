import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import ReportCard from '../../components/client/ReportCard';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';
import SharedHeader from '../../components/ui/SharedHeader';
import ClientProfileDrawer from '../../components/client/ClientProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { fetchMyReports } from '../../store/slices/clientSlice';
import { LoadingOverlay, ErrorState, NetworkError } from '../../components/ui/LoadingStates';
import apiService from '../../services/api';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

interface ReportData {
  id: string;
  type: 'Medical Emergency' | 'Incident' | 'Violation' | 'Maintenance';
  guardName: string;
  guardAvatar?: string;
  site: string;
  time: string;
  description: string;
  status: 'Respond' | 'New' | 'Reviewed';
  checkInTime?: string;
  guardId?: string;
  guardUserId?: string;
}

const ClientReports: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<StackNavigationProp<ClientStackParamList>>();
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const [refreshing, setRefreshing] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // Redux state
  const { 
    reports, 
    reportsLoading, 
    reportsError 
  } = useSelector((state: RootState) => state.client);
  
  const { user } = useSelector((state: RootState) => state.auth);

  const loadReports = useCallback(async () => {
    try {
      const result = await dispatch(fetchMyReports({ page: 1, limit: 50 }));
      // Check if the action was rejected
      if (fetchMyReports.rejected.match(result)) {
        console.error('Error loading reports:', result.payload || result.error);
      }
    } catch (error: any) {
      console.error('Error loading reports:', error);
      // Ensure we handle errors gracefully
      if (error?.message) {
        console.error('Error details:', error.message);
      }
    }
  }, [dispatch]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadReports();
    } catch (error) {
      console.error('Error refreshing reports:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadReports]);

  // Check for network errors
  const isNetworkError = reportsError?.toLowerCase().includes('network') || 
                         reportsError?.toLowerCase().includes('connection') ||
                         reportsError?.toLowerCase().includes('econnrefused') ||
                         reportsError?.toLowerCase().includes('enotfound');

  const handleReportPress = (reportId: string) => {
    console.log('Report pressed:', reportId);
  };

  const handleRespond = (reportId: string) => {
    setSelectedReportId(reportId);
    setResponseNotes('');
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    if (!selectedReportId) return;

    setIsSubmittingResponse(true);
    try {
      const response = await apiService.respondToReport(
        selectedReportId, 
        'REVIEWED', 
        responseNotes.trim() || undefined
      );
      
      if (response.success) {
        Alert.alert('Success', 'Report marked as reviewed');
        setShowResponseModal(false);
        setSelectedReportId(null);
        setResponseNotes('');
        await loadReports();
      } else {
        Alert.alert('Error', response.message || 'Failed to update report');
      }
    } catch (error: any) {
      console.error('Respond error:', error);
      Alert.alert('Error', error.message || 'Failed to respond to report');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleChatWithGuard = async (guardId: string, guardName: string) => {
    try {
      if (!user) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      // Use centralized chat helper to find or create chat
      const { findOrCreateClientGuardChat } = await import('../../utils/chatHelper');
      const chatParams = await findOrCreateClientGuardChat(
        user.id,
        guardId,
        guardName,
        'report'
      );

      navigation.navigate('IndividualChatScreen', chatParams);
    } catch (error) {
      console.error('Error navigating to chat:', error);
      Alert.alert('Error', 'Failed to open chat. Please try again.');
    }
  };

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="client"
        title="Reports"
        onNotificationPress={() => navigation.navigate('ClientNotifications')}
        profileDrawer={
          <ClientProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToReports={() => {
              closeDrawer();
            }}
            onNavigateToNotifications={() => {
              closeDrawer();
              navigation.navigate('ClientNotifications');
            }}
          />
        }
      />

      <LoadingOverlay
        visible={reportsLoading && reports.length === 0}
        message="Loading reports..."
      />

      {reportsError && reports.length === 0 && !reportsLoading && (
        <View style={styles.errorContainer}>
          {isNetworkError ? (
            <NetworkError
              onRetry={loadReports}
              style={styles.errorState}
            />
          ) : (
            <ErrorState
              error={reportsError}
              onRetry={loadReports}
              style={styles.errorState}
            />
          )}
        </View>
      )}

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {reportsLoading && reports.length > 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Updating reports...</Text>
          </View>
        ) : null}

        {reports && reports.length > 0 ? (
          reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onPress={() => handleReportPress(report.id)}
              onRespond={() => handleRespond(report.id)}
              onChatWithGuard={handleChatWithGuard}
            />
          ))
        ) : !reportsLoading && !reportsError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reports available</Text>
            <Text style={styles.emptySubtext}>Reports from your guards will appear here</Text>
          </View>
          ) : null}
      </ScrollView>

      {/* Response Modal */}
      <Modal
        visible={showResponseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowResponseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Respond to Report</Text>
            <Text style={styles.modalSubtitle}>Add a response note (optional):</Text>
            
            <TextInput
              style={styles.responseInput}
              placeholder="Enter your response..."
              placeholderTextColor={COLORS.textTertiary}
              value={responseNotes}
              onChangeText={setResponseNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowResponseModal(false);
                  setSelectedReportId(null);
                  setResponseNotes('');
                }}
                disabled={isSubmittingResponse}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={submitResponse}
                disabled={isSubmittingResponse}
              >
                {isSubmittingResponse ? (
                  <ActivityIndicator color={COLORS.textInverse} />
                ) : (
                  <Text style={styles.submitButtonText}>Mark as Reviewed</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  errorContainer: {
    flex: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  errorState: {
    flex: 1,
  },
  loadingContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    padding: SPACING.xxxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  responseInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    minHeight: 100,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
  },
});

export default ClientReports;
