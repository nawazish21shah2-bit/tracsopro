import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logoutUser, updateUserProfile } from '../../store/slices/authSlice';
import { 
  UserIcon,
  CheckCircleIcon,
  JobsIcon,
  LocationIcon,
  ShiftsIcon,
  NotificationIcon,
  InfoIcon,
  LogoutIcon,
  ChevronRightIcon
} from '../../components/ui/AppIcons';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import apiService from '../../services/api';

interface MenuOption {
  id: string;
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const isVerified = user?.isActive ?? false;
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  const handleProfilePictureSelected = async (imageUri: string) => {
    try {
      setIsUploadingPicture(true);
      const uploadResponse = await apiService.uploadProfilePicture(imageUri);
      
      if (uploadResponse.success && uploadResponse.data?.url) {
        // For guards, also update the guard profile
        if (user?.role === 'GUARD') {
          await apiService.updateGuardProfile({ 
            profilePictureUrl: uploadResponse.data.url 
          });
        }
        await dispatch(updateUserProfile({ 
          profilePictureUrl: uploadResponse.data.url 
        } as any)).unwrap();
        Alert.alert('Success', 'Profile picture updated successfully');
      } else {
        Alert.alert('Error', uploadResponse.message || 'Failed to upload profile picture');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile picture');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handlePastJobs = () => {
    Alert.alert('Past Jobs', 'View your completed assignments');
  };

  const handleAssignedSites = () => {
    Alert.alert('Assigned Sites', 'View your assigned locations');
  };

  const handleAttendanceRecord = () => {
    Alert.alert('Attendance Record', 'View your check-in/check-out history');
  };

  const handleNotificationSettings = () => {
    Alert.alert('Notification Settings', 'Manage your notification preferences');
  };

  const handleContactSupport = () => {
    Alert.alert('Contact Support', 'Get help from our support team');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => dispatch(logoutUser())
        },
      ]
    );
  };

  const menuOptions: MenuOption[] = [
    {
      id: '1',
      title: 'Past Jobs',
      icon: <CheckCircleIcon size={20} color="#666666" />,
      onPress: handlePastJobs,
    },
    {
      id: '2',
      title: 'Assigned Sites',
      icon: <LocationIcon size={20} color="#666666" />,
      onPress: handleAssignedSites,
    },
    {
      id: '3',
      title: 'Attendance Record',
      icon: <ShiftsIcon size={20} color="#666666" />,
      onPress: handleAttendanceRecord,
    },
    {
      id: '4',
      title: 'Notification Settings',
      icon: <NotificationIcon size={20} color="#666666" />,
      onPress: handleNotificationSettings,
    },
    {
      id: '5',
      title: 'Contact Support',
      icon: <InfoIcon size={20} color="#666666" />,
      onPress: handleContactSupport,
    },
  ];

  return (
    <SafeAreaWrapper>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <ProfileAvatar
              firstName={user?.firstName}
              lastName={user?.lastName}
              profilePictureUrl={user?.profilePictureUrl}
              size={60}
              editable={true}
              isLoading={isUploadingPicture}
              onImageSelected={handleProfilePictureSelected}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user ? `${user.firstName} ${user.lastName}` : 'Guard'}
              </Text>
              <View style={styles.verifiedRow}>
                <Text style={styles.verifiedText}>{isVerified ? 'Verified' : 'Inactive'}</Text>
                <View
                  style={[
                    styles.verifiedBadge,
                    !isVerified && { backgroundColor: '#B0B0B0' },
                  ]}
                >
                  <CheckCircleIcon size={14} color={isVerified ? '#4CAF50' : '#FFFFFF'} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          {menuOptions.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.menuItem,
                index === menuOptions.length - 1 && styles.lastMenuItem
              ]}
              onPress={option.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuItemIcon}>{option.icon}</View>
                <Text style={styles.menuItemTitle}>{option.title}</Text>
              </View>
              <ChevronRightIcon size={18} color="#9AA0A6" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogoutIcon size={18} color="#D32F2F" />
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    width: 32,
    alignItems: 'center',
  },
  menuItemTitle: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    marginLeft: 8,
  },
  logoutButton: {
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

export default ProfileScreen;
