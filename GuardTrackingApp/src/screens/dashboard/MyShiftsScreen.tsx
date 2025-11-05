// My Shifts Screen - Pixel Perfect Figma Implementation
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MenuIcon, BellIcon, MapPinIcon, AlertTriangleIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon, FileTextIcon } from '../../components/ui/FeatherIcons';
import { globalStyles, COLORS, SPACING } from '../../styles/globalStyles';
import { AppHeader } from '../../components/ui/AppHeader';
import { TabSelector } from '../../components/ui/TabSelector';
import Logo from '../../assets/images/tracSOpro-logo.png';

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
  timer?: string;
}

interface MonthlyStats {
  completedShifts: number;
  missedShifts: number;
  totalSites: number;
  incidentReported: number;
}

interface WeeklyShift {
  date: string;
  day: string;
  site: string;
  shiftTime: string;
  status: 'completed' | 'missed';
  checkIn: string;
  checkOut: string;
}

const MyShiftsScreen: React.FC = () => {
  const navigation = useNavigation<MyShiftsScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'past'>('today');
  const [timer, setTimer] = useState('03:22:32');

  const [monthlyStats] = useState<MonthlyStats>({
    completedShifts: 21,
    missedShifts: 1,
    totalSites: 5,
    incidentReported: 2,
  });

  const [todayShift] = useState<ShiftData>({
    id: '1',
    location: 'Ocean View Vila',
    address: '1321 Baker Street, NY',
    status: 'active',
    startTime: '08:00 am',
    endTime: '07:00 pm',
    duration: '11 hrs',
    description: 'Make sure to check the parking lot for illegal parkings.',
    clockedIn: '08:01 am',
    timer: '03:22:32',
  });

  const [upcomingShifts] = useState<ShiftData[]>([
    {
      id: '2',
      location: 'Ocean View Vila',
      address: '1321 Baker Street, NY',
      status: 'upcoming',
      startTime: '08:00 am',
      endTime: '07:00 pm',
      duration: '10 hrs',
      description: 'Make sure to check the parking lot for illegal parkings.',
    },
  ]);

  const [weeklyShifts] = useState<WeeklyShift[]>([
    {
      date: '23-10-2025',
      day: 'Monday',
      site: 'Ocean Villas',
      shiftTime: '08:00 Am - 07:00 Pm',
      status: 'completed',
      checkIn: '08:02 Am',
      checkOut: '07:00',
    },
    {
      date: '24-10-2025',
      day: 'Tuesday',
      site: 'Ocean Villas',
      shiftTime: '08:00 Am - 07:00 Pm',
      status: 'completed',
      checkIn: '08:02 Am',
      checkOut: '07:00',
    },
    {
      date: '25-10-2025',
      day: 'Wednesday',
      site: 'Ocean Villas',
      shiftTime: '08:00 Am - 07:00 Pm',
      status: 'missed',
      checkIn: '--:--',
      checkOut: '--:--',
    },
    {
      date: '26-10-2025',
      day: 'Thursday',
      site: 'Ocean Villas',
      shiftTime: '08:00 Am - 07:00 Pm',
      status: 'completed',
      checkIn: '08:02 Am',
      checkOut: '07:00',
    },
    {
      date: '27-10-2025',
      day: 'Friday',
      site: 'Ocean Villas',
      shiftTime: '08:00 Am - 07:00 Pm',
      status: 'completed',
      checkIn: '08:02 Am',
      checkOut: '07:00',
    },
    {
      date: '28-10-2025',
      day: 'Saturday',
      site: 'Ocean Villas',
      shiftTime: '08:00 Am - 07:00 Pm',
      status: 'completed',
      checkIn: '08:02 Am',
      checkOut: '07:00',
    },
  ]);

  const handleAddIncidentReport = () => {
    navigation.navigate('AddIncidentReport');
  };

  const handleEmergencyAlert = () => {
    console.log('Emergency Alert pressed');
  };

  const handleMenuPress = () => {
    console.log('Menu pressed');
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
  };

  const renderMonthlyStats = () => (
    <View style={styles.monthlyStatsContainer}>
      <Text style={styles.monthlyStatsTitle}>This Month Shifts</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#E8F5E8' }]}>
            <CheckCircleIcon size={18} color={'#4CAF50'} />
          </View>
          <View style={styles.statTextContainer}> 
          <Text style={styles.statNumber}>{monthlyStats.completedShifts}</Text>
          <Text style={styles.statLabel}>Completed{'\n'}Shifts</Text>
          </View>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#FFEBEE' }]}>
            <ClockIcon size={18} color={'#EF5350'} />
          </View>
          <View style={styles.statTextContainer}> 
          <Text style={styles.statNumber}>{monthlyStats.missedShifts}</Text>
          <Text style={styles.statLabel}>Missed{'\n'}Shifts</Text>
          </View>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
            <MapPinIcon size={18} color={'#42A5F5'} />
          </View>
            <View style={styles.statTextContainer}> 
          <Text style={styles.statNumber}>{monthlyStats.totalSites}</Text>
          <Text style={styles.statLabel}>Total{'\n'}Sites</Text>
          </View>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#F3E5F5' }]}>
            <FileTextIcon size={18} color={'#9E9E9E'} />
          </View>
          <View style={styles.statTextContainer}> 
          <Text style={styles.statNumber}>{monthlyStats.incidentReported}</Text>
          <Text style={styles.statLabel}>Incident{'\n'}Reported</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const tabs = [
    { id: 'today', label: 'Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
  ];

  const renderShiftCard = (shift: ShiftData) => (
    <View key={shift.id} style={styles.shiftCard}>
      <View style={styles.shiftHeader}>
        <View style={styles.locationInfo}>
          <MapPinIcon size={20} color="#3B82F6" />
          <View style={styles.locationText}>
            <Text style={styles.locationName}>{shift.location}</Text>
            <Text style={styles.locationAddress}>{shift.address}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, 
          shift.status === 'active' && styles.activeBadge,
          shift.status === 'upcoming' && styles.upcomingBadge
        ]}>
          <Text style={[styles.statusText,
            shift.status === 'active' && styles.activeText,
            shift.status === 'upcoming' && styles.upcomingText
          ]}>
            {shift.status === 'active' ? 'Active' : 'Upcoming'}
          </Text>
        </View>
      </View>

      <Text style={styles.shiftDescription}>{shift.description}</Text>
      
      <View style={styles.shiftDetails}>
        <Text style={styles.shiftDetailLabel}>Shift Time:</Text>
        <Text style={styles.shiftDetailValue}>{shift.startTime} - {shift.endTime}</Text>
      </View>

      {shift.status === 'active' && (
        <>
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{timer}</Text>
          </View>
          <Text style={styles.clockedInText}>
            Clocked In at {shift.clockedIn}
          </Text>
          <Text style={styles.clockedInSubtext}>
            Clocked In at 09:00 am
          </Text>
        </>
      )}

      {shift.status === 'upcoming' && (
        <View style={styles.shiftDetails}>
          <Text style={styles.shiftDetailLabel}>Shift Start In:</Text>
          <Text style={styles.shiftDetailValue}>{shift.duration}</Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.incidentButton} onPress={handleAddIncidentReport}>
          <AlertTriangleIcon size={16} color={'#1976D2'} style={styles.actionIconMargin} />
          <Text style={styles.incidentButtonText}>Add Incident Report</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyAlert}>
          <AlertCircleIcon size={16} color={'#D32F2F'} style={styles.actionIconMargin} />
          <Text style={styles.emergencyButtonText}>Emergency Alert</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWeeklySummary = () => (
    <View style={styles.weeklySummaryContainer}>
      <Text style={styles.weeklySummaryTitle}>This Week's Shifts Summary</Text>
      
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>DATE</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>SITE</Text>
        <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>SHIFT TIME</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>STATUS</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>CHECK IN</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>CHECK OUT</Text>
      </View>

      {weeklyShifts.map((shift, index) => (
        <View key={index} style={styles.tableRow}>
          <View style={{ flex: 1.5 }}>
            <Text style={styles.tableCellDate}>{shift.date}</Text>
            <Text style={styles.tableCellDay}>{shift.day}</Text>
          </View>
          <Text style={[styles.tableCellText, { flex: 1 }]}>{shift.site}</Text>
          <Text style={[styles.tableCellText, { flex: 1.5 }]}>{shift.shiftTime}</Text>
          <View style={{ flex: 1 }}>
            <View style={[styles.tableStatusBadge, 
              shift.status === 'completed' && styles.completedBadge,
              shift.status === 'missed' && styles.missedBadge
            ]}>
              <Text style={[styles.tableStatusText,
                shift.status === 'completed' && styles.completedText,
                shift.status === 'missed' && styles.missedText
              ]}>
                {shift.status === 'completed' ? 'Completed' : 'Missed'}
              </Text>
            </View>
          </View>
          <Text style={[styles.tableCellText, { flex: 1 }]}>{shift.checkIn}</Text>
          <Text style={[styles.tableCellText, { flex: 1 }]}>{shift.checkOut}</Text>
        </View>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'today':
        return (
          <View>
            {renderShiftCard(todayShift)}
            {renderWeeklySummary()}
          </View>
        );
      case 'upcoming':
        return (
          <View>
            {upcomingShifts.map(renderShiftCard)}
          </View>
        );
      case 'past':
        return (
          <View>
            <Text style={styles.emptyText}>No past shifts to display</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppHeader
        title="My Shifts"
        onMenuPress={handleMenuPress}
        onNotificationPress={handleNotificationPress}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderMonthlyStats()}
        <TabSelector
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={(tabId) => setActiveTab(tabId as 'today' | 'upcoming' | 'past')}
          style={styles.tabsContainer}
        />
        {renderContent()}
        {renderWeeklySummary()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  notificationButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  monthlyStatsContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  monthlyStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIconText: {
    fontSize: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#1C6CA9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  locationText: {
    marginLeft: 12,
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#E8F5E8',
  },
  upcomingBadge: {
    backgroundColor: '#E3F2FD',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeText: {
    color: '#4CAF50',
  },
  upcomingText: {
    color: '#2196F3',
  },
  shiftDescription: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
    lineHeight: 20,
  },
  shiftDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shiftDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  shiftDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  timerContainer: {
    backgroundColor: '#9CA3AF',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clockedInText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  clockedInSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  incidentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  incidentButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  incidentButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1976D2',
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  emergencyButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  emergencyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D32F2F',
  },
  weeklySummaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  weeklySummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCellDate: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },
  tableCellDay: {
    fontSize: 10,
    color: '#6B7280',
  },
  tableCellText: {
    fontSize: 12,
    color: '#111827',
    textAlign: 'center',
  },
  tableStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  completedBadge: {
    backgroundColor: '#E8F5E8',
  },
  missedBadge: {
    backgroundColor: '#FFEBEE',
  },
  tableStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  completedText: {
    color: '#4CAF50',
  },
  missedText: {
    color: '#F44336',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default MyShiftsScreen;
