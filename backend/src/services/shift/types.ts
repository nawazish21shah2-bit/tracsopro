import { BreakType } from '@prisma/client';

export interface CreateShiftData {
  guardId?: string;
  siteId?: string;
  clientId?: string;
  locationId?: string;
  locationName: string;
  locationAddress: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  description?: string;
  notes?: string;
}

export interface ShiftLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}

export interface CheckInData {
  shiftId: string;
  guardId: string;
  location: ShiftLocation;
  timestamp: Date;
}

export interface CheckOutData {
  shiftId: string;
  guardId: string;
  location: ShiftLocation;
  timestamp: Date;
  notes?: string;
}

export interface StartBreakData {
  shiftId: string;
  guardId: string;
  breakType: BreakType;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  notes?: string;
}

export interface ShiftStats {
  completedShifts: number;
  missedShifts: number;
  totalSites: number;
  incidentReports: number;
  totalHours: number;
  averageShiftDuration: number;
}
