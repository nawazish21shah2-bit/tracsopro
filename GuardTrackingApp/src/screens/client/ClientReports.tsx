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
}

const ClientReports: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<StackNavigationProp<ClientStackParamList>>();
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const [refreshing, setRefreshing] = useState(false);

  // Redux state
  const { 
    reports, 
    reportsLoading, 
    reportsError 
  } = useSelector((state: RootState) => state.client);

  const loadReports = useCallback(async () => {
    try {
      await dispatch(fetchMyReports({ page: 1, limit: 50 }));
    } catch (error) {
      console.error('Error loading reports:', error);
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

  const handleRespond = async (reportId: string) => {
    try {
      Alert.alert(
        'Respond to Report',
        'Mark this report as reviewed?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark as Reviewed',
            onPress: async () => {
              try {
                const response = await apiService.respondToReport(reportId, 'REVIEWED');
                if (response.success) {
                  Alert.alert('Success', 'Report marked as reviewed');
                  await loadReports();
                } else {
                  Alert.alert('Error', response.message || 'Failed to update report');
                }
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to respond to report');
              }
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to respond to report');
    }
  };

  const handleChatWithGuard = (guardId: string, guardName: string) => {
    // Navigate to chat screen with guard
    (navigation as any).navigate('IndividualChatScreen', {
      chatId: `client_guard_${guardId}`,
      chatName: guardName,
      avatar: undefined,
      context: 'report'
    });
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
            <ActivityIndicator size="small" color="#1C6CA9" />
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
    </SafeAreaWrapper>
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
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  errorState: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});

export default ClientReports;
