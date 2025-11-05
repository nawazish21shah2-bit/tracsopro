// My Shifts Screen with Tabs
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { AppScreen, AppCard } from '../../components/ui/AppComponents';
import {
  MenuIcon,
  NotificationIcon,
  LocationIcon,
  ClockIcon,
  CheckInIcon,
  IncidentIcon,
  EmergencyIcon
} from '../../components/ui/AppIcons';

type MyShiftsScreenNavigationProp = StackNavigationProp<any, 'MyShifts'>;

interface ShiftData {
  id: string;
  location: string;
  address: string;
  status: 'active' | 'upcoming' | 'completed' | 'missed';
  startTime: string;
  endTime: string;
  duration: string;
  description: string;
  clockedIn?: string;
  clockedOut?: string;
  date?: string;
  shiftStartIn?: string;
}

type TabType = 'Today' | 'Upcoming' | 'Past';

const MyShiftsScreen: React.FC = () => {
  const navigation = useNavigation<MyShiftsScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState<TabType>('Today');

  // Mock data - replace with actual API calls
  const shiftsData: Record<TabType, ShiftData[]> = {
    Today: [
      {
        id: '1',
        location: 'Ocean View Vila',
        address: '1321 Baker Street, NY',
        status: 'active',
        startTime: '08:00 am',
        endTime: '07:00 pm',
        duration: '03:22:32',
        description: 'Make sure to check the parking lot for illegal parkings.',
        clockedIn: '08:01 am',
      },
    ],
    Upcoming: [
      {
        id: '2',
        location: 'Ocean View Vila',
        address: '1321 Baker Street, NY',
        status: 'upcoming',
        startTime: '08:00 am',
        endTime: '07:00 pm',
        duration: '10 hrs',
        description: 'Make sure to check the parking lot for illegal parkings.',
        shiftStartIn: '10 hrs',
      },
      {
        id: '3',
        location: 'Ocean View Vila',
        address: '1321 Baker Street, NY',
        status: 'upcoming',
        startTime: '08:00 am',
        endTime: '07:00 pm',
        duration: '10 hrs',
        description: 'Make sure to check the parking lot for illegal parkings.',
        shiftStartIn: '10 hrs',
      },
    ],
    Past: [
      {
        id: '4',
        location: 'Ocean View Vila',
        address: '1321 Baker Street, NY',
        status: 'completed',
        startTime: '08:00 am',
        endTime: '07:00 pm',
        duration: '11 hrs',
        description: 'Make sure to check the parking lot for illegal parkings.',
        clockedIn: '08:02 am',
        clockedOut: '07:00 pm',
        date: '23-10-2025',
      },
      {
        id: '5',
        location: 'Ocean View Vila',
        address: '1321 Baker Street, NY',
        status: 'missed',
        startTime: '08:00 am',
        endTime: '07:00 pm',
        duration: '11 hrs',
        description: 'Make sure to check the parking lot for illegal parkings.',
        date: '22-10-2025',
      },
    ],
  };

  const handleIncidentReport = () => {
    console.log('Add Incident Report pressed');
  };

  const handleEmergencyAlert = () => {
    console.log('Emergency Alert pressed');
  };

  const handleClockIn = (shiftId: string) => {
    console.log('Clock In pressed for shift:', shiftId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return COLORS.success;
      case 'upcoming':
        return COLORS.info;
      case 'completed':
        return COLORS.success;
      case 'missed':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'upcoming':
        return 'Upcoming';
      case 'completed':
        return 'Completed';
      case 'missed':
        return 'Missed';
      default:
        return status;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.menuButton}>
        <MenuIcon size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>My Shifts</Text>
      
      <TouchableOpacity style={styles.notificationButton}>
        <NotificationIcon size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {(['Today', 'Upcoming', 'Past'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tab,
            activeTab === tab && styles.activeTab,
          ]}
          onPress={() => setActiveTab(tab)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText,
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderActiveShiftCard = (shift: ShiftData) => (
    <AppCard style={styles.shiftCard}>
      <View style={styles.shiftHeader}>
        <View style={styles.locationInfo}>
          <LocationIcon size={20} color={COLORS.primary} style={styles.locationIcon} />
          <View style={styles.locationDetails}>
            <Text style={styles.locationName}>{shift.location}</Text>
            <Text style={styles.locationAddress}>{shift.address}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(shift.status) }]}>
          <Text style={styles.statusText}>{getStatusText(shift.status)}</Text>
        </View>
      </View>

      <Text style={styles.shiftDescription}>{shift.description}</Text>

      <View style={styles.shiftInfo}>
        <Text style={styles.shiftTimeLabel}>Shift Time:</Text>
        <Text style={styles.shiftTimeValue}>{shift.startTime} - {shift.endTime}</Text>
      </View>

      {/* Timer for active shift */}
      <View style={styles.timerContainer}>
        <ClockIcon size={24} color={COLORS.textPrimary} style={styles.timerIcon} />
        <Text style={styles.timerText}>{shift.duration}</Text>
      </View>

      {shift.clockedIn && (
        <View style={styles.clockedInfo}>
          <Text style={styles.clockedText}>Clocked In at {shift.clockedIn}</Text>
          <Text style={styles.clockedSubtext}>Clocked In at 09:00 am</Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.incidentButton} onPress={handleIncidentReport}>
          <IncidentIcon size={20} color={COLORS.textInverse} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Add Incident Report</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyAlert}>
          <EmergencyIcon size={20} color={COLORS.textInverse} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Emergency Alert</Text>
        </TouchableOpacity>
      </View>
    </AppCard>
  );

  const renderUpcomingShiftCard = (shift: ShiftData) => (
    <AppCard style={styles.shiftCard}>
      <View style={styles.shiftHeader}>
        <View style={styles.locationInfo}>
          <LocationIcon size={20} color={COLORS.primary} style={styles.locationIcon} />
          <View style={styles.locationDetails}>
            <Text style={styles.locationName}>{shift.location}</Text>
            <Text style={styles.locationAddress}>{shift.address}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(shift.status) }]}>
          <Text style={styles.statusText}>{getStatusText(shift.status)}</Text>
        </View>
      </View>

      <Text style={styles.shiftDescription}>{shift.description}</Text>

      <View style={styles.shiftDetails}>
        <View style={styles.shiftDetailRow}>
          <Text style={styles.shiftDetailLabel}>Shift Time:</Text>
          <Text style={styles.shiftDetailValue}>{shift.startTime} - {shift.endTime}</Text>
        </View>
        <View style={styles.shiftDetailRow}>
          <Text style={styles.shiftDetailLabel}>Shift Start In:</Text>
          <Text style={styles.shiftDetailValue}>{shift.shiftStartIn}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.clockInButton} 
        onPress={() => handleClockIn(shift.id)}
      >
        <CheckInIcon size={24} color={COLORS.textPrimary} style={styles.clockInIcon} />
        <Text style={styles.clockInText}>Clock In</Text>
      </TouchableOpacity>
    </AppCard>
  );

  const renderPastShiftCard = (shift: ShiftData) => (
    <AppCard style={styles.shiftCard}>
      <View style={styles.shiftHeader}>
        <View style={styles.locationInfo}>
          <LocationIcon size={20} color={COLORS.primary} style={styles.locationIcon} />
          <View style={styles.locationDetails}>
            <Text style={styles.locationName}>{shift.location}</Text>
            <Text style={styles.locationAddress}>{shift.address}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(shift.status) }]}>
          <Text style={styles.statusText}>{getStatusText(shift.status)}</Text>
        </View>
      </View>

      <Text style={styles.shiftDescription}>{shift.description}</Text>

      <View style={styles.shiftDetails}>
        <View style={styles.shiftDetailRow}>
          <Text style={styles.shiftDetailLabel}>Shift Duration:</Text>
          <Text style={styles.shiftDetailValue}>{shift.startTime} - {shift.endTime}</Text>
        </View>
        {shift.clockedIn && shift.clockedOut && (
          <>
            <View style={styles.shiftDetailRow}>
              <Text style={styles.shiftDetailLabel}>Check In:</Text>
              <Text style={styles.shiftDetailValue}>{shift.clockedIn}</Text>
            </View>
            <View style={styles.shiftDetailRow}>
              <Text style={styles.shiftDetailLabel}>Check Out:</Text>
              <Text style={styles.shiftDetailValue}>{shift.clockedOut}</Text>
            </View>
          </>
        )}
        {shift.date && (
          <View style={styles.shiftDetailRow}>
            <Text style={styles.shiftDetailLabel}>Date:</Text>
            <Text style={styles.shiftDetailValue}>{shift.date}</Text>
          </View>
        )}
      </View>
    </AppCard>
  );

  const renderShiftCard = (shift: ShiftData) => {
    switch (shift.status) {
      case 'active':
        return renderActiveShiftCard(shift);
      case 'upcoming':
        return renderUpcomingShiftCard(shift);
      case 'completed':
      case 'missed':
        return renderPastShiftCard(shift);
      default:
        return renderUpcomingShiftCard(shift);
    }
  };

  const renderShiftsList = () => {
    const shifts = shiftsData[activeTab] || [];
    
    return (
      <FlatList
        data={shifts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderShiftCard(item)}
        contentContainerStyle={styles.shiftsList}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <AppScreen>
      {renderHeader()}
      {renderTabs()}
      {renderShiftsList()}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
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
  menuIcon: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
  },
  tab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.textInverse,
  },
  shiftsList: {
    padding: SPACING.lg,
    paddingBottom: 100, // Space for tab bar
  },
  shiftCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  locationIcon: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  locationDetails: {
    flex: 1,
  },
  locationName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textInverse,
  },
  shiftDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  shiftInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  shiftTimeLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  shiftTimeValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  shiftDetails: {
    marginBottom: SPACING.lg,
  },
  shiftDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  shiftDetailLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  shiftDetailValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  timerIcon: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    marginRight: SPACING.sm,
  },
  timerText: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  clockedInfo: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  clockedText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  clockedSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  incidentButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
  },
  buttonIcon: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginRight: SPACING.sm,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  clockInButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
  },
  clockInIcon: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    marginRight: SPACING.sm,
  },
  clockInText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
});

export default MyShiftsScreen;
