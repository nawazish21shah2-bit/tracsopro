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
  getActiveBreak,
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
    const guardId = req.guardId;
    if (!guardId) {
      return res.status(403).json({
        success: false,
        message: 'Guard profile not found or not linked to a company.',
      });
    }

    const { shiftSchedulingService: shiftService } = await import('../services/shift/index.js');
    const shifts = await shiftService.get30DaySchedule(guardId, req.securityCompanyId);
    res.json({ success: true, data: shifts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get shift statistics
router.get('/statistics', getShiftStatistics);

// Break routes (before /:id)
router.get('/:id/active-break', getActiveBreak);

// Get shift by ID (must be after all specific routes)
router.get('/:id', getShiftById);

// Phase 2: New check-in/out with location
router.post('/:id/check-in', checkInToShift);
router.post('/:id/check-out', checkOutFromShift);

router.post('/:id/start-break', startBreak);
router.post('/:shiftId/end-break/:breakId', endBreak);

// Phase 2: Incident reporting (placeholder)
router.post('/:id/report-incident', reportIncident);

// Guard self-creation removed - guards cannot create shifts
// Admin creates shifts via /api/admin/shifts
// Client creates shifts via /api/clients/shifts

export default router;
