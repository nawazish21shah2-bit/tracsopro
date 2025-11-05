import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Shift, ShiftStatus } from '../../types/shift.types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import ShiftTimer from './ShiftTimer';
import { LocationIcon, CheckInIcon, IncidentIcon, EmergencyIcon } from '../ui/AppIcons';

interface ShiftCardProps {
  shift: Shift;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  onViewLocation?: () => void;
  onAddReport?: () => void;
  onEmergencyAlert?: () => void;
}

const ShiftCard: React.FC<ShiftCardProps> = ({
  shift,
  onCheckIn,
  onCheckOut,
  onViewLocation,
  onAddReport,
  onEmergencyAlert,
}) => {
  const getStatusColor = () => {
    switch (shift.status) {
      case ShiftStatus.IN_PROGRESS:
        return COLORS.success;
      case ShiftStatus.SCHEDULED:
        return COLORS.info;
      case ShiftStatus.COMPLETED:
        return COLORS.dashboardGreen;
      case ShiftStatus.MISSED:
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusText = () => {
    switch (shift.status) {
      case ShiftStatus.IN_PROGRESS:
        return 'Active';
      case ShiftStatus.SCHEDULED:
        return 'Upcoming';
      case ShiftStatus.COMPLETED:
        return 'Completed';
      case ShiftStatus.MISSED:
        return 'Missed';
      default:
        return shift.status;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.locationInfo}>
          <LocationIcon size={20} color={COLORS.primary} />
          <View style={styles.locationText}>
            <Text style={styles.locationName}>{shift.locationName}</Text>
            <Text style={styles.locationAddress}>{shift.locationAddress}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      {/* Description */}
      {shift.description && (
        <Text style={styles.description}>{shift.description}</Text>
      )}

      {/* Shift Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Shift Time:</Text>
          <Text style={styles.detailValue}>
            {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
          </Text>
        </View>
        {shift.breakStartTime && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Break Time:</Text>
            <Text style={styles.detailValue}>
              {formatTime(shift.breakStartTime)} - {formatTime(shift.breakEndTime!)}
            </Text>
          </View>
        )}
        {shift.checkInTime && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Clocked In at:</Text>
            <Text style={styles.detailValue}>{formatTime(shift.checkInTime)}</Text>
          </View>
        )}
      </View>

      {/* Timer for active shift */}
      {shift.status === ShiftStatus.IN_PROGRESS && shift.checkInTime && (
        <ShiftTimer checkInTime={shift.checkInTime} isActive={true} style={styles.timer} />
      )}

      {/* View Location Link */}
      {onViewLocation && (
        <TouchableOpacity onPress={onViewLocation} style={styles.viewLocationButton}>
          <Text style={styles.viewLocationText}>View Location</Text>
          <Text style={{fontSize: 16, color: COLORS.primary}}>›</Text>
        </TouchableOpacity>
      )}

      {/* Check In Button */}
      {shift.status === ShiftStatus.SCHEDULED && onCheckIn && (
        <TouchableOpacity style={styles.checkInButton} onPress={onCheckIn}>
          <CheckInIcon size={20} color={COLORS.textInverse} />
          <Text style={styles.checkInText}>Check In</Text>
        </TouchableOpacity>
      )}

      {/* Check Out Button */}
      {shift.status === ShiftStatus.IN_PROGRESS && onCheckOut && (
        <TouchableOpacity style={styles.checkOutButton} onPress={onCheckOut}>
          <CheckInIcon size={20} color={COLORS.textInverse} />
          <Text style={styles.checkOutText}>Check Out</Text>
        </TouchableOpacity>
      )}

      {/* Action Buttons */}
      {shift.status === ShiftStatus.IN_PROGRESS && (onAddReport || onEmergencyAlert) && (
        <View style={styles.actionButtons}>
          {onAddReport && (
            <TouchableOpacity style={styles.reportButton} onPress={onAddReport}>
              <Text style={styles.reportButtonText}>Add Incident Report</Text>
            </TouchableOpacity>
          )}
          {onEmergencyAlert && (
            <TouchableOpacity style={styles.emergencyButton} onPress={onEmergencyAlert}>
              <Text style={styles.emergencyButtonText}>Emergency Alert</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  locationInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  locationText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  locationName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    color: COLORS.textPrimary,
  },
  locationAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    color: COLORS.textInverse,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  details: {
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium as any,
  },
  timer: {
    marginBottom: SPACING.md,
  },
  viewLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  viewLocationText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium as any,
    marginRight: SPACING.xs,
  },
  checkInButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  checkInText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    color: COLORS.textInverse,
    marginLeft: SPACING.sm,
  },
  checkOutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  checkOutText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    color: COLORS.textInverse,
    marginLeft: SPACING.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  reportButton: {
    flex: 1,
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  reportButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    color: COLORS.textInverse,
  },
  emergencyButton: {
    flex: 1,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  emergencyButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    color: COLORS.textInverse,
  },
});

export default ShiftCard;
