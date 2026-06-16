import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../styles/globalStyles';
import {
  SubscriptionOverview,
  statusColor,
  formatPlanDate,
  usageLabel,
} from '../../utils/subscriptionUtils';

interface Props {
  overview: SubscriptionOverview | null;
  loading?: boolean;
  compact?: boolean;
  onUpgrade?: () => void;
}

const UsageBar: React.FC<{ label: string; row: { used: number; max: number; percent: number } }> = ({
  label,
  row,
}) => (
  <View style={styles.usageBlock}>
    <View style={styles.usageHeader}>
      <Text style={styles.usageLabel}>{label}</Text>
      <Text style={styles.usageValue}>
        {row.used} / {row.max}
      </Text>
    </View>
    <View style={styles.barTrack}>
      <View
        style={[
          styles.barFill,
          {
            width: `${Math.min(100, row.percent)}%`,
            backgroundColor: row.percent >= 90 ? COLORS.error : COLORS.primary,
          },
        ]}
      />
    </View>
  </View>
);

const SubscriptionSummaryCard: React.FC<Props> = ({
  overview,
  loading,
  compact,
  onUpgrade,
}) => {
  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.loadingText}>Loading plan…</Text>
      </View>
    );
  }

  if (!overview) return null;

  const color = statusColor(overview.status);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <Text style={styles.planName}>{overview.displayPlan}</Text>
          <View style={[styles.badge, { backgroundColor: `${color}18` }]}>
            <Text style={[styles.badgeText, { color }]}>{overview.status}</Text>
          </View>
        </View>
        {overview.isTrial && overview.trialEndsAt && (
          <Text style={styles.trialNote}>Trial ends {formatPlanDate(overview.trialEndsAt)}</Text>
        )}
      </View>

      {!compact && (
        <>
          <UsageBar label="Guards" row={overview.usage.guards} />
          <UsageBar label="Clients" row={overview.usage.clients} />
          <UsageBar label="Sites" row={overview.usage.sites} />
        </>
      )}

      {compact && (
        <Text style={styles.compactUsage}>
          {usageLabel(overview.usage.guards, 'guard', 'guards')} ·{' '}
          {usageLabel(overview.usage.clients, 'client', 'clients')} ·{' '}
          {usageLabel(overview.usage.sites, 'site', 'sites')}
        </Text>
      )}

      {overview.isTrial && (
        <Text style={styles.trialHint}>
          Upgrade to Basic, Professional, or Enterprise to increase limits and unlock billing.
        </Text>
      )}

      {(overview.canUpgrade || overview.isTrial) && onUpgrade && (
        <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade}>
          <Text style={styles.upgradeBtnText}>
            {overview.hasPaidSubscription ? 'Change Plan' : 'Upgrade Plan'}
          </Text>
        </TouchableOpacity>
      )}

      {!compact && (
        <Text style={styles.support}>
          Billing: {overview.support.billingEmail} · Support: {overview.support.email}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.md,
  },
  headerRow: { marginBottom: SPACING.md },
  flex: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: SPACING.sm },
  planName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  trialNote: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  trialHint: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  usageBlock: { marginBottom: SPACING.sm },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  usageLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  usageValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  barTrack: {
    height: 6,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  compactUsage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  upgradeBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  support: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  loadingText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default SubscriptionSummaryCard;
