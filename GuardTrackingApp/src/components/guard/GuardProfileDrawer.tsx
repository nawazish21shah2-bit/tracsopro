import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { CheckCircleIcon } from '../ui/AppIcons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';

interface GuardProfileDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToPastJobs?: () => void;
  onNavigateToAssignedSites?: () => void;
  onNavigateToAttendance?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToSupport?: () => void;
  onNavigateToEarnings?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  onPress: () => void;
}

export const GuardProfileDrawer: React.FC<GuardProfileDrawerProps> = ({
  visible,
  onClose,
  onNavigateToProfile,
  onNavigateToPastJobs,
  onNavigateToAssignedSites,
  onNavigateToAttendance,
  onNavigateToNotifications,
  onNavigateToSupport,
  onNavigateToEarnings,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);

  const handlePastJobs = () => {
    onClose();
    onNavigateToPastJobs?.();
  };

  const handleAssignedSites = () => {
    onClose();
    onNavigateToAssignedSites?.();
  };

  const handleAttendanceRecord = () => {
    onClose();
    onNavigateToAttendance?.();
  };

  const handleEarnings = () => {
    onClose();
    onNavigateToEarnings?.();
  };

  const handleNotificationSettings = () => {
    onClose();
    onNavigateToNotifications?.();
  };

  const handleContactSupport = () => {
    onClose();
    onNavigateToSupport?.();
  };

  const menuItems: MenuItem[] = [
    {
      id: 'pastJobs',
      label: 'Past Jobs',
      onPress: handlePastJobs,
    },
    {
      id: 'assignedSites',
      label: 'Assigned Sites',
      onPress: handleAssignedSites,
    },
    {
      id: 'attendance',
      label: 'Attendance Record',
      onPress: handleAttendanceRecord,
    },
    {
      id: 'earnings',
      label: 'Earnings',
      onPress: handleEarnings,
    },
    {
      id: 'notifications',
      label: 'Notification Settings',
      onPress: handleNotificationSettings,
    },
  ];

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Mark Husdon';
  const isVerified = user?.isActive ?? true;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.drawer}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {fullName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </Text>
              </View>
            </View>
            <Text style={styles.userName}>{fullName}</Text>
            {isVerified && (
              <View style={styles.verifiedContainer}>
                <Text style={styles.verifiedText}>Verified</Text>
                <CheckCircleIcon size={14} color={COLORS.textSecondary} />
              </View>
            )}
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Contact Support */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.supportButton}
              onPress={handleContactSupport}
              activeOpacity={0.7}
            >
              <Text style={styles.supportText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  drawer: {
    width: '70%',
    backgroundColor: COLORS.backgroundPrimary,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  userName: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: 8,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  supportButton: {
    paddingVertical: 12,
  },
  supportText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
});

export default GuardProfileDrawer;
