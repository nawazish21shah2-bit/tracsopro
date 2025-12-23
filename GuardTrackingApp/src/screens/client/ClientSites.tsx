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
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import apiService from '../../services/api';

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
  
  const { user } = useSelector((state: RootState) => state.auth);

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

  const handleViewSite = (siteId: string) => {
    navigation.navigate('SiteDetails', { siteId });
  };

  const handleEditSite = (siteId: string) => {
    // Navigate to site details where editing can be done
    // Or navigate to a dedicated edit screen if available
    navigation.navigate('SiteDetails', { siteId, editMode: true });
  };

  const handleDeleteSite = async (siteId: string) => {
    const site = sites.find((s: any) => s.id === siteId);
    const siteName = site?.name || 'this site';

    Alert.alert(
      'Delete Site',
      `Are you sure you want to delete "${siteName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.deleteClientSite(siteId);
              if (response.success) {
                Alert.alert('Success', response.message || 'Site deleted successfully', [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Reload sites after deletion
                      loadSites();
                    },
                  },
                ]);
              } else {
                Alert.alert('Error', response.message || 'Failed to delete site');
              }
            } catch (error: any) {
              console.error('Delete site error:', error);
              Alert.alert(
                'Error',
                error.message || error.response?.data?.message || 'Failed to delete site. Please try again.'
              );
            }
          },
        },
      ],
    );
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
        'site'
      );

      navigation.navigate('IndividualChatScreen', chatParams);
    } catch (error) {
      console.error('Error navigating to chat:', error);
      Alert.alert('Error', 'Failed to open chat. Please try again.');
    }
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
        contentContainerStyle={
          sites && sites.length > 0 
            ? styles.scrollContent 
            : [styles.scrollContent, { flexGrow: 1, justifyContent: 'center' }]
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        removeClippedSubviews={false}
      >
        {sitesLoading && sites.length > 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1C6CA9" />
            <Text style={styles.loadingText}>Updating sites...</Text>
          </View>
        ) : null}

        {sites && sites.length > 0 ? (
          sites.map((site: any, index: number) => {
            if (!site || !site.id) {
              return null;
            }

            // Get active shift from site data (Option B)
            const activeShift = site.shifts?.[0];
            const guard = activeShift?.guard;
            const guardName = guard?.user 
              ? `${guard.user.firstName} ${guard.user.lastName}`
              : 'No guard assigned';
            
            // Determine status based on shift
            let status: 'Active' | 'Upcoming' | 'Missed' = 'Upcoming';
            if (activeShift) {
              if (activeShift.status === 'IN_PROGRESS') {
                status = 'Active';
              } else if (activeShift.status === 'SCHEDULED') {
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
              name: site.name || 'Unnamed Site',
              address: site.address || 'No address',
              guardName: guardName,
              status: status,
              guardId: guard?.id || undefined,
              shiftTime: activeShift 
                ? `${formatTime(activeShift.scheduledStartTime)} - ${formatTime(activeShift.scheduledEndTime)}`
                : 'No shift scheduled',
              checkInTime: activeShift?.checkInTime 
                ? formatTime(activeShift.checkInTime)
                : undefined,
            };
            
            return (
              <SiteCard
                key={`site-${site.id}-${index}`}
                site={siteData}
                onPress={() => handleSitePress(site.id)}
                onView={handleViewSite}
                onEdit={handleEditSite}
                onDelete={handleDeleteSite}
                onChatWithGuard={handleChatWithGuard}
              />
            );
          }).filter(Boolean)
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

      {/* Sticky Add New Site Button - Always Visible */}
      <TouchableOpacity 
        style={styles.stickyAddButton}
        onPress={() => navigation.navigate('AddSite')}
        activeOpacity={0.8}
      >
        <Text style={styles.stickyAddButtonText}>+ Add New Site</Text>
      </TouchableOpacity>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },
  addButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  scrollContent: {
    paddingBottom: 80, // Add padding to prevent content from being hidden behind sticky button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxxl,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxxl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.fieldGap || SPACING.lg,
  },
  addSiteButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
    ...SHADOWS.small,
  },
  addSiteButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
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
  stickyAddButton: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
    zIndex: 1000,
  },
  stickyAddButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default ClientSites;
