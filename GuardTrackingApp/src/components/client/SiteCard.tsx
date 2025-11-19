import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { PersonIcon, LocationIcon } from '../ui/AppIcons';
import StatusBadge from './StatusBadge';
import { globalStyles } from '../../styles/globalStyles';

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
    guardId?: string;
  };
  onPress?: () => void;
  onMoreOptions?: () => void;
  onChatWithGuard?: (guardId: string, guardName: string) => void;
}

const SiteCard: React.FC<SiteCardProps> = ({ site, onPress, onMoreOptions, onChatWithGuard }) => {
  return (
    <TouchableOpacity style={[globalStyles.card, styles.card]} onPress={onPress} activeOpacity={0.7}>
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
          <View style={styles.rightSection}>
            {onChatWithGuard && site.guardId && site.status === 'Active' && (
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={() => onChatWithGuard(site.guardId!, site.guardName)}
              >
                <Text style={styles.chatButtonText}>💬</Text>
              </TouchableOpacity>
            )}
            <StatusBadge status={site.status} size="small" />
          </View>
        </View>
      </View>
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
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  chatButtonText: {
    fontSize: 14,
  },
});

export default SiteCard;
