// Incident Report Detail Screen – shows status history timeline for guards
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { StatusHistoryEntry, ShiftReport } from '../../types/shift.types';
import { ChevronLeftIcon } from '../../components/ui/AppIcons';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'SUBMITTED':
      return COLORS.primary;
    case 'REVIEWED':
      return COLORS.warning;
    case 'RESOLVED':
      return COLORS.success;
    case 'REJECTED':
      return COLORS.error;
    default:
      return COLORS.textSecondary;
  }
};

const getStatusLabel = (status: string) =>
  status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown';

const getRoleIcon = (role: string) => {
  switch (role?.toUpperCase()) {
    case 'CLIENT':      return '🏢';
    case 'ADMIN':       return '👔';
    case 'SUPER_ADMIN': return '⭐';
    default:            return '👤';
  }
};

const getRoleLabel = (role: string) => {
  switch (role?.toUpperCase()) {
    case 'CLIENT':      return 'Client';
    case 'ADMIN':       return 'Admin';
    case 'SUPER_ADMIN': return 'Super Admin';
    default:            return role;
  }
};

// ─── Component ──────────────────────────────────────────────────────────────

const IncidentReportDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { report } = (route.params as { report: ShiftReport }) || {};

  if (!report) {
    return (
      <SafeAreaWrapper includeTop>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Report not found.</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  // Build a full timeline: submitted entry + all status-history entries
  const submittedEntry: StatusHistoryEntry = {
    status: 'SUBMITTED',
    changedBy: 'GUARD',
    notes: 'Report submitted.',
    timestamp: report.submittedAt || report.createdAt,
  };

  const history: StatusHistoryEntry[] = [
    submittedEntry,
    ...(report.statusHistory || []),
  ];

  const currentStatus = report.status || 'SUBMITTED';

  return (
    <SafeAreaWrapper includeTop>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundPrimary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeftIcon size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Details</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentStatus) + '22' }]}>
          <Text style={[styles.statusBadgeText, { color: getStatusColor(currentStatus) }]}>
            {getStatusLabel(currentStatus)}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Report Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Type</Text>
          <Text style={styles.cardValue}>{report.reportType || 'Shift Report'}</Text>

          {(report.location?.name || report.location?.address) && (
            <>
              <Text style={[styles.cardLabel, { marginTop: SPACING.md }]}>Location</Text>
              <Text style={styles.cardValue}>
                {report.location?.name || report.location?.address}
              </Text>
            </>
          )}

          <Text style={[styles.cardLabel, { marginTop: SPACING.md }]}>Description</Text>
          <Text style={styles.cardDescription}>{report.description || report.content}</Text>

          {report.responseNotes && (
            <>
              <View style={styles.responseDivider} />
              <Text style={styles.responseLabel}>Latest Response</Text>
              <Text style={styles.responseText}>{report.responseNotes}</Text>
            </>
          )}
        </View>

        {/* Timeline */}
        <Text style={styles.timelineTitle}>Status Timeline</Text>

        <View style={styles.timelineContainer}>
          {history.map((entry, index) => {
            const isLast = index === history.length - 1;
            const color = getStatusColor(entry.status);
            return (
              <View key={index} style={styles.timelineRow}>
                {/* Left column: dot + line */}
                <View style={styles.timelineLeft}>
                  <View style={[styles.dot, { backgroundColor: color }]}>
                    <View style={styles.dotInner} />
                  </View>
                  {!isLast && <View style={styles.line} />}
                </View>

                {/* Right column: content */}
                <View style={[styles.timelineCard, isLast && styles.timelineCardLast]}>
                  <View style={styles.timelineCardHeader}>
                    <View style={[styles.statusChip, { backgroundColor: color + '18' }]}>
                      <Text style={[styles.statusChipText, { color }]}>
                        {getStatusLabel(entry.status)}
                      </Text>
                    </View>
                    <Text style={styles.timelineDate}>{formatDate(entry.timestamp)}</Text>
                  </View>

                  <View style={styles.timelineActor}>
                    <Text style={styles.actorIcon}>{getRoleIcon(entry.changedBy)}</Text>
                    <Text style={styles.actorLabel}>
                      {entry.changedBy === 'GUARD'
                        ? 'You (Guard)'
                        : getRoleLabel(entry.changedBy)}
                    </Text>
                  </View>

                  {entry.notes ? (
                    <Text style={styles.timelineNotes}>{entry.notes}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
    ...SHADOWS.small,
  },
  backBtn: {
    padding: SPACING.xs,
    marginRight: SPACING.md,
  },
  backArrow: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  statusBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
  },
  // ── Report Info Card
  card: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.small,
  },
  cardLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: TYPOGRAPHY.fontPrimary,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  cardDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  responseDivider: {
    height: 1,
    backgroundColor: COLORS.borderCard,
    marginVertical: SPACING.md,
  },
  responseLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  responseText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    fontStyle: 'italic',
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  // ── Timeline
  timelineTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
    marginBottom: SPACING.md,
  },
  timelineContainer: {
    paddingLeft: SPACING.xs,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 28,
    marginRight: SPACING.md,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.borderCard,
    marginTop: 2,
    marginBottom: 2,
    minHeight: 20,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  timelineCardLast: {
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundTertiary,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  statusChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
  },
  statusChipText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  timelineDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  timelineActor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  actorIcon: {
    fontSize: 14,
  },
  actorLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  timelineNotes: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * TYPOGRAPHY.fontSize.sm,
  },
});

export default IncidentReportDetailScreen;
