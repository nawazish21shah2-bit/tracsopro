import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { exitImpersonation } from '../../store/slices/authSlice';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';

const ImpersonationBanner: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { impersonationActive, impersonatorLabel, user, isLoading } = useSelector(
    (state: RootState) => state.auth
  );

  if (!impersonationActive) return null;

  const handleExit = () => {
    dispatch(exitImpersonation());
  };

  const targetLabel = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    : 'user';

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <Text style={styles.text}>
          Viewing as {targetLabel}
          {impersonatorLabel ? ` (Super Admin: ${impersonatorLabel})` : ''}
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleExit} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.textInverse} />
          ) : (
            <Text style={styles.buttonText}>Exit</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.warning,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  text: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    minWidth: 56,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default ImpersonationBanner;
