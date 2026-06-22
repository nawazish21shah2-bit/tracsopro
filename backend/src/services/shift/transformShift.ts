/**
 * Normalize shift records for API consumers (scheduled* → startTime/endTime aliases).
 */
export function transformShiftForFrontend(shift: unknown): unknown {
  if (!shift) return shift;

  if (Array.isArray(shift)) {
    return shift.map(transformShiftForFrontend);
  }

  const record = shift as Record<string, unknown>;
  return {
    ...record,
    startTime: record.scheduledStartTime || record.startTime,
    endTime: record.scheduledEndTime || record.endTime,
    checkInTime: record.actualStartTime || record.checkInTime,
    checkOutTime: record.actualEndTime || record.checkOutTime,
  };
}
