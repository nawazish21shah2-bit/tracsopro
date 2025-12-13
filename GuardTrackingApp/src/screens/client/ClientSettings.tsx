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
import { ChevronRight, User, Briefcase, MapPin, Bell, HelpCircle, LogOut, Lock } from 'react-native-feather';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';
import { RootState, AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import SharedHeader from '../../components/ui/SharedHeader';
import ClientProfileDrawer from '../../components/client/ClientProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import * as theme from '../../styles/globalStyles';

// Safely access design tokens for StyleSheet.create
const COLORS = theme.COLORS || {
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  borderCard: '#E0E0E0',
  error: '#D32F2F',
};
const TYPOGRAPHY = theme.TYPOGRAPHY || {
  fontSize: { md: 15 },
  fontWeight: { medium: '500' as const, semibold: '600' as const },
};
const SPACING = theme.SPACING || { xs: 4, sm: 8, md: 12, lg: 16 };
const BORDER_RADIUS = theme.BORDER_RADIUS || { lg: 12 };

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
    // Navigate to Sites & Shifts tab in ClientTabs
    try {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('ClientTabs', { screen: 'Sites & Shifts' });
      } else {
        // Fallback: navigate to ClientTabs
        navigation.navigate('ClientTabs');
      }
    } catch (error) {
      // Fallback: navigate to ClientTabs
      navigation.navigate('ClientTabs');
    }
  };

  const handleNotifications = () => {
    navigation.navigate('NotificationSettings');
  };

  const handleChangePassword = () => {
    navigation.navigate('ClientChangePassword');
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
    { id: '5', title: 'Change Password', icon: <Lock width={20} height={20} color="#666666" />, onPress: handleChangePassword },
    { id: '6', title: 'Contact Support', icon: <HelpCircle width={20} height={20} color="#666666" />, onPress: handleSupport },
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
              <ChevronRight width={18} height={18} color={COLORS.textSecondary} />
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
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
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
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginLeft: SPACING.md,
  },
  logout: {
    marginTop: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.xs,
  },
});

export default ClientSettings;
