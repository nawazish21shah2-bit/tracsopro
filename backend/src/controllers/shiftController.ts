import { Request, Response } from 'express';
import shiftService from '../services/shiftServiceSimple.js';
import { ShiftStatus, BreakType, IncidentType, IncidentSeverity } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import prisma from '../config/database.js';

/**
 * Helper function to get guard ID from authenticated user
 * The user object may have guard info attached, or we need to look it up
 */
const getGuardIdFromUser = async (req: Request): Promise<string | null> => {
  // First try to get it from the request if it's already attached
  const user = (req as any).user;
  
  if (!user?.id) {
    return null;
  }

  // If guard info is already attached to user object
  if (user.guard?.id) {
    return user.guard.id;
  }

  // Otherwise, look up the guard by userId
  try {
    const guard = await prisma.guard.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });
    
    return guard?.id || null;
  } catch (error) {
    logger.error('Error looking up guard ID:', error);
    return null;
  }
};
  
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
    const guardId = await getGuardIdFromUser(req);

    if (!guardId) {
      return res.status(401).json({ error: 'Guard profile not found' });
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
    const guardId = await getGuardIdFromUser(req);

    if (!guardId) {
      return res.status(401).json({ error: 'Guard profile not found' });
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
export const getUpcomingShiftsSimple = async (req: Request, res: Response) => {
  try {
    const guardId = await getGuardIdFromUser(req);

    if (!guardId) {
      return res.status(401).json({ error: 'Guard profile not found' });
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
    const guardId = await getGuardIdFromUser(req);

    if (!guardId) {
      return res.status(401).json({ error: 'Guard profile not found' });
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
    const guardId = await getGuardIdFromUser(req);

    if (!guardId) {
      return res.status(401).json({ error: 'Guard profile not found' });
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
export const getActiveShiftSimple = async (req: Request, res: Response) => {
  try {
    const guardId = await getGuardIdFromUser(req);

    if (!guardId) {
      return res.status(401).json({ error: 'Guard profile not found' });
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
    const guardId = await getGuardIdFromUser(req);

    if (!guardId) {
      return res.status(401).json({ error: 'Guard profile not found' });
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
    const guardId = await getGuardIdFromUser(req);

    if (!guardId) {
      return res.status(401).json({ error: 'Guard profile not found' });
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
 * @deprecated This implementation is no longer used.
 * Use checkInToShift and checkOutFromShift from shiftControllerSimple.ts instead.
 * These old implementations are kept for reference but should be removed.
 */

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
      success: true,
      message: 'Shift created successfully',
      data: shift,
    });
  } catch (error: any) {
    logger.error('Error creating shift:', error);
    res.status(400).json({ 
      success: false,
      error: error.message || 'Failed to create shift' 
    });
  }
};

/**
 * @swagger
 * /api/shifts/{id}/check-in:
 *   post:
 *     summary: Check in to a shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *             properties:
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   accuracy:
 *                     type: number
 *                   address:
 *                     type: string
 *     responses:
 *       200:
 *         description: Successfully checked in
 *       400:
 *         description: Bad request
 *       404:
 *         description: Shift not found
 */
export const checkInToShift = async (req: Request, res: Response) => {
  try {
    const { id: shiftId } = req.params;
    const guardId = (req as any).user?.guard?.id || (req as any).user?.id;
    const { location } = req.body;

    if (!guardId) {
      return res.status(401).json({ 
        success: false,
        error: 'Guard not found' 
      });
    }

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ 
        success: false,
        error: 'Location data is required for check-in' 
      });
    }

    const shift = await shiftService.checkInToShift({
      shiftId,
      guardId,
      location,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: 'Successfully checked in to shift',
      data: shift,
    });
  } catch (error: any) {
    logger.error('Error checking in to shift:', error);
    res.status(400).json({ 
      success: false,
      error: error.message || 'Failed to check in to shift' 
    });
  }
};

/**
 * @swagger
 * /api/shifts/{id}/check-out:
 *   post:
 *     summary: Check out from a shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *             properties:
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   accuracy:
 *                     type: number
 *                   address:
 *                     type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully checked out
 *       400:
 *         description: Bad request
 *       404:
 *         description: Shift not found
 */
export const checkOutFromShift = async (req: Request, res: Response) => {
  try {
    const { id: shiftId } = req.params;
    const guardId = (req as any).user?.guard?.id || (req as any).user?.id;
    const { location, notes } = req.body;

    if (!guardId) {
      return res.status(401).json({ 
        success: false,
        error: 'Guard not found' 
      });
    }

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ 
        success: false,
        error: 'Location data is required for check-out' 
      });
    }

    const shift = await shiftService.checkOutFromShift({
      shiftId,
      guardId,
      location,
      timestamp: new Date(),
      notes,
    });

    res.json({
      success: true,
      message: 'Successfully checked out from shift',
      data: shift,
    });
  } catch (error: any) {
    logger.error('Error checking out from shift:', error);
    res.status(400).json({ 
      success: false,
      error: error.message || 'Failed to check out from shift' 
    });
  }
};

/**
 * @swagger
 * /api/shifts/{id}/start-break:
 *   post:
 *     summary: Start a break during shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - breakType
 *             properties:
 *               breakType:
 *                 type: string
 *                 enum: [REGULAR, LUNCH, EMERGENCY, UNAUTHORIZED]
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   accuracy:
 *                     type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Break started successfully
 *       400:
 *         description: Bad request
 */
export const startBreak = async (req: Request, res: Response) => {
  try {
    const { id: shiftId } = req.params;
    const guardId = (req as any).user?.guard?.id || (req as any).user?.id;
    const { breakType, location, notes } = req.body;

    if (!guardId) {
      return res.status(401).json({ 
        success: false,
        error: 'Guard not found' 
      });
    }

    const shiftBreak = await shiftService.startBreak({
      shiftId,
      guardId,
      breakType: breakType as BreakType,
      location,
      notes,
    });

    res.json({
      success: true,
      message: 'Break started successfully',
      data: shiftBreak,
    });
  } catch (error: any) {
    logger.error('Error starting break:', error);
    res.status(400).json({ 
      success: false,
      error: error.message || 'Failed to start break' 
    });
  }
};

/**
 * @swagger
 * /api/shifts/{shiftId}/end-break/{breakId}:
 *   post:
 *     summary: End a break during shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *       - in: path
 *         name: breakId
 *         required: true
 *         schema:
 *           type: string
 *         description: Break ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   accuracy:
 *                     type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Break ended successfully
 *       400:
 *         description: Bad request
 */
export const endBreak = async (req: Request, res: Response) => {
  try {
    const { shiftId, breakId } = req.params;
    const guardId = (req as any).user?.guard?.id || (req as any).user?.id;
    const { location, notes } = req.body;

    if (!guardId) {
      return res.status(401).json({ 
        success: false,
        error: 'Guard not found' 
      });
    }

    const shiftBreak = await shiftService.endBreak({
      shiftId,
      guardId,
      breakId,
      location,
      notes,
    });

    res.json({
      success: true,
      message: 'Break ended successfully',
      data: shiftBreak,
    });
  } catch (error: any) {
    logger.error('Error ending break:', error);
    res.status(400).json({ 
      success: false,
      error: error.message || 'Failed to end break' 
    });
  }
};

/**
 * @swagger
 * /api/shifts/{id}/report-incident:
 *   post:
 *     summary: Report an incident during shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - incidentType
 *               - severity
 *               - title
 *               - description
 *             properties:
 *               incidentType:
 *                 type: string
 *                 enum: [SECURITY_BREACH, MEDICAL_EMERGENCY, FIRE_ALARM, THEFT, VANDALISM, SUSPICIOUS_ACTIVITY, EQUIPMENT_FAILURE, WEATHER_RELATED, OTHER]
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   accuracy:
 *                     type: number
 *                   address:
 *                     type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Incident reported successfully
 *       400:
 *         description: Bad request
 */
export const reportIncident = async (req: Request, res: Response) => {
  try {
    const { id: shiftId } = req.params;
    const guardId = (req as any).user?.guard?.id || (req as any).user?.id;
    const { incidentType, severity, title, description, location, attachments } = req.body;

    if (!guardId) {
      return res.status(401).json({ 
        success: false,
        error: 'Guard not found' 
      });
    }

    const incident = await shiftService.reportIncident({
      shiftId,
      guardId,
      incidentType: incidentType as IncidentType,
      severity: severity as IncidentSeverity,
      title,
      description,
      location,
      attachments,
    });

    res.status(201).json({
      success: true,
      message: 'Incident reported successfully',
      data: incident,
    });
  } catch (error: any) {
    logger.error('Error reporting incident:', error);
    res.status(400).json({ 
      success: false,
      error: error.message || 'Failed to report incident' 
    });
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
 *         description: Active shift data
 *       404:
 *         description: No active shift found
 */
export const getActiveShift = async (req: Request, res: Response) => {
  try {
    const guardId = (req as any).user?.guard?.id || (req as any).user?.id;

    if (!guardId) {
      return res.status(401).json({ 
        success: false,
        error: 'Guard not found' 
      });
    }

    const activeShift = await shiftService.getActiveShift(guardId);

    if (!activeShift) {
      return res.status(404).json({
        success: false,
        message: 'No active shift found',
      });
    }

    res.json({
      success: true,
      data: activeShift,
    });
  } catch (error: any) {
    logger.error('Error getting active shift:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to get active shift' 
    });
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
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of shifts to return
 *     responses:
 *       200:
 *         description: Upcoming shifts
 */
export const getUpcomingShifts = async (req: Request, res: Response) => {
  try {
    const guardId = (req as any).user?.guard?.id || (req as any).user?.id;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!guardId) {
      return res.status(401).json({ 
        success: false,
        error: 'Guard not found' 
      });
    }

    const upcomingShifts = await shiftService.getUpcomingShifts(guardId, limit);

    res.json({
      success: true,
      data: upcomingShifts,
    });
  } catch (error: any) {
    logger.error('Error getting upcoming shifts:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to get upcoming shifts' 
    });
  }
};

/**
 * @swagger
 * /api/shifts/statistics:
 *   get:
 *     summary: Get guard's shift statistics
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics
 *     responses:
 *       200:
 *         description: Shift statistics
 */
export const getShiftStatistics = async (req: Request, res: Response) => {
  try {
    const guardId = (req as any).user?.guard?.id || (req as any).user?.id;
    const { startDate, endDate } = req.query;

    if (!guardId) {
      return res.status(401).json({ 
        success: false,
        error: 'Guard not found' 
      });
    }

    const stats = await shiftService.getGuardShiftStats(
      guardId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('Error getting shift statistics:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to get shift statistics' 
    });
  }
};
