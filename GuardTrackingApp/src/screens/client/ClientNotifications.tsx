import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import NotificationCard from '../../components/client/NotificationCard';
import SharedHeader from '../../components/ui/SharedHeader';
import ClientProfileDrawer from '../../components/client/ClientProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';

interface NotificationData {
  id: string;
  guardName: string;
  guardAvatar?: string;
  action: string;
  site: string;
  time?: string;
  status: 'Active';
}

const ClientNotifications: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<StackNavigationProp<ClientStackParamList>>();
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();

  const [notifications, setNotifications] = useState<NotificationData[]>([
    {
      id: '1',
      guardName: 'Mark Husdon',
      action: 'Checked in at 08:12 am',
      site: 'Site Alpha',
      status: 'Active',
    },
    {
      id: '2',
      guardName: 'Mark Husdon',
      action: 'Sent a incident report',
      site: 'Site Alpha',
      status: 'Active',
    },
  ]);

  const handleNotificationPress = (notificationId: string) => {
    console.log('Notification pressed:', notificationId);
  };

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="client"
        title="Notification"
        profileDrawer={
          <ClientProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToNotifications={() => {
              closeDrawer();
            }}
          />
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onPress={() => handleNotificationPress(notification.id)}
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
  content: {
    flex: 1,
    padding: 20,
  },
});

export default ClientNotifications;
