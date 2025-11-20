import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import ReportCard from '../../components/client/ReportCard';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';
import SharedHeader from '../../components/ui/SharedHeader';
import ClientProfileDrawer from '../../components/client/ClientProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';

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

  const [reports, setReports] = useState<ReportData[]>([
    {
      id: '1',
      type: 'Medical Emergency',
      guardName: 'Mark Husdon',
      site: 'Site Alpha',
      time: '10:30 Am',
      description: 'Visitor collapsed in main lobby',
      status: 'Respond',
      checkInTime: '08:12 am',
      guardId: 'guard_1',
    },
    {
      id: '2',
      type: 'Incident',
      guardName: 'Mark Husdon',
      site: 'Site Alpha',
      time: '10:30 Am',
      description: 'Unauthorized vehicle in parking area. License plate recorded',
      status: 'New',
      checkInTime: '08:12 am',
      guardId: 'guard_1',
    },
    {
      id: '3',
      type: 'Violation',
      guardName: 'Mark Husdon',
      site: 'Site Alpha',
      time: '10:30 Am',
      description: 'Employee smoking in non-designated area, Issued Warning.',
      status: 'New',
      checkInTime: '08:12 am',
      guardId: 'guard_1',
    },
    {
      id: '4',
      type: 'Maintenance',
      guardName: 'Mark Husdon',
      site: 'Site Alpha',
      time: '10:30 Am',
      description: 'Employee smoking in non-designated area, Issued Warning.',
      status: 'Reviewed',
      checkInTime: '08:12 am',
      guardId: 'guard_1',
    },
  ]);

  const handleReportPress = (reportId: string) => {
    console.log('Report pressed:', reportId);
  };

  const handleRespond = (reportId: string) => {
    console.log('Respond to report:', reportId);
    // Update report status or navigate to response screen
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {reports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onPress={() => handleReportPress(report.id)}
            onRespond={() => handleRespond(report.id)}
            onChatWithGuard={handleChatWithGuard}
          />
        ))}
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
});

export default ClientReports;
