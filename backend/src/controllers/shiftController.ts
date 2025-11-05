import { Request, Response } from 'express';
import shiftService from '../services/shiftService';
import { ShiftStatus } from '@prisma/client';

/**
 * @swagger
 * /api/shifts/stats:
 *   get:
 *     summary: Get guard's monthly shift statistics
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly shift statistics
 *       401:
 *         description: Unauthorized
 */
export const getGuardStats = async (req: Request, res: Response) => {
  try {
    const guardId = req.user?.id;

    if (!guardId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await shiftService.getGuardMonthlyStats(guardId);

    res.json(stats);
  } catch (error: any) {
    console.error('Error getting guard stats:', error);
    res.status(500).json({ error: error.message || 'Failed to get guard stats' });
  }
};

/**
 * @swagger
 * /api/shifts/today:
 *   get:
 *     summary: Get guard's today shifts
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's shifts
 *       401:
 *         description: Unauthorized
 */
export const getTodayShifts = async (req: Request, res: Response) => {
  try {
    const guardId = req.user?.id;

    if (!guardId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const shifts = await shiftService.getGuardTodayShifts(guardId);

    res.json(shifts);
  } catch (error: any) {
    console.error('Error getting today shifts:', error);
    res.status(500).json({ error: error.message || 'Failed to get today shifts' });
  }
};

/**
 * @swagger
 * /api/shifts/upcoming:
 *   get:
 *     summary: Get guard's upcoming shifts
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upcoming shifts
 *       401:
 *         description: Unauthorized
 */
export const getUpcomingShifts = async (req: Request, res: Response) => {
  try {
    const guardId = req.user?.id;

    if (!guardId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const shifts = await shiftService.getGuardUpcomingShifts(guardId);

    res.json(shifts);
  } catch (error: any) {
    console.error('Error getting upcoming shifts:', error);
    res.status(500).json({ error: error.message || 'Failed to get upcoming shifts' });
  }
};

/**
 * @swagger
 * /api/shifts/past:
 *   get:
 *     summary: Get guard's past shifts
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Past shifts
 *       401:
 *         description: Unauthorized
 */
export const getPastShifts = async (req: Request, res: Response) => {
  try {
    const guardId = req.user?.id;

    if (!guardId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const shifts = await shiftService.getGuardPastShifts(guardId, limit);

    res.json(shifts);
  } catch (error: any) {
    console.error('Error getting past shifts:', error);
    res.status(500).json({ error: error.message || 'Failed to get past shifts' });
  }
};

/**
 * @swagger
 * /api/shifts/weekly-summary:
 *   get:
 *     summary: Get guard's weekly shift summary
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weekly shift summary
 *       401:
 *         description: Unauthorized
 */
export const getWeeklyShiftSummary = async (req: Request, res: Response) => {
  try {
    const guardId = req.user?.id;

    if (!guardId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const shifts = await shiftService.getGuardWeeklyShiftSummary(guardId);

    res.json(shifts);
  } catch (error: any) {
    console.error('Error getting weekly shift summary:', error);
    res.status(500).json({ error: error.message || 'Failed to get weekly shift summary' });
  }
};

/**
 * @swagger
 * /api/shifts/active:
 *   get:
 *     summary: Get guard's active shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active shift or null
 *       401:
 *         description: Unauthorized
 */
export const getActiveShift = async (req: Request, res: Response) => {
  try {
    const guardId = req.user?.id;

    if (!guardId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const shift = await shiftService.getActiveShift(guardId);

    res.json(shift);
  } catch (error: any) {
    console.error('Error getting active shift:', error);
    res.status(500).json({ error: error.message || 'Failed to get active shift' });
  }
};

/**
 * @swagger
 * /api/shifts/next:
 *   get:
 *     summary: Get guard's next upcoming shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Next upcoming shift or null
 *       401:
 *         description: Unauthorized
 */
export const getNextUpcomingShift = async (req: Request, res: Response) => {
  try {
    const guardId = req.user?.id;

    if (!guardId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const shift = await shiftService.getNextUpcomingShift(guardId);

    res.json(shift);
  } catch (error: any) {
    console.error('Error getting next upcoming shift:', error);
    res.status(500).json({ error: error.message || 'Failed to get next upcoming shift' });
  }
};

/**
 * @swagger
 * /api/shifts/:id:
 *   get:
 *     summary: Get shift by ID
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shift details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shift not found
 */
export const getShiftById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const guardId = req.user?.id;

    if (!guardId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const shift = await shiftService.getShiftById(id);

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    // Verify shift belongs to guard
    if (shift.guardId !== guardId) {
      return res.status(403).json({ error: 'Forbidden: This shift does not belong to you' });
    }

    res.json(shift);
  } catch (error: any) {
    console.error('Error getting shift:', error);
    res.status(500).json({ error: error.message || 'Failed to get shift' });
  }
};

/**
 * @swagger
 * /api/shifts/check-in:
 *   post:
 *     summary: Check in to a shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shiftId
 *             properties:
 *               shiftId:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Successfully checked in
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
export const checkIn = async (req: Request, res: Response) => {
  try {
    const guardId = req.user?.id;

    if (!guardId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { shiftId, latitude, longitude } = req.body;

    if (!shiftId) {
      return res.status(400).json({ error: 'Shift ID is required' });
    }

    const shift = await shiftService.checkIn({
      shiftId,
      guardId,
      checkInTime: new Date(),
      latitude,
      longitude,
    });

    res.json({
      message: 'Successfully checked in',
      shift,
    });
  } catch (error: any) {
    console.error('Error checking in:', error);
    res.status(400).json({ error: error.message || 'Failed to check in' });
  }
};

/**
 * @swagger
 * /api/shifts/check-out:
 *   post:
 *     summary: Check out from a shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shiftId
 *             properties:
 *               shiftId:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Successfully checked out
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
export const checkOut = async (req: Request, res: Response) => {
  try {
    const guardId = req.user?.id;

    if (!guardId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { shiftId, latitude, longitude } = req.body;

    if (!shiftId) {
      return res.status(400).json({ error: 'Shift ID is required' });
    }

    const shift = await shiftService.checkOut({
      shiftId,
      guardId,
      checkOutTime: new Date(),
      latitude,
      longitude,
    });

    res.json({
      message: 'Successfully checked out',
      shift,
    });
  } catch (error: any) {
    console.error('Error checking out:', error);
    res.status(400).json({ error: error.message || 'Failed to check out' });
  }
};

/**
 * @swagger
 * /api/shifts:
 *   post:
 *     summary: Create a new shift (Admin only)
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guardId
 *               - locationName
 *               - locationAddress
 *               - startTime
 *               - endTime
 *             properties:
 *               guardId:
 *                 type: string
 *               locationId:
 *                 type: string
 *               locationName:
 *                 type: string
 *               locationAddress:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               breakStartTime:
 *                 type: string
 *                 format: date-time
 *               breakEndTime:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Shift created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
export const createShift = async (req: Request, res: Response) => {
  try {
    const {
      guardId,
      locationId,
      locationName,
      locationAddress,
      startTime,
      endTime,
      breakStartTime,
      breakEndTime,
      description,
      notes,
    } = req.body;

    if (!guardId || !locationName || !locationAddress || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const shift = await shiftService.createShift({
      guardId,
      locationId,
      locationName,
      locationAddress,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      breakStartTime: breakStartTime ? new Date(breakStartTime) : undefined,
      breakEndTime: breakEndTime ? new Date(breakEndTime) : undefined,
      description,
      notes,
    });

    res.status(201).json({
      message: 'Shift created successfully',
      shift,
    });
  } catch (error: any) {
    console.error('Error creating shift:', error);
    res.status(400).json({ error: error.message || 'Failed to create shift' });
  }
};
