import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import GuardCard from '../../components/client/GuardCard';
import SharedHeader from '../../components/ui/SharedHeader';
import ClientProfileDrawer from '../../components/client/ClientProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';
import { fetchMyGuards } from '../../store/slices/clientSlice';
import { LoadingOverlay, ErrorState, NetworkError } from '../../components/ui/LoadingStates';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import apiService from '../../services/api';

interface GuardData {
  id: string;
  name: string;
  avatar?: string;
  site?: string;
  shiftTime?: string;
  status: 'Active' | 'Upcoming' | 'Missed' | 'Completed';
  checkInTime?: string;
  pastJobs: number;
  rating: number;
  availability: string;
}

const ClientGuards: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<StackNavigationProp<ClientStackParamList>>();
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const [refreshing, setRefreshing] = useState(false);

  // Redux state
  const { 
    guards, 
    guardsLoading, 
    guardsError 
  } = useSelector((state: RootState) => state.client);
  
  const { user } = useSelector((state: RootState) => state.auth);

  const loadGuards = useCallback(async () => {
    try {
      await dispatch(fetchMyGuards({ page: 1, limit: 50 }));
    } catch (error) {
      console.error('Error loading guards:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    loadGuards();
  }, [loadGuards]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadGuards();
    }, [loadGuards])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadGuards();
    } catch (error) {
      console.error('Error refreshing guards:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadGuards]);

  // Check for network errors
  const isNetworkError = guardsError?.toLowerCase().includes('network') || 
                         guardsError?.toLowerCase().includes('connection') ||
                         guardsError?.toLowerCase().includes('econnrefused') ||
                         guardsError?.toLowerCase().includes('enotfound');

  const handlePostNewShift = async () => {
    try {
      // Fetch client's sites first
      const result = await apiService.getClientSites(1, 100);
      if (result.success && result.data?.sites && result.data.sites.length > 0) {
        // Use the first site, or could show a selection modal
        const firstSite = result.data.sites[0];
        navigation.navigate('CreateShift', { siteId: firstSite.id });
      } else {
        Alert.alert(
          'No Sites Available',
          'Please create a site first before creating a shift.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to load sites. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleViewProfile = (guardId: string) => {
    // Navigate to guard profile/details screen
    // For now, show alert - can be replaced with actual navigation when guard profile screen is ready
    Alert.alert('Guard Profile', `View profile for guard: ${guardId}`);
    // TODO: Navigate to guard profile screen when implemented
    // navigation.navigate('GuardProfile', { guardId });
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
        'general'
      );

      navigation.navigate('IndividualChatScreen', chatParams);
    } catch (error) {
      console.error('Error navigating to chat:', error);
      Alert.alert('Error', 'Failed to open chat. Please try again.');
    }
  };

  const handleCallGuard = (phone: string) => {
    if (!phone) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }

    Alert.alert(
      'Call Guard',
      `Do you want to call ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            const phoneUrl = `tel:${phone.replace(/[^0-9]/g, '')}`;
            Linking.canOpenURL(phoneUrl)
              .then((supported) => {
                if (supported) {
                  return Linking.openURL(phoneUrl);
                } else {
                  Alert.alert('Error', 'Phone calls are not supported on this device');
                }
              })
              .catch((error) => {
                console.error('Error opening phone:', error);
                Alert.alert('Error', 'Failed to initiate call');
              });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="client"
        title="Guards"
        rightIcon={
          <TouchableOpacity style={styles.postButton} onPress={handlePostNewShift}>
            <Text style={styles.postButtonText}>Post New shift</Text>
          </TouchableOpacity>
        }
        profileDrawer={
          <ClientProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToGuards={() => {
              closeDrawer();
            }}
          />
        }
      />

      <LoadingOverlay
        visible={guardsLoading && guards.length === 0}
        message="Loading guards..."
      />

      {guardsError && guards.length === 0 && !guardsLoading && (
        <View style={styles.errorContainer}>
          {isNetworkError ? (
            <NetworkError
              onRetry={loadGuards}
              style={styles.errorState}
            />
          ) : (
            <ErrorState
              error={guardsError}
              onRetry={loadGuards}
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
        {guardsLoading && guards.length > 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1C6CA9" />
            <Text style={styles.loadingText}>Updating guards...</Text>
          </View>
        ) : null}

        {guards && guards.length > 0 ? (
          guards.map((guard) => (
            <GuardCard
              key={guard.id}
              guard={guard}
              onPress={() => handleViewProfile(guard.id)}
              onChat={handleChatWithGuard}
              onViewProfile={handleViewProfile}
              onCall={handleCallGuard}
              showActionButtons={true}
            />
          ))
        ) : !guardsLoading && !guardsError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No guards available</Text>
            <Text style={styles.emptySubtext}>Available guards will appear here</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  postButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },
  postButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
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
});

export default ClientGuards;
