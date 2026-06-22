import { ScheduledShiftItem } from '../hooks/useShiftScheduling';

export function transformAdminShift(shift: any, selectedDate: string): ScheduledShiftItem {
  const guard = shift.guard;
  const guardName = guard?.user
    ? `${guard.user.firstName || ''} ${guard.user.lastName || ''}`.trim() || guard.user.email
    : 'Unassigned';

  const site = shift.site;
  const siteName = site?.name || shift.locationName || 'Unknown Site';
  const siteId = site?.id || shift.siteId || '';

  const startDate = new Date(shift.scheduledStartTime);
  const endDate = new Date(shift.scheduledEndTime);
  const startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
  const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

  let status: ScheduledShiftItem['status'] = 'scheduled';
  if (shift.status === 'IN_PROGRESS') status = 'in_progress';
  else if (shift.status === 'COMPLETED') status = 'completed';
  else if (shift.status === 'CANCELLED') status = 'cancelled';
  else if (shift.status === 'CONFIRMED') status = 'confirmed';

  const clientName = shift.client?.user
    ? `${shift.client.user.firstName || ''} ${shift.client.user.lastName || ''}`.trim() ||
      shift.client.user.email
    : undefined;

  return {
    id: shift.id,
    guardId: shift.guardId || null,
    guardName: shift.guardId ? guardName : 'Unassigned',
    siteId,
    siteName,
    startTime,
    endTime,
    date: selectedDate,
    status,
    shiftType: 'regular',
    notes: shift.notes,
    clientName,
    isClientCreated: !!shift.client,
  };
}

export function transformAdminShifts(shifts: any[], selectedDate: string): ScheduledShiftItem[] {
  return (shifts || []).map((shift) => transformAdminShift(shift, selectedDate));
}
