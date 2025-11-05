import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { PersonIcon } from '../ui/AppIcons';
import StatusBadge from './StatusBadge';

interface ReportCardProps {
  report: {
    id: string;
    type: 'Medical Emergency' | 'Incident' | 'Violation' | 'Maintenance';
    guardName: string;
    guardAvatar?: string;
    site: string;
    time: string;
    description: string;
    status: 'Respond' | 'New' | 'Reviewed';
    checkInTime?: string;
  };
  onPress?: () => void;
  onRespond?: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onPress, onRespond }) => {
  const getTypeIcon = () => {
    switch (report.type) {
      case 'Medical Emergency':
        return '🚨';
      case 'Incident':
        return '⚠️';
      case 'Violation':
        return '⚠️';
      case 'Maintenance':
        return '🔧';
      default:
        return '📋';
    }
  };

  const getTypeColor = () => {
    switch (report.type) {
      case 'Medical Emergency':
        return '#D32F2F';
      case 'Incident':
        return '#FF9500';
      case 'Violation':
        return '#FF9500';
      case 'Maintenance':
        return '#1976D2';
      default:
        return '#666666';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <View style={[styles.typeIcon, { backgroundColor: getTypeColor() + '15' }]}>
            <Text style={styles.typeEmoji}>{getTypeIcon()}</Text>
          </View>
          <View style={styles.typeInfo}>
            <Text style={[styles.typeText, { color: getTypeColor() }]}>{report.type}</Text>
            <Text style={styles.siteText}>{report.site} • {report.time}</Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <StatusBadge status={report.status} size="small" />
          {report.status === 'Respond' && onRespond && (
            <TouchableOpacity style={styles.respondButton} onPress={onRespond}>
              <Text style={styles.respondButtonText}>Respond</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.guardSection}>
        <Text style={styles.guardOnDutyLabel}>Guard On Duty</Text>
        <View style={styles.guardInfo}>
          <View style={styles.avatar}>
            {report.guardAvatar ? (
              <Image source={{ uri: report.guardAvatar }} style={styles.avatarImage} />
            ) : (
              <PersonIcon size={20} color="#666" />
            )}
          </View>
          <View style={styles.guardDetails}>
            <Text style={styles.guardName}>{report.guardName}</Text>
            {report.checkInTime && (
              <Text style={styles.checkInTime}>Checked In at {report.checkInTime}</Text>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.description}>{report.description}</Text>
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
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeEmoji: {
    fontSize: 18,
  },
  typeInfo: {
    flex: 1,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  siteText: {
    fontSize: 12,
    color: '#666666',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  respondButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  respondButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  guardSection: {
    marginBottom: 12,
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
  checkInTime: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
});

export default ReportCard;
