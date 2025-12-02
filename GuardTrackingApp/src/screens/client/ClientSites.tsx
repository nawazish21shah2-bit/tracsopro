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
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../../store';
import SiteCard from '../../components/client/SiteCard';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';
import SharedHeader from '../../components/ui/SharedHeader';
import ClientProfileDrawer from '../../components/client/ClientProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { fetchMySites } from '../../store/slices/clientSlice';
import { LoadingOverlay, ErrorState, NetworkError } from '../../components/ui/LoadingStates';

interface SiteData {
  id: string;
  name: string;
  address: string;
  guardName: string;
  guardAvatar?: string;
  status: 'Active' | 'Upcoming' | 'Missed';
  shiftTime?: string;
  checkInTime?: string;
  guardId?: string;
}

const ClientSites: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<StackNavigationProp<ClientStackParamList>>();
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const [refreshing, setRefreshing] = useState(false);

  // Redux state
  const { 
    sites, 
    sitesLoading, 
    sitesError 
  } = useSelector((state: RootState) => state.client);

  const loadSites = useCallback(async () => {
    try {
      await dispatch(fetchMySites({ page: 1, limit: 50 }));
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSites();
    }, [loadSites])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadSites();
    } catch (error) {
      console.error('Error refreshing sites:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadSites]);

  const handleNotificationPress = () => {
    navigation.navigate('ClientNotifications');
  };

  const handleSitePress = (siteId: string) => {
    navigation.navigate('SiteDetails', { siteId });
  };

  const handleMoreOptions = (siteId: string) => {
    console.log('More options for site:', siteId);
  };

  const handleChatWithGuard = (guardId: string, guardName: string) => {
    // Navigate to chat screen with guard
    (navigation as any).navigate('IndividualChatScreen', {
      chatId: `client_guard_${guardId}`,
      chatName: guardName,
      avatar: undefined,
      context: 'site'
    });
  };

  // Check for network errors
  const isNetworkError = sitesError?.toLowerCase().includes('network') || 
                         sitesError?.toLowerCase().includes('connection') ||
                         sitesError?.toLowerCase().includes('econnrefused') ||
                         sitesError?.toLowerCase().includes('enotfound');

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="client"
        title="My Sites"
        onNotificationPress={handleNotificationPress}
        profileDrawer={
          <ClientProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToSites={() => {
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
        visible={sitesLoading && sites.length === 0}
        message="Loading sites..."
      />

      {sitesError && sites.length === 0 && !sitesLoading && (
        <View style={styles.errorContainer}>
          {isNetworkError ? (
            <NetworkError
              onRetry={loadSites}
              style={styles.errorState}
            />
          ) : (
            <ErrorState
              error={sitesError}
              onRetry={loadSites}
              style={styles.errorState}
            />
          )}
        </View>
      )}

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {sitesLoading && sites.length > 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1C6CA9" />
            <Text style={styles.loadingText}>Updating sites...</Text>
          </View>
        ) : null}

        {sites && sites.length > 0 ? (
          sites.map((site: any) => {
            // Get active guard assignment from site data
            const activeAssignment = site.shiftAssignments?.[0];
            const guard = activeAssignment?.guard;
            const guardName = guard?.user 
              ? `${guard.user.firstName} ${guard.user.lastName}`
              : 'No guard assigned';
            
            // Determine status based on assignment
            let status: 'Active' | 'Upcoming' | 'Missed' = 'Upcoming';
            if (activeAssignment) {
              if (activeAssignment.status === 'IN_PROGRESS') {
                status = 'Active';
              } else if (activeAssignment.status === 'ASSIGNED') {
                status = 'Upcoming';
              }
            }

            // Format shift time
            const formatTime = (dateString?: string) => {
              if (!dateString) return '--:--';
              try {
                const date = new Date(dateString);
                return date.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                });
              } catch {
                return '--:--';
              }
            };

            // Transform Site to SiteData for SiteCard compatibility
            const siteData: SiteData = {
              id: site.id,
              name: site.name,
              address: site.address,
              guardName: guardName,
              status: status,
              guardId: guard?.id || undefined,
              shiftTime: activeAssignment 
                ? `${formatTime(activeAssignment.startTime)} - ${formatTime(activeAssignment.endTime)}`
                : 'No shift scheduled',
              checkInTime: activeAssignment?.checkInTime 
                ? formatTime(activeAssignment.checkInTime)
                : undefined,
            };
            
            return (
              <SiteCard
                key={site.id}
                site={siteData}
                onPress={() => handleSitePress(site.id)}
                onMoreOptions={() => handleMoreOptions(site.id)}
                onChatWithGuard={handleChatWithGuard}
              />
            );
          })
        ) : !sitesLoading && !sitesError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No sites found</Text>
            <Text style={styles.emptySubtext}>Add a new site to get started</Text>
            <TouchableOpacity 
              style={styles.addSiteButton}
              onPress={() => navigation.navigate('AddSite')}
            >
              <Text style={styles.addSiteButtonText}>Add New Site</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: '#1C6CA9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  addSiteButton: {
    backgroundColor: '#1C6CA9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addSiteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
});

export default ClientSites;
