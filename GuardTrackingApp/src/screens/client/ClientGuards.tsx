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

  const handlePostNewShift = () => {
    navigation.navigate('CreateShift');
  };

  const handleGuardPress = (guardId: string) => {
    console.log('Guard pressed:', guardId);
  };

  const handleHireGuard = (guardId: string) => {
    console.log('Hire guard:', guardId);
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
              onPress={() => handleGuardPress(guard.id)}
              onHire={() => handleHireGuard(guard.id)}
              showHireButton={true}
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
    backgroundColor: '#F8F9FA',
  },
  postButton: {
    backgroundColor: '#1C6CA9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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

export default ClientGuards;
