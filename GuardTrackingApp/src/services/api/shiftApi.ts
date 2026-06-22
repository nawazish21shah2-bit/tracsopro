import apiService from '../api';

export const shiftApi = {
  getAdminShifts: (date: string, guardId?: string) => apiService.getAdminShifts(date, guardId),
  createAdminShift: (data: Parameters<typeof apiService.createAdminShift>[0]) =>
    apiService.createAdminShift(data),
  createAdminBulkShifts: (data: Parameters<typeof apiService.createAdminBulkShifts>[0]) =>
    apiService.createAdminBulkShifts(data),
  assignGuardToShift: (shiftId: string, guardId: string) =>
    apiService.assignGuardToShift(shiftId, guardId),
  updateAdminShift: (shiftId: string, data: Parameters<typeof apiService.updateAdminShift>[1]) =>
    apiService.updateAdminShift(shiftId, data),
  deleteAdminShift: (shiftId: string) => apiService.deleteAdminShift(shiftId),
  getUnassignedShifts: (date?: string) => apiService.getUnassignedShifts(date),
  checkInToShift: (
    shiftId: string,
    location: { latitude: number; longitude: number; accuracy?: number; address?: string },
  ) => apiService.checkInToShift(shiftId, location),
  checkOutFromShift: (
    shiftId: string,
    location: { latitude: number; longitude: number; accuracy?: number; address?: string },
    notes?: string,
  ) => apiService.checkOutFromShift(shiftId, location, notes),
  getShiftById: (shiftId: string) => apiService.getShiftById(shiftId),
  getUpcomingShifts: () => apiService.getUpcomingShifts(),
};
