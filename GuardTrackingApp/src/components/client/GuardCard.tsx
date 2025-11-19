import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { PersonIcon } from '../ui/AppIcons';
import StatusBadge from './StatusBadge';
import { globalStyles } from '../../styles/globalStyles';

interface GuardCardProps {
  guard: {
    id: string;
    name: string;
    avatar?: string;
    site?: string;
    shiftTime?: string;
    status: 'Active' | 'Upcoming' | 'Missed' | 'Completed';
    checkInTime?: string;
    checkOutTime?: string;
    pastJobs?: number;
    rating?: number;
    availability?: string;
  };
  onPress?: () => void;
  onHire?: () => void;
  showHireButton?: boolean;
}

const GuardCard: React.FC<GuardCardProps> = ({ guard, onPress, onHire, showHireButton = false }) => {
  return (
    <TouchableOpacity style={[globalStyles.card, styles.card]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.guardInfo}>
          <View style={styles.avatar}>
            {guard.avatar ? (
              <Image source={{ uri: guard.avatar }} style={styles.avatarImage} />
            ) : (
              <PersonIcon size={24} color="#666" />
            )}
          </View>
          <View style={styles.details}>
            <Text style={styles.name}>{guard.name}</Text>
            {guard.site && <Text style={styles.site}>{guard.site}</Text>}
            {showHireButton && guard.pastJobs && (
              <Text style={styles.pastJobs}>Past Jobs: {guard.pastJobs}</Text>
            )}
            {showHireButton && guard.rating && (
              <Text style={styles.rating}>Rating: {guard.rating}/5</Text>
            )}
            {showHireButton && guard.availability && (
              <Text style={styles.availability}>Availability: {guard.availability}</Text>
            )}
          </View>
        </View>
        {showHireButton ? (
          <TouchableOpacity style={styles.hireButton} onPress={onHire}>
            <Text style={styles.hireButtonText}>Hire Now</Text>
          </TouchableOpacity>
        ) : (
          <StatusBadge status={guard.status} />
        )}
      </View>
      
      {!showHireButton && (
        <View style={styles.shiftDetails}>
          <View style={styles.shiftInfo}>
            <Text style={styles.shiftTime}>{guard.shiftTime}</Text>
            {guard.status === 'Active' && guard.checkInTime && (
              <Text style={styles.checkInTime}>Checked in at {guard.checkInTime}</Text>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  site: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  pastJobs: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  rating: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  availability: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  hireButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hireButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  shiftDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  shiftInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftTime: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  checkInTime: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
});

export default GuardCard;
