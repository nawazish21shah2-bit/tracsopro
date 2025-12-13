import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { globalStyles, COLORS, SPACING } from '../../styles/globalStyles';
import { AppScreen, AppCard, AppButton } from '../../components/ui/AppComponents';
import SharedHeader from '../../components/ui/SharedHeader';
import GuardProfileDrawer from '../../components/guard/GuardProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { LocationCard } from '../../components/ui/LocationCard';
import { MenuIcon, BellIcon, UserIcon, MapPinIcon, ExternalLinkIcon, CheckCircleIcon } from '../../components/ui/FeatherIcons';

interface Job {
  id: string;
  employer: string;
  employerAvatar: string;
  location: string;
  address: string;
  description: string;
  shiftDate: string;
  shiftTime: string;
  duration: string;
  isVerified: boolean;
}

const JobsScreen: React.FC = () => {
  const [availableJobs] = useState<Job[]>([
    {
      id: '1',
      employer: 'Mark Husdon',
      employerAvatar: '👤',
      location: 'Ocean View Vila',
      address: '1321 Baker Street, NY',
      description: 'Need a personal to stand guard at main gate.',
      shiftDate: '27-10-2025',
      shiftTime: '08:00 am - 07:00 pm',
      duration: '11 hrs',
      isVerified: true,
    },
    {
      id: '2',
      employer: 'Mark Husdon',
      employerAvatar: '👤',
      location: 'Ocean View Vila',
      address: '1321 Baker Street, NY',
      description: 'Need a personal to stand guard at main gate.',
      shiftDate: '27-10-2025',
      shiftTime: '08:00 am - 07:00 pm',
      duration: '11 hrs',
      isVerified: true,
    },
    {
      id: '3',
      employer: 'Mark Husdon',
      employerAvatar: '👤',
      location: 'Ocean View Vila',
      address: '1321 Baker Street, NY',
      description: 'Need a personal to stand guard at main gate.',
      shiftDate: '27-10-2025',
      shiftTime: '08:00 am - 07:00 pm',
      duration: '11 hrs',
      isVerified: true,
    },
  ]);

  const handleApplyJob = (jobId: string) => {
    Alert.alert(
      'Apply for Job',
      'Are you sure you want to apply for this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply', 
          onPress: () => Alert.alert('Success', 'Your application has been submitted!')
        },
      ]
    );
  };

  const handleViewJobDetails = (jobId: string) => {
    Alert.alert('Job Details', 'Opening detailed job information...');
  };

  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();

  const handleNotificationPress = () => {
    (navigation as any).navigate('Notifications');
  };
    console.log('Notification pressed');
  };

  return (
    <AppScreen>
      <SharedHeader
        variant="guard"
        title="Jobs"
        onNotificationPress={handleNotificationPress}
        profileDrawer={
          <GuardProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
          />
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {availableJobs.map((job) => (
          <AppCard key={job.id} style={styles.jobCard}>
            {/* Employer Info */}
            <View style={styles.employerHeader}>
              <View style={styles.employerAvatar}>
                <UserIcon size={20} color={COLORS.textPrimary} />
              </View>
              <View style={styles.employerInfo}>
                <View style={styles.employerNameRow}>
                  <Text style={styles.employerName}>{job.employer}</Text>
                  {job.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <CheckCircleIcon size={14} color={'#4CAF50'} />
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Location Info */}
            <LocationCard
              location={job.location}
              address={job.address}
              onViewLocation={() => handleViewJobDetails(job.id)}
              style={styles.jobCard}
            />

            {/* Job Description */}
            <Text style={styles.jobDescription}>{job.description}</Text>

            {/* Job Details */}
            <View style={styles.jobDetails}>
              <View style={styles.jobDetailRow}>
                <Text style={styles.jobDetailLabel}>Shift Date:</Text>
                <Text style={styles.jobDetailValue}>{job.shiftDate}</Text>
              </View>
              <View style={styles.jobDetailRow}>
                <Text style={styles.jobDetailLabel}>Shift Time:</Text>
                <Text style={styles.jobDetailValue}>{job.shiftTime}</Text>
              </View>
              <View style={styles.jobDetailRow}>
                <Text style={styles.jobDetailLabel}>Shift Start In:</Text>
                <Text style={styles.jobDetailValue}>{job.duration}</Text>
              </View>
            </View>

            {/* Apply Button */}
            <AppButton
              title="Apply now"
              onPress={() => handleApplyJob(job.id)}
              style={styles.applyButton}
            />
          </AppCard>
        ))}
      </ScrollView>
    </AppScreen>
  );
};

const styles = {
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
  jobCard: {
    marginBottom: SPACING.lg,
  },
  employerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING.md,
  },
  employerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: SPACING.md,
  },
  employerAvatarText: {
    fontSize: 18,
  },
  employerInfo: {
    flex: 1,
  },
  employerNameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  employerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginRight: SPACING.xs,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  verifiedIcon: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold' as const,
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
  externalLinkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  externalLinkIcon: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  jobDescription: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  jobDetails: {
    marginBottom: SPACING.lg,
  },
  jobDetailRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: SPACING.sm,
  },
  jobDetailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  jobDetailValue: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.textPrimary,
  },
  applyButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};

export default JobsScreen;
