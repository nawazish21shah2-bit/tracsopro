/**
 * Unified shift module facade.
 *
 * - shiftSchedulingService — admin/client scheduling (create, assign, date-range queries)
 * - shiftGuardOpsService   — guard runtime ops (check-in/out, breaks, guard schedule reads)
 */
export { default as shiftGuardOpsService } from './guardOpsService.js';
export { default as shiftSchedulingService } from './schedulingService.js';
export * from './geofenceService.js';
export * from './types.js';
export * from './transformShift.js';

/** @deprecated Use shiftGuardOpsService or shiftSchedulingService explicitly. */
export { default } from './guardOpsService.js';
