// Reports Screen - Pixel Perfect Figma Implementation
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState } from '../../store';
import { globalStyles, COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../styles/globalStyles';
import { AppScreen, AppCard, AppButton } from '../../components/ui/AppComponents';
import { AppHeader } from '../../components/ui/AppHeader';
import { MenuIcon, BellIcon, MapPinIcon, AlertTriangleIcon, AlertCircleIcon, FileTextIcon } from '../../components/ui/FeatherIcons';

type ReportsScreenNavigationProp = StackNavigationProp<any, 'Reports'>;

interface ShiftReport {
  id: string;
  location: string;
  address: string;
  shiftTime: string;
  reportText: string;
  submittedAt: string;
  type: 'incident' | 'shift';
}

const ReportsScreen: React.FC = () => {
  const navigation = useNavigation<ReportsScreenNavigationProp>();
  const dispatch = useDispatch();
  
  const [reportText, setReportText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Redux state
  const { 
    activeShift, 
    loading, 
    error 
  } = useSelector((state: RootState) => state.shifts);
  const [submittedReports, setSubmittedReports] = useState<ShiftReport[]>([
    {
      id: '1',
      location: 'Ocean View Vila',
      address: '1321 Baker Street, NY',
      shiftTime: '08:00 am - 07:00 pm',
      reportText: 'We had no incident occured on the site, during my shift hours',
      submittedAt: '27-10-2025, 03:32 pm',
      type: 'incident',
    },
    {
      id: '2',
      location: 'Ocean View Vila',
      address: '1321 Baker Street, NY',
      shiftTime: '08:00 am - 07:00 pm',
      reportText: 'We had no incident occured on the site, during my shift hours',
      submittedAt: '27-10-2025, 03:32 pm',
      type: 'incident',
    },
  ]);

  const handleSubmitReport = () => {
    if (!reportText.trim()) {
      Alert.alert('Error', 'Please write a report before submitting');
      return;
    }

    const newReport: ShiftReport = {
      id: Date.now().toString(),
      location: 'Ocean View Vila',
      address: '1321 Baker Street, NY',
      shiftTime: '08:00 am - 07:00 pm',
      reportText: reportText.trim(),
      submittedAt: new Date().toLocaleString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      type: 'shift',
    };

    setSubmittedReports([newReport, ...submittedReports]);
    setReportText('');
    Alert.alert('Success', 'Report submitted successfully');
  };

  const handleAddIncidentReport = () => {
    navigation.navigate('AddIncidentReport');
  };

  const handleEmergencyAlert = () => {
    Alert.alert(
      'Emergency Alert',
      'Are you sure you want to send an emergency alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Alert', 
          style: 'destructive',
          onPress: () => Alert.alert('Emergency Alert Sent', 'Help is on the way!')
        },
      ]
    );
  };

  const handleMenuPress = () => {
    console.log('Menu pressed');
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
  };

  const handleViewLocation = () => {
    console.log('View location pressed');
  };

  const renderCurrentShiftCard = () => (
    <AppCard style={styles.currentShiftCard}>
      <View style={styles.locationHeader}>
        <View style={styles.locationInfo}>
          <MapPinIcon size={20} color={COLORS.primary} />
          <View style={styles.locationText}>
            <Text style={styles.locationName}>Ocean View Vila</Text>
            <Text style={styles.locationAddress}>1321 Baker Street, NY</Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Active</Text>
        </View>
      </View>

      <Text style={styles.shiftDescription}>
        Make sure to check the parking lot for illegal parkings.
      </Text>

      <View style={styles.shiftTimeRow}>
        <Text style={styles.shiftTimeLabel}>Shift Time:</Text>
        <Text style={styles.shiftTimeValue}>08:00 am - 07:00 pm</Text>
      </View>

      <TextInput
        style={styles.reportInput}
        placeholder="Write shift report"
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={4}
        value={reportText}
        onChangeText={setReportText}
        textAlignVertical="top"
      />

      <AppButton
        title="Submit Report"
        onPress={handleSubmitReport}
        style={styles.submitButton}
      />

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.incidentButton} onPress={handleAddIncidentReport}>
          <AlertTriangleIcon size={16} color={COLORS.primary} style={styles.actionIconMargin} />
          <Text style={styles.incidentButtonText}>Add Incident Report</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyAlert}>
          <AlertCircleIcon size={16} color={COLORS.error} style={styles.actionIconMargin} />
          <Text style={styles.emergencyButtonText}>Emergency Alert</Text>
        </TouchableOpacity>
      </View>
    </AppCard>
  );

  const renderSubmittedReports = () => (
    <View style={styles.submittedReportsContainer}>
      <Text style={styles.sectionTitle}>Submitted Reports</Text>

      {submittedReports.map((report) => (
        <View key={report.id} style={styles.reportCard}>
          <View style={styles.locationHeader}>
            <View style={styles.locationInfo}>
              <MapPinIcon size={20} color={COLORS.textPrimary} />
              <View style={styles.locationText}>
                <Text style={styles.locationName}>{report.location}</Text>
                <Text style={styles.locationAddress}>{report.address}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.reportText}>{report.reportText}</Text>

          <View style={styles.reportFooter}>
            <View style={styles.reportType}>
              <AlertTriangleIcon size={14} color="#1C6CA9" style={styles.reportTypeIconMargin} />
              <Text style={styles.reportTypeText}>
                {report.type === 'incident' ? 'Incident report' : 'Shift report'}
              </Text>
              <Text style={styles.reportTypeArrow}>⌄</Text>
            </View>
            <Text style={styles.reportTime}>{report.submittedAt}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <AppScreen>
      <AppHeader
        title="My Reports"
        onMenuPress={handleMenuPress}
        onNotificationPress={handleNotificationPress}
      />
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              // TODO: Refresh reports data
              setTimeout(() => setRefreshing(false), 1000);
            }}
          />
        }
      >
        {renderCurrentShiftCard()}
        {renderSubmittedReports()}
      </ScrollView>

      {/* Floating Action Button for Quick Incident Report */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleAddIncidentReport}
        activeOpacity={0.8}
      >
        <FileTextIcon size={18} color="#FFFFFF" />
        <Text style={styles.fabText}>New Report</Text>
      </TouchableOpacity>
    </AppScreen>
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
  currentShiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationHeader: {
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
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4CAF50',
  },
  shiftDescription: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
    lineHeight: 20,
  },
  shiftTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  shiftTimeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  shiftTimeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  reportInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#1C6CA9',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  incidentIconMargin: {
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
  emergencyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D32F2F',
  },
  submittedReportsContainer: {
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  reportCard: {
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
  reportText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    marginBottom: 16,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportTypeIconMargin: {
    marginRight: 8,
  },
  reportTypeText: {
    fontSize: 14,
    color: '#1C6CA9',
    marginRight: 8,
  },
  reportTypeArrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  reportTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#1C6CA9',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIconMargin: {
    marginRight: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  actionIconMargin: {
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  incidentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F8FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  incidentButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3F3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  emergencyButtonText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});

export default ReportsScreen;
