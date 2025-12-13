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
import { ChevronRight, User, Bell, HelpCircle, LogOut, Lock } from 'react-native-feather';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { GuardStackParamList } from '../../navigation/GuardStackNavigator';
import { RootState, AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import SharedHeader from '../../components/ui/SharedHeader';
import GuardProfileDrawer from '../../components/guard/GuardProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';

// Hardcoded colors to avoid module load issues
const ICON_COLOR = '#828282';
const ERROR_COLOR = '#F44336';

interface SettingItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}

const GuardSettingsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<GuardStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();

  const handleProfile = () => {
    navigation.navigate('GuardProfileEdit');
  };

  const handleNotifications = () => {
    navigation.navigate('GuardNotificationSettings');
  };

  const handleChangePassword = () => {
    navigation.navigate('GuardChangePassword');
  };

  const handleSupport = () => {
    navigation.navigate('GuardSupportContact');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => dispatch(logoutUser()) },
    ]);
  };

  const items: SettingItem[] = [
    { id: '1', title: 'My Profile', icon: <User width={20} height={20} color={ICON_COLOR} />, onPress: handleProfile },
    { id: '2', title: 'Notifications', icon: <Bell width={20} height={20} color={ICON_COLOR} />, onPress: handleNotifications },
    { id: '3', title: 'Change Password', icon: <Lock width={20} height={20} color={ICON_COLOR} />, onPress: handleChangePassword },
    { id: '4', title: 'Contact Support', icon: <HelpCircle width={20} height={20} color={ICON_COLOR} />, onPress: handleSupport },
  ];

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="guard"
        title="Settings"
        profileDrawer={
          <GuardProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToProfile={() => {
              closeDrawer();
              navigation.navigate('GuardProfileEdit');
            }}
            onNavigateToNotifications={() => {
              closeDrawer();
              navigation.navigate('GuardNotificationSettings');
            }}
            onNavigateToSupport={() => {
              closeDrawer();
              navigation.navigate('GuardSupportContact');
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
              <ChevronRight width={18} height={18} color={ICON_COLOR} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <LogOut width={18} height={18} color={ERROR_COLOR} />
          <Text style={styles.logoutText}> Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

// Use hardcoded values in StyleSheet.create since it's evaluated at module load time
const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DCDCDC',
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ACD3F1',
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
    color: '#000000',
    fontWeight: '500',
    marginLeft: 12,
  },
  logout: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    paddingVertical: 12,
  },
  logoutText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default GuardSettingsScreen;
