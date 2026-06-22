import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import ClientProfileDrawer from '../../components/client/ClientProfileDrawer';
import SegmentTabs from '../../components/shifts/SegmentTabs';
import ShiftListCard from '../../components/shifts/ShiftListCard';
import { useNotificationBell } from '../../hooks/useNotificationBell';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';
import { ErrorState, NetworkError, EmptyState, InlineLoading } from '../../components/ui/LoadingStates';
import { COLORS, SPACING } from '../../styles/globalStyles';
import { ClockIcon } from '../../components/ui/FeatherIcons';
import { ChevronLeftIcon } from '../../components/ui/AppIcons';
import { clientApi } from '../../services/api/clientApi';

type TabKey = 'upcoming' | 'active' | 'past';

interface ClientShift {
  id: string;
  status: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  startTime?: string;
  endTime?: string;
  locationName?: string;
  site?: { id: string; name: string; address?: string };
  guard?: {
    user?: {
      firstName: string;
      lastName: string;
      profilePictureUrl?: string | null;
    };
  };
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'active', label: 'Active' },
  { key: 'past', label: 'Past' },
];

const ClientMyShiftsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<ClientStackParamList>>();
  const { onNotificationPress, notificationCount } = useNotificationBell({
    notificationsRoute: 'ClientNotifications',
  });
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [shifts, setShifts] = useState<ClientShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadShifts = useCallback(async () => {
    try {
      setError(null);
      const response = await clientApi.getClientShifts({ page: 1, limit: 100 });
      if (response.success && response.data?.shifts) {
        setShifts(response.data.shifts);
      } else {
        setShifts([]);
        setError(response.message || 'Failed to load shifts');
      }
    } catch (err: any) {
      setShifts([]);
      setError(err.message || 'Failed to load shifts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadShifts();
    }, [loadShifts])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadShifts();
  }, [loadShifts]);

  const filteredShifts = useMemo(() => {
    const now = Date.now();
    return shifts.filter((shift) => {
      const start = new Date(shift.scheduledStartTime || shift.startTime || 0).getTime();
      const end = new Date(shift.scheduledEndTime || shift.endTime || 0).getTime();

      if (activeTab === 'active') {
        return shift.status === 'IN_PROGRESS';
      }
      if (activeTab === 'upcoming') {
        return shift.status === 'SCHEDULED' && (Number.isNaN(start) || start >= now || end >= now);
      }
      return (
        shift.status === 'COMPLETED' ||
        shift.status === 'CANCELLED' ||
        shift.status === 'MISSED' ||
        shift.status === 'NO_SHOW' ||
        (!Number.isNaN(end) && end < now && shift.status !== 'IN_PROGRESS' && shift.status !== 'SCHEDULED')
      );
    }).sort((a, b) => {
      const aTime = new Date(a.scheduledStartTime || a.startTime || 0).getTime();
      const bTime = new Date(b.scheduledStartTime || b.startTime || 0).getTime();
      return activeTab === 'past' ? bTime - aTime : aTime - bTime;
    });
  }, [shifts, activeTab]);

  const handleShiftPress = (shiftId: string) => {
    navigation.navigate('ShiftDetails', { shiftId });
  };

  const isNetworkError =
    error?.toLowerCase().includes('network') ||
    error?.toLowerCase().includes('connection') ||
    error?.toLowerCase().includes('econnrefused');

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="client"
        title="My Shifts"
        leftIcon={
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeftIcon size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        }
        onNotificationPress={onNotificationPress}
        notificationCount={notificationCount}
        profileDrawer={
          <ClientProfileDrawer
            visible={false}
            onClose={() => {}}
            onNavigateToNotifications={() => navigation.navigate('ClientNotifications')}
          />
        }
      />

      <SegmentTabs tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

      {loading && shifts.length === 0 ? (
        <InlineLoading size="large" message="Loading shifts..." style={styles.centered} />
      ) : error && shifts.length === 0 ? (
        <View style={styles.centered}>
          {isNetworkError ? (
            <NetworkError onRetry={loadShifts} />
          ) : (
            <ErrorState error={error} onRetry={loadShifts} />
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {filteredShifts.length === 0 ? (
            <EmptyState
              title={`No ${activeTab} shifts`}
              message="Shifts scheduled for your sites will appear here."
              icon={<ClockIcon size={40} color={COLORS.textTertiary} />}
            />
          ) : (
            filteredShifts.map((shift) => {
              const siteName = shift.site?.name || shift.locationName || 'Unknown site';
              const guardUser = shift.guard?.user;
              const start = shift.scheduledStartTime || shift.startTime;
              const end = shift.scheduledEndTime || shift.endTime;

              return (
                <ShiftListCard
                  key={shift.id}
                  title={siteName}
                  subtitle={shift.site?.address}
                  guardFirstName={guardUser?.firstName}
                  guardLastName={guardUser?.lastName}
                  guardProfilePictureUrl={guardUser?.profilePictureUrl}
                  guardLabel={guardUser ? undefined : 'Unassigned'}
                  startTime={start}
                  endTime={end}
                  status={shift.status}
                  onPress={() => handleShiftPress(shift.id)}
                />
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  backButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
});

export default ClientMyShiftsScreen;
