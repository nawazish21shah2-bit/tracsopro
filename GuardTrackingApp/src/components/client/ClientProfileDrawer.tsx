import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import {
  User,
  MapPin,
  Users,
  FileText,
  Bell,
  HelpCircle,
  LogOut,
  X,
  Shield,
  Home,
  BarChart,
} from 'react-native-feather';
import { UI_COLORS, getIconContainerStyle, getTextStyle } from '../../styles/uiStyles';
import StreamlinedCard from '../ui/StreamlinedCard';

interface ClientProfileDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToSites?: () => void;
  onNavigateToGuards?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToSupport?: () => void;
}

interface MenuOption {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onPress: () => void;
  showChevron?: boolean;
}

export const ClientProfileDrawer: React.FC<ClientProfileDrawerProps> = ({
  visible,
  onClose,
  onNavigateToProfile,
  onNavigateToSites,
  onNavigateToGuards,
  onNavigateToReports,
  onNavigateToAnalytics,
  onNavigateToNotifications,
  onNavigateToSupport,
}) => {
  console.log('ClientProfileDrawer visible:', visible);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleMyProfile = () => {
    onClose();
    if (onNavigateToProfile) {
      onNavigateToProfile();
    } else {
      Alert.alert('My Profile', 'View and edit your profile information');
    }
  };

  const handleManageSites = () => {
    onClose();
    if (onNavigateToSites) {
      onNavigateToSites();
    } else {
      Alert.alert('Manage Sites', 'View and manage your security sites');
    }
  };

  const handleManageGuards = () => {
    onClose();
    if (onNavigateToGuards) {
      onNavigateToGuards();
    } else {
      Alert.alert('Manage Guards', 'View and manage your security guards');
    }
  };

  const handleViewReports = () => {
    onClose();
    if (onNavigateToReports) {
      onNavigateToReports();
    } else {
      Alert.alert('View Reports', 'Access shift and incident reports');
    }
  };

  const handleAnalytics = () => {
    onClose();
    if (onNavigateToAnalytics) {
      onNavigateToAnalytics();
    } else {
      Alert.alert('Analytics', 'View performance analytics and insights');
    }
  };

  const handleNotificationSettings = () => {
    onClose();
    if (onNavigateToNotifications) {
      onNavigateToNotifications();
    } else {
      Alert.alert('Notification Settings', 'Manage your notification preferences');
    }
  };

  const handleContactSupport = () => {
    onClose();
    if (onNavigateToSupport) {
      onNavigateToSupport();
    } else {
      Alert.alert('Contact Support', 'Get help from our support team');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            onClose();
            dispatch(logoutUser());
          },
        },
      ]
    );
  };

  const menuOptions: MenuOption[] = [
    {
      id: 'profile',
      title: 'My Profile',
      subtitle: 'View and edit company information',
      icon: <User width={20} height={20} color="#666666" />,
      onPress: handleMyProfile,
      showChevron: true,
    },
    {
      id: 'sites',
      title: 'Manage Sites',
      subtitle: 'View and manage security locations',
      icon: <MapPin width={20} height={20} color="#666666" />,
      onPress: handleManageSites,
      showChevron: true,
    },
    {
      id: 'guards',
      title: 'Manage Guards',
      subtitle: 'View and manage security personnel',
      icon: <Users width={20} height={20} color="#666666" />,
      onPress: handleManageGuards,
      showChevron: true,
    },
    {
      id: 'reports',
      title: 'View Reports',
      subtitle: 'Access shift and incident reports',
      icon: <FileText width={20} height={20} color="#666666" />,
      onPress: handleViewReports,
      showChevron: true,
    },
    {
      id: 'analytics',
      title: 'Analytics',
      subtitle: 'Performance insights and metrics',
      icon: <BarChart width={20} height={20} color="#666666" />,
      onPress: handleAnalytics,
      showChevron: true,
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      subtitle: 'Manage notification preferences',
      icon: <Bell width={20} height={20} color="#666666" />,
      onPress: handleNotificationSettings,
      showChevron: true,
    },
    {
      id: 'support',
      title: 'Contact Support',
      subtitle: 'Get help from our support team',
      icon: <HelpCircle width={20} height={20} color="#666666" />,
      onPress: handleContactSupport,
      showChevron: true,
    },
  ];

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Home width={40} height={40} color="#1C6CA9" />
        </View>
        <View style={styles.verificationBadge}>
          <Shield width={16} height={16} color="#FFFFFF" />
        </View>
      </View>
      
      <View style={styles.profileInfo}>
        <Text style={styles.userName}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.userRole}>Client Administrator</Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Active Account</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <X width={24} height={24} color="#666666" />
      </TouchableOpacity>
    </View>
  );

  const renderStatsSection = () => (
    <View style={styles.statsSection}>
      <View style={styles.statItem}>
        <MapPin width={18} height={18} color="#1C6CA9" />
        <Text style={styles.statNumber}>12</Text>
        <Text style={styles.statLabel}>Sites</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Users width={18} height={18} color="#10B981" />
        <Text style={styles.statNumber}>48</Text>
        <Text style={styles.statLabel}>Guards</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <BarChart width={18} height={18} color="#F59E0B" />
        <Text style={styles.statNumber}>98%</Text>
        <Text style={styles.statLabel}>Uptime</Text>
      </View>
    </View>
  );

  const renderMenuOption = (option: MenuOption) => (
    <StreamlinedCard
      key={option.id}
      title={option.title}
      subtitle={option.subtitle}
      icon={option.icon}
      showChevron={option.showChevron}
      onPress={option.onPress}
    />
  );

  const renderLogoutButton = () => (
    <TouchableOpacity
      style={styles.logoutButton}
      onPress={handleLogout}
      activeOpacity={0.7}
    >
      <View style={styles.logoutIconContainer}>
        <LogOut width={20} height={20} color="#DC2626" />
      </View>
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
  );

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {renderProfileHeader()}
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStatsSection()}
          
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Account & Management</Text>
            {menuOptions.map(renderMenuOption)}
          </View>
          
          <View style={styles.logoutSection}>
            {renderLogoutButton()}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingTop: 44, // Reduced padding for better display
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1C6CA9',
  },
  verificationBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logoutSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#DC2626',
  },
});

export default ClientProfileDrawer;
