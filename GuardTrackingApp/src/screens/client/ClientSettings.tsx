import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChevronRight, User, Briefcase, MapPin, Bell, HelpCircle, LogOut } from 'react-native-feather';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';
import { RootState, AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import SharedHeader from '../../components/ui/SharedHeader';
import ClientProfileDrawer from '../../components/client/ClientProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';

interface SettingItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}

const ClientSettings: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<ClientStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();

  const handleProfile = () => {
    navigation.navigate('ProfileEdit');
  };

  const handleCompanyDetails = () => {
    navigation.navigate('CompanyDetails');
  };

  const handleManageSites = () => {
    // Navigate to sites management (usually in the main client tabs)
    // For now, show a message that this is available in the main navigation
    Alert.alert(
      'Manage Sites & Shifts',
      'Site and shift management is available in the main navigation menu.',
      [{ text: 'OK' }]
    );
  };

  const handleNotifications = () => {
    navigation.navigate('NotificationSettings');
  };

  const handleSupport = () => {
    navigation.navigate('SupportContact');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => dispatch(logoutUser()) },
    ]);
  };

  const items: SettingItem[] = [
    { id: '1', title: 'My Profile', icon: <User width={20} height={20} color="#666666" />, onPress: handleProfile },
    { id: '2', title: 'Company Details', icon: <Briefcase width={20} height={20} color="#666666" />, onPress: handleCompanyDetails },
    { id: '3', title: 'Manage Sites & Shifts', icon: <MapPin width={20} height={20} color="#666666" />, onPress: handleManageSites },
    { id: '4', title: 'Notifications', icon: <Bell width={20} height={20} color="#666666" />, onPress: handleNotifications },
    { id: '5', title: 'Contact Support', icon: <HelpCircle width={20} height={20} color="#666666" />, onPress: handleSupport },
  ];

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="client"
        title="Settings"
        profileDrawer={
          <ClientProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToNotifications={() => {
              closeDrawer();
              navigation.navigate('ClientNotifications');
            }}
          />
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {items.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.row, idx === items.length - 1 && styles.lastRow]}
              onPress={item.onPress}
            >
              <View style={styles.left}>
                <View style={styles.iconWrap}>{item.icon}</View>
                <Text style={styles.title}>{item.title}</Text>
              </View>
              <ChevronRight width={18} height={18} color="#9AA0A6" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <LogOut width={18} height={18} color="#D32F2F" />
          <Text style={styles.logoutText}> Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    marginLeft: 8,
  },
  logout: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    paddingVertical: 14,
  },
  logoutText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default ClientSettings;
