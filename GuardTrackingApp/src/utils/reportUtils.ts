import { COLORS } from '../styles/globalStyles';

export type ReportSource = 'shift' | 'incident';

export interface UnifiedReportItem {
  id: string;
  source: ReportSource;
  reportType: string;
  title: string;
  description: string;
  status?: string;
  submittedAt: string;
  locationName?: string;
  locationAddress?: string;
  statusHistory?: Array<{
    status: string;
    changedBy: string;
    notes?: string;
    timestamp: string;
  }>;
  shift?: any;
  guard?: any;
  raw?: any;
}

export function getReportSourceLabel(source: ReportSource): string {
  return source === 'incident' ? 'Incident Report' : 'Shift Report';
}

export function getReportTypeLabel(reportType?: string, source?: ReportSource): string {
  const type = (reportType || '').toUpperCase();
  if (type.includes('EMERGENCY') || type === 'EMERGENCY') return 'Emergency';
  if (type.includes('INCIDENT') || type === 'INCIDENT') return 'Incident';
  if (type.includes('MEDICAL')) return 'Medical';
  if (type.includes('VIOLATION')) return 'Violation';
  if (type.includes('MAINTENANCE')) return 'Maintenance';
  if (source === 'shift') return 'Shift Report';
  return reportType?.replace(/_/g, ' ') || 'Report';
}

export function getReportStatusColor(status?: string): string {
  switch ((status || '').toUpperCase()) {
    case 'SUBMITTED':
    case 'NEW':
    case 'PENDING':
      return COLORS.primary;
    case 'REVIEWED':
    case 'INVESTIGATING':
      return COLORS.warning;
    case 'RESOLVED':
    case 'COMPLETED':
      return COLORS.success;
    case 'REJECTED':
    case 'CANCELLED':
      return COLORS.error;
    default:
      return COLORS.textSecondary;
  }
}

export function getReportStatusLabel(status?: string, source?: ReportSource): string {
  if (!status && source === 'shift') return 'Submitted';
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ');
}

export function normalizeShiftReport(report: any): UnifiedReportItem {
  const shift = report.shift;
  return {
    id: report.id,
    source: 'shift',
    reportType: report.reportType || 'SHIFT',
    title: getReportTypeLabel(report.reportType, 'shift'),
    description: report.content || '',
    status: 'SUBMITTED',
    submittedAt: report.submittedAt || report.createdAt,
    locationName: shift?.locationName || shift?.location?.name,
    locationAddress: shift?.locationAddress || shift?.location?.address,
    shift,
    raw: report,
  };
}

export function normalizeIncidentReport(report: any): UnifiedReportItem {
  return {
    id: report.id,
    source: 'incident',
    reportType: report.reportType || 'INCIDENT',
    title: getReportTypeLabel(report.reportType, 'incident'),
    description: report.description || report.content || '',
    status: report.status || 'SUBMITTED',
    submittedAt: report.submittedAt || report.createdAt,
    locationName: report.location?.name || report.locationName,
    locationAddress: report.location?.address || report.locationAddress,
    statusHistory: report.statusHistory,
    guard: report.guard,
    raw: report,
  };
}

export function mergeReports(
  shiftReports: any[] = [],
  incidentReports: any[] = []
): UnifiedReportItem[] {
  const merged = [
    ...shiftReports.map(normalizeShiftReport),
    ...incidentReports.map(normalizeIncidentReport),
  ];
  return merged.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

export function formatReportDateTime(value?: string): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return value;
  }
}
