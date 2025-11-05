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
import { MenuIcon, NotificationIcon } from '../../components/ui/AppIcons';
import NotificationCard from '../../components/client/NotificationCard';

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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <MenuIcon size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <NotificationIcon size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onPress={() => handleNotificationPress(notification.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
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

export default ClientNotifications;
