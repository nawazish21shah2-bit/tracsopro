import express from 'express';
import {
  getGuardStats,
  getTodayShifts,
  getUpcomingShifts,
  getPastShifts,
  getWeeklyShiftSummary,
  getActiveShift,
  getNextUpcomingShift,
  getShiftById,
  checkIn,
  checkOut,
  createShift,
} from '../controllers/shiftController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All shift routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Shifts
 *   description: Shift management endpoints
 */

// Get guard statistics
router.get('/stats', getGuardStats);

// Get shifts by category
router.get('/today', getTodayShifts);
router.get('/upcoming', getUpcomingShifts);
router.get('/past', getPastShifts);
router.get('/weekly-summary', getWeeklyShiftSummary);

// Get active/next shift
router.get('/active', getActiveShift);
router.get('/next', getNextUpcomingShift);

// Check in/out
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);

// Get shift by ID
router.get('/:id', getShiftById);

// Create shift (admin only - add role check middleware if needed)
router.post('/', createShift);

export default router;
