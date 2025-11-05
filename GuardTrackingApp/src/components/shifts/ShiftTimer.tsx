import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../styles/globalStyles';

interface ShiftTimerProps {
  checkInTime: string;
  isActive: boolean;
  style?: any;
}

const ShiftTimer: React.FC<ShiftTimerProps> = ({ checkInTime, isActive, style }) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  useEffect(() => {
    if (!isActive || !checkInTime) {
      setElapsedTime('00:00:00');
      return;
    }

    const calculateElapsedTime = () => {
      const checkIn = new Date(checkInTime);
      const now = new Date();
      const diff = now.getTime() - checkIn.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      setElapsedTime(formattedTime);
    };

    // Calculate immediately
    calculateElapsedTime();

    // Update every second
    const interval = setInterval(calculateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [checkInTime, isActive]);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.timerText}>{elapsedTime}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 36,
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
});

export default ShiftTimer;
