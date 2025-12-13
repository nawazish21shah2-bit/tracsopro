// Shift and Report Type Definitions

export enum ShiftStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
  CANCELLED = 'CANCELLED',
}

export enum ReportType {
  SHIFT = 'SHIFT',
  INCIDENT = 'INCIDENT',
  EMERGENCY = 'EMERGENCY',
}

export interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Shift {
  id: string;
  guardId: string;
  locationId?: string;
  locationName: string;
  locationAddress: string;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  status: ShiftStatus;
  description?: string;
  notes?: string;
  checkInTime?: string;
  checkOutTime?: string;
  actualDuration?: number; // in minutes
  createdAt: string;
  updatedAt: string;
  location?: Location;
  shiftReports?: ShiftReport[];
}

export interface ShiftReport {
  id: string;
  shiftId: string;
  guardId: string;
  reportType: ReportType;
  content: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  shift?: Shift;
}

export interface ShiftStats {
  completedShifts: number;
  missedShifts: number;
  totalSites: number;
  incidentReports: number;
  totalHours?: number;
  averageShiftDuration?: number;
}

export interface CheckInRequest {
  shiftId: string;
  latitude?: number;
  longitude?: number;
}

export interface CheckOutRequest {
  shiftId: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateShiftReportRequest {
  shiftId: string;
  reportType: ReportType;
  content: string;
}

export interface UpdateShiftReportRequest {
  content: string;
}

// UI-specific types
export interface ShiftCardProps {
  shift: Shift;
  onCheckIn?: (shiftId: string) => void;
  onCheckOut?: (shiftId: string) => void;
  onViewLocation?: (shift: Shift) => void;
  onAddReport?: (shiftId: string) => void;
  onEmergencyAlert?: (shiftId: string) => void;
}

export interface ShiftTimerProps {
  checkInTime: string;
  isActive: boolean;
}

export interface WeeklyShiftSummary {
  date: string;
  dayOfWeek: string;
  site: string;
  shiftTime: string;
  status: ShiftStatus;
  checkIn?: string;
  checkOut?: string;
}
