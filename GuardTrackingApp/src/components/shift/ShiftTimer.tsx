import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Shift } from '../../types/shift.types';

interface ShiftTimerProps {
  shift: Shift | null;
  style?: any;
}

const ShiftTimer: React.FC<ShiftTimerProps> = ({ shift, style }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getElapsedTime = (): string => {
    if (!shift || shift.status !== 'IN_PROGRESS' || !shift.checkInTime) {
      return '00:00:00';
    }

    const startTime = new Date(shift.checkInTime);
    const elapsed = currentTime.getTime() - startTime.getTime();
    return formatDuration(Math.max(0, elapsed));
  };

  const getScheduledDuration = (): string => {
    if (!shift) return '00:00:00';

    const startTime = new Date(shift.startTime);
    const endTime = new Date(shift.endTime);
    const duration = endTime.getTime() - startTime.getTime();
    return formatDuration(Math.max(0, duration));
  };

  const getTimeRemaining = (): string => {
    if (!shift || shift.status !== 'IN_PROGRESS') {
      return '00:00:00';
    }

    const endTime = new Date(shift.endTime);
    const remaining = endTime.getTime() - currentTime.getTime();
    
    if (remaining <= 0) {
      return 'OVERTIME';
    }

    return formatDuration(remaining);
  };

  const isOvertime = (): boolean => {
    if (!shift || shift.status !== 'IN_PROGRESS') {
      return false;
    }

    const endTime = new Date(shift.endTime);
    return currentTime.getTime() > endTime.getTime();
  };

  if (!shift) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.noShiftText}>No active shift</Text>
      </View>
    );
  }

  const isActive = shift.status === 'IN_PROGRESS';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.timerSection}>
        <Text style={styles.label}>Current Time</Text>
        <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
      </View>

      {isActive && (
        <>
          <View style={styles.timerSection}>
            <Text style={styles.label}>Elapsed Time</Text>
            <Text style={[styles.elapsedTime, isOvertime() && styles.overtimeText]}>
              {getElapsedTime()}
            </Text>
          </View>

          <View style={styles.timerSection}>
            <Text style={styles.label}>Time Remaining</Text>
            <Text style={[styles.remainingTime, isOvertime() && styles.overtimeText]}>
              {getTimeRemaining()}
            </Text>
          </View>
        </>
      )}

      <View style={styles.timerSection}>
        <Text style={styles.label}>Scheduled Duration</Text>
        <Text style={styles.scheduledDuration}>{getScheduledDuration()}</Text>
      </View>

      <View style={styles.shiftInfo}>
        <Text style={styles.shiftLocation}>{shift.locationName}</Text>
        <Text style={styles.shiftStatus}>
          Status: <Text style={[styles.statusText, getStatusStyle(shift.status)]}>{shift.status}</Text>
        </Text>
        {shift.startTime && (
          <Text style={styles.shiftTime}>
            {new Date(shift.startTime).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })} - {new Date(shift.endTime).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </View>

      {isOvertime() && (
        <View style={styles.overtimeWarning}>
          <Text style={styles.overtimeWarningText}>⚠️ OVERTIME</Text>
        </View>
      )}
    </View>
  );
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'IN_PROGRESS':
      return { color: '#22C55E' }; // Green
    case 'SCHEDULED':
      return { color: '#3B82F6' }; // Blue
    case 'COMPLETED':
      return { color: '#6B7280' }; // Gray
    case 'MISSED':
      return { color: '#EF4444' }; // Red
    default:
      return { color: '#6B7280' }; // Gray
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentTime: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  elapsedTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  remainingTime: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3B82F6',
  },
  scheduledDuration: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  overtimeText: {
    color: '#EF4444',
  },
  shiftInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    alignItems: 'center',
  },
  shiftLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  shiftStatus: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statusText: {
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  shiftTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  noShiftText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    padding: 20,
  },
  overtimeWarning: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  overtimeWarningText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ShiftTimer;
