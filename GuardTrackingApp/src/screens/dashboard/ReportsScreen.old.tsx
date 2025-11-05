import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { globalStyles, COLORS, SPACING } from '../../styles/globalStyles';
import { AppScreen, AppCard, AppButton } from '../../components/ui/AppComponents';

interface ShiftReport {
  id: string;
  location: string;
  address: string;
  shiftTime: string;
  reportText: string;
  submittedAt: string;
  type: 'incident' | 'shift';
}

type ReportsScreenNavigationProp = StackNavigationProp<any, 'Reports'>;

const ReportsScreen: React.FC = () => {
  const navigation = useNavigation<ReportsScreenNavigationProp>();
  const [reportText, setReportText] = useState('');
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

  return (
    <AppScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reports</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Shift Report */}
        <AppCard style={styles.currentShiftCard}>
          <View style={styles.locationHeader}>
            <View style={styles.locationIcon}>
              <Text style={styles.locationIconText}>📍</Text>
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>Ocean View Vila</Text>
              <Text style={styles.locationAddress}>1321 Baker Street, NY</Text>
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
            placeholderTextColor={COLORS.textSecondary}
            multiline
            numberOfLines={4}
            value={reportText}
            onChangeText={setReportText}
            textAlignVertical="top"
          />

          <AppButton
            title="Submit"
            onPress={handleSubmitReport}
            style={styles.submitButton}
          />

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.incidentButton}
              onPress={handleAddIncidentReport}
            >
              <Text style={styles.incidentButtonIcon}>📋</Text>
              <Text style={styles.incidentButtonText}>Add Incident Report</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.emergencyButton}
              onPress={handleEmergencyAlert}
            >
              <Text style={styles.emergencyButtonIcon}>⚠️</Text>
              <Text style={styles.emergencyButtonText}>Emergency Alert</Text>
            </TouchableOpacity>
          </View>
        </AppCard>

        {/* Submitted Reports */}
        <Text style={styles.sectionTitle}>Submitted Reports</Text>

        {submittedReports.map((report) => (
          <AppCard key={report.id} style={styles.reportCard}>
            <View style={styles.locationHeader}>
              <View style={styles.locationIcon}>
                <Text style={styles.locationIconText}>📍</Text>
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{report.location}</Text>
                <Text style={styles.locationAddress}>{report.address}</Text>
              </View>
            </View>

            <Text style={styles.reportText}>{report.reportText}</Text>

            <View style={styles.reportFooter}>
              <View style={styles.reportType}>
                <Text style={styles.reportTypeIcon}>📋</Text>
                <Text style={styles.reportTypeText}>
                  {report.type === 'incident' ? 'Incident report' : 'Shift report'}
                </Text>
                <Text style={styles.reportTypeArrow}>⌄</Text>
              </View>
              <Text style={styles.reportTime}>{report.submittedAt}</Text>
            </View>
          </AppCard>
        ))}
      </ScrollView>

      {/* Floating Action Button for Quick Incident Report */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleAddIncidentReport}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>📋</Text>
        <Text style={styles.fabText}>New Report</Text>
      </TouchableOpacity>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
  },
  menuButton: {
    padding: SPACING.sm,
  },
  menuIcon: {
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  notificationButton: {
    padding: SPACING.sm,
  },
  notificationIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  currentShiftCard: {
    marginBottom: SPACING.lg,
  },
  locationHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING.md,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: SPACING.md,
  },
  locationIconText: {
    fontSize: 18,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#4CAF50',
  },
  shiftDescription: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  shiftTimeRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: SPACING.lg,
  },
  shiftTimeLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  shiftTimeValue: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.textPrimary,
  },
  reportInput: {
    borderWidth: 1,
    borderColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.backgroundPrimary,
    marginBottom: SPACING.lg,
    minHeight: 100,
  },
  submitButton: {
    marginBottom: SPACING.lg,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: SPACING.md,
  },
  incidentButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#E3F2FD',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
  },
  incidentButtonIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  incidentButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#1976D2',
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#FFEBEE',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
  },
  emergencyButtonIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  emergencyButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#D32F2F',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginVertical: SPACING.lg,
  },
  reportCard: {
    marginBottom: SPACING.md,
  },
  reportText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  reportFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  reportType: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  reportTypeIcon: {
    fontSize: 14,
    marginRight: SPACING.xs,
  },
  reportTypeText: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
  reportTypeArrow: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  reportTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  fab: {
    position: 'absolute' as const,
    bottom: 80,
    right: SPACING.lg,
    backgroundColor: '#1C6CA9',
    borderRadius: 28,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 18,
    marginRight: SPACING.xs,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});

export default ReportsScreen;
