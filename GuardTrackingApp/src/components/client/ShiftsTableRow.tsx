import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { PersonIcon } from '../ui/AppIcons';
import StatusBadge from './StatusBadge';

interface ShiftsTableRowProps {
  guard: {
    id: string;
    name: string;
    avatar?: string;
    site?: string;
    shiftTime?: string;
    status: 'Active' | 'Upcoming' | 'Missed' | 'Completed';
    checkInTime?: string;
    checkOutTime?: string;
  };
  onPress?: () => void;
}

const ShiftsTableRow: React.FC<ShiftsTableRowProps> = ({ guard, onPress }) => {
  const formatTime = (time?: string) => {
    if (!time) return '--:--';
    try {
      const date = new Date(time);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'Pm' : 'Am';
      const displayHours = hours % 12 || 12;
      return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } catch {
      return time;
    }
  };

  const formatShiftTime = (shiftTime?: string) => {
    if (!shiftTime) return '--:--';
    // If already formatted, return as is
    if (shiftTime.includes('Am') || shiftTime.includes('Pm')) {
      return shiftTime;
    }
    // Otherwise try to parse and format
    return shiftTime;
  };

  return (
    <TouchableOpacity 
      style={styles.row} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      {/* GUARD Column */}
      <View style={[styles.cell, styles.guardCell]}>
        <View style={styles.guardInfo}>
          <View style={styles.avatar}>
            {guard.avatar ? (
              <Image source={{ uri: guard.avatar }} style={styles.avatarImage} />
            ) : (
              <PersonIcon size={20} color="#666" />
            )}
          </View>
          <Text style={styles.guardName} numberOfLines={1}>{guard.name || 'N/A'}</Text>
        </View>
      </View>

      {/* SITE Column */}
      <View style={[styles.cell, styles.siteCell]}>
        <Text style={styles.cellText} numberOfLines={1}>{guard.site || 'N/A'}</Text>
      </View>

      {/* SHIFT TIME Column */}
      <View style={[styles.cell, styles.shiftTimeCell]}>
        <Text style={styles.cellText} numberOfLines={1}>
          {formatShiftTime(guard.shiftTime) || '--:--'}
        </Text>
      </View>

      {/* STATUS Column */}
      <View style={[styles.cell, styles.statusCell]}>
        <StatusBadge status={guard.status} />
      </View>

      {/* CHECK IN Column */}
      <View style={[styles.cell, styles.checkInCell]}>
        <Text style={styles.cellText}>
          {formatTime(guard.checkInTime)}
        </Text>
      </View>

      {/* CHECK OUT Column */}
      <View style={[styles.cell, styles.checkOutCell]}>
        <Text style={styles.cellText}>
          {formatTime(guard.checkOutTime)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    minHeight: 60,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  cell: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  guardCell: {
    minWidth: 140,
    flex: 1.2,
  },
  siteCell: {
    minWidth: 120,
    flex: 1,
  },
  shiftTimeCell: {
    minWidth: 150,
    flex: 1.2,
  },
  statusCell: {
    minWidth: 100,
    flex: 0.9,
  },
  checkInCell: {
    minWidth: 100,
    flex: 0.9,
  },
  checkOutCell: {
    minWidth: 100,
    flex: 0.9,
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
  guardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#323232',
    flex: 1,
  },
  cellText: {
    fontSize: 14,
    color: '#323232',
    fontWeight: '400',
  },
});

export default ShiftsTableRow;

