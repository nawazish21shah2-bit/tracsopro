import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { PersonIcon, LocationIcon } from '../ui/AppIcons';
import StatusBadge from './StatusBadge';

interface SiteCardProps {
  site: {
    id: string;
    name: string;
    address: string;
    guardName: string;
    guardAvatar?: string;
    status: 'Active' | 'Upcoming' | 'Missed';
    shiftTime?: string;
    checkInTime?: string;
  };
  onPress?: () => void;
  onMoreOptions?: () => void;
}

const SiteCard: React.FC<SiteCardProps> = ({ site, onPress, onMoreOptions }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.siteInfo}>
          <View style={styles.locationIcon}>
            <LocationIcon size={20} color="#1976D2" />
          </View>
          <View style={styles.siteDetails}>
            <Text style={styles.siteName}>{site.name}</Text>
            <Text style={styles.siteAddress}>{site.address}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton} onPress={onMoreOptions}>
          <Text style={styles.moreButtonText}>•••</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.guardSection}>
        <Text style={styles.guardOnDutyLabel}>Guard On Duty</Text>
        <View style={styles.guardInfo}>
          <View style={styles.avatar}>
            {site.guardAvatar ? (
              <Image source={{ uri: site.guardAvatar }} style={styles.avatarImage} />
            ) : (
              <PersonIcon size={20} color="#666" />
            )}
          </View>
          <View style={styles.guardDetails}>
            <Text style={styles.guardName}>{site.guardName}</Text>
            {site.shiftTime && (
              <Text style={styles.shiftTime}>{site.shiftTime}</Text>
            )}
            {site.status === 'Active' && site.checkInTime && (
              <Text style={styles.checkInTime}>Checked in at {site.checkInTime}</Text>
            )}
          </View>
          <StatusBadge status={site.status} size="small" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  siteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  siteDetails: {
    flex: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  siteAddress: {
    fontSize: 12,
    color: '#666666',
  },
  moreButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 18,
    color: '#666666',
    fontWeight: 'bold',
  },
  guardSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  guardOnDutyLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  guardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  guardDetails: {
    flex: 1,
  },
  guardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  shiftTime: {
    fontSize: 12,
    color: '#666666',
  },
  checkInTime: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
});

export default SiteCard;
