import express from 'express';
import {
  getActiveShift,
  getUpcomingShifts,
  createShift,
  checkInToShift,
  checkOutFromShift,
  startBreak,
  endBreak,
  reportIncident,
  getShiftStatistics,
} from '../controllers/shiftControllerSimple.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All shift routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Shifts
 *   description: Shift management endpoints
 */

// Phase 2: Shift Management Routes

// Get active/upcoming shifts
router.get('/active', getActiveShift);
router.get('/upcoming', getUpcomingShifts);

// Get shift statistics
router.get('/statistics', getShiftStatistics);

// Phase 2: New check-in/out with location
router.post('/:id/check-in', checkInToShift);
router.post('/:id/check-out', checkOutFromShift);

// Phase 2: Break management (placeholder)
router.post('/:id/start-break', startBreak);
router.post('/:shiftId/end-break/:breakId', endBreak);

// Phase 2: Incident reporting (placeholder)
router.post('/:id/report-incident', reportIncident);

// Create shift
router.post('/', createShift);

export default router;
