import express from 'express';
import {
  getActiveShift,
  getUpcomingShifts,
  getTodayShifts,
  getPastShifts,
  getWeeklyShiftSummary,
  createShift,
  checkInToShift,
  checkOutFromShift,
  startBreak,
  endBreak,
  reportIncident,
  getShiftStatistics,
  getShiftById,
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

// Get shifts
router.get('/active', getActiveShift);
router.get('/upcoming', getUpcomingShifts);
router.get('/today', getTodayShifts);
router.get('/past', getPastShifts);
router.get('/weekly-summary', getWeeklyShiftSummary);
router.get('/schedule/30-days', async (req: any, res: any) => {
  try {
    const shiftService = (await import('../services/shiftService.js')).default;
    const guardId = req.user?.guard?.id;
    const shifts = await shiftService.get30DaySchedule(guardId);
    res.json({ success: true, data: shifts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get shift statistics
router.get('/statistics', getShiftStatistics);

// Get shift by ID (must be after all specific routes)
router.get('/:id', getShiftById);

// Phase 2: New check-in/out with location
router.post('/:id/check-in', checkInToShift);
router.post('/:id/check-out', checkOutFromShift);

// Phase 2: Break management (placeholder)
router.post('/:id/start-break', startBreak);
router.post('/:shiftId/end-break/:breakId', endBreak);

// Phase 2: Incident reporting (placeholder)
router.post('/:id/report-incident', reportIncident);

// Guard self-creation removed - guards cannot create shifts
// Admin creates shifts via /api/admin/shifts
// Client creates shifts via /api/clients/shifts

export default router;
