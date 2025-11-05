import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShiftReport, ReportType } from '../../types/shift.types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { LocationIcon, IncidentIcon, EmergencyIcon, DocumentIcon } from '../ui/AppIcons';

interface ReportCardProps {
  report: ShiftReport;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onEdit, onDelete }) => {
  const getReportTypeColor = () => {
    switch (report.reportType) {
      case ReportType.SHIFT:
        return COLORS.info;
      case ReportType.INCIDENT:
        return COLORS.warning;
      case ReportType.EMERGENCY:
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getReportIcon = () => {
    switch (report.reportType) {
      case ReportType.SHIFT:
        return <DocumentIcon size={16} color={getReportTypeColor()} />;
      case ReportType.INCIDENT:
        return <IncidentIcon size={16} color={getReportTypeColor()} />;
      case ReportType.EMERGENCY:
        return <EmergencyIcon size={16} color={getReportTypeColor()} />;
      default:
        return <DocumentIcon size={16} color={getReportTypeColor()} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    }) + ', ' + date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.locationInfo}>
          <LocationIcon size={16} color={COLORS.textSecondary} />
          <Text style={styles.locationText}>Ocean View Vila</Text>
        </View>
        <View style={styles.reportTypeContainer}>
          {getReportIcon()}
          <Text style={[styles.reportType, { color: getReportTypeColor() }]}>
            {report.reportType.toLowerCase().replace('_', ' ')} report
          </Text>
        </View>
      </View>

      {/* Location Address */}
      <Text style={styles.locationAddress}>1321 Baker Street, NY</Text>

      {/* Report Content */}
      <Text style={styles.content}>{report.content}</Text>

      {/* Timestamp */}
      <Text style={styles.timestamp}>{formatDate(report.submittedAt)}</Text>
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
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    color: COLORS.textPrimary,
    marginLeft: SPACING.xs,
  },
  locationAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    marginLeft: 24, // Align with location text
  },
  reportTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportType: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium as any,
    marginLeft: SPACING.xs,
    textTransform: 'capitalize',
  },
  content: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  timestamp: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
});

export default ReportCard;
