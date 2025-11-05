import express from 'express';
import {
  createShiftReport,
  getGuardReports,
  getShiftReportById,
  getShiftReports,
  updateShiftReport,
  deleteShiftReport,
} from '../controllers/shiftReportController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All shift report routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Shift Reports
 *   description: Shift report management endpoints
 */

// Create a shift report
router.post('/', createShiftReport);

// Get all reports for the current guard
router.get('/', getGuardReports);

// Get reports for a specific shift
router.get('/shift/:shiftId', getShiftReports);

// Get, update, or delete a specific report
router.get('/:id', getShiftReportById);
router.put('/:id', updateShiftReport);
router.delete('/:id', deleteShiftReport);

export default router;
