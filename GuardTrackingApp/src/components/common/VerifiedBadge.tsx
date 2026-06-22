import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircleIcon, CheckCircleIcon } from '../ui/FeatherIcons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';

interface EmailVerificationBadgeProps {
  isVerified: boolean;
  onPress?: () => void;
}

export const EmailVerificationBadge: React.FC<EmailVerificationBadgeProps> = ({
  isVerified,
  onPress,
}) => {
  const label = isVerified ? 'Verified' : 'Not Verified';
  const content = (
    <>
      <View style={styles.iconWrap}>
        {isVerified ? (
          <CheckCircleIcon size={12} color={COLORS.success} />
        ) : (
          <AlertCircleIcon size={12} color={COLORS.warning} />
        )}
      </View>
      <Text style={[styles.label, isVerified ? styles.verifiedLabel : styles.unverifiedLabel]}>
        {label}
      </Text>
    </>
  );

  if (!isVerified && onPress) {
    return (
      <TouchableOpacity
        style={[styles.badge, styles.unverifiedBadge]}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Verify email"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.badge, isVerified ? styles.verifiedBadge : styles.unverifiedBadge]}>
      {content}
    </View>
  );
};

/** @deprecated Use EmailVerificationBadge */
export const VerifiedBadge = EmailVerificationBadge;

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    gap: SPACING.xs,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
  },
  unverifiedBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.12)',
  },
  iconWrap: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontFamily: TYPOGRAPHY.fontPrimary,
    lineHeight: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  verifiedLabel: {
    color: COLORS.success,
  },
  unverifiedLabel: {
    color: COLORS.warning,
  },
});

export default EmailVerificationBadge;
