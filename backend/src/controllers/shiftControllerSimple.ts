// Simplified Shift Controller for Phase 2 Testing
import { Request, Response } from 'express';
import shiftService from '../services/shiftServiceSimple.js';
import { logger } from '../utils/logger.js';

// Helper to get guard ID from request
function getGuardId(req: any): string | null {
  // Use guardId from auth middleware if available (set when user has guard role)
  if (req.guardId) {
    return req.guardId;
  }
  // Fallback to user.guard.id if guardId not set
  if (req.user?.guard?.id) {
    return req.user.guard.id;
  }
  // If user is a guard role, guardId should be set by auth middleware
  // If not set, return null (shouldn't happen in normal flow)
  return null;
}

/**
 * Get shift statistics
 */
export const getShiftStatistics = async (req: Request, res: Response) => {
  try {
    const guardId = getGuardId(req as any);
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

/**
 * Get active shift
 */
export const getActiveShift = async (req: Request, res: Response) => {
  try {
    const guardId = getGuardId(req as any);

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
 * Get upcoming shifts
 */
export const getUpcomingShifts = async (req: Request, res: Response) => {
  try {
    const guardId = getGuardId(req as any);
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
 * Get today's shifts
 */
export const getTodayShifts = async (req: Request, res: Response) => {
  try {
    const guardId = getGuardId(req as any);

    if (!guardId) {
      return res.status(401).json({ 
        success: false,
        error: 'Guard not found' 
      });
    }

    const todayShifts = await shiftService.getTodayShifts(guardId);

    res.json({
      success: true,
      data: todayShifts,
    });
  } catch (error: any) {
    logger.error('Error getting today shifts:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to get today shifts' 
    });
  }
};

/**
 * Get past shifts
 */
export const getPastShifts = async (req: Request, res: Response) => {
  try {
    const guardId = getGuardId(req as any);
    const limit = parseInt(req.query.limit as string) || 20;

    if (!guardId) {
      return res.status(401).json({ 
        success: false,
        error: 'Guard not found' 
      });
    }

    const pastShifts = await shiftService.getPastShifts(guardId, limit);

    res.json({
      success: true,
      data: pastShifts,
    });
  } catch (error: any) {
    logger.error('Error getting past shifts:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to get past shifts' 
    });
  }
};

/**
 * Get weekly shift summary
 */
export const getWeeklyShiftSummary = async (req: Request, res: Response) => {
  try {
    const guardId = getGuardId(req as any);

    if (!guardId) {
      return res.status(401).json({ 
        success: false,
        error: 'Guard not found' 
      });
    }

    const weeklyShifts = await shiftService.getWeeklyShiftSummary(guardId);

    res.json({
      success: true,
      data: weeklyShifts,
    });
  } catch (error: any) {
    logger.error('Error getting weekly shift summary:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to get weekly shift summary' 
    });
  }
};

/**
 * Create shift
 */
export const createShift = async (req: Request, res: Response) => {
  try {
    const guardId = getGuardId(req as any);
    const { locationName, locationAddress, scheduledStartTime, scheduledEndTime, description, notes } = req.body;

    if (!guardId) {
      return res.status(401).json({ 
        success: false,
        error: 'Guard not found' 
      });
    }

    const shift = await shiftService.createShift({
      guardId,
      locationName,
      locationAddress,
      scheduledStartTime: new Date(scheduledStartTime),
      scheduledEndTime: new Date(scheduledEndTime),
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
 * Check in to shift
 */
export const checkInToShift = async (req: Request, res: Response) => {
  try {
    const { id: shiftId } = req.params;
    const guardId = getGuardId(req as any);
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
 * Check out from shift
 */
export const checkOutFromShift = async (req: Request, res: Response) => {
  try {
    const { id: shiftId } = req.params;
    const guardId = getGuardId(req as any);
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
 * Start break
 */
export const startBreak = async (req: Request, res: Response) => {
  try {
    const guardId = getGuardId(req as any);
    const { id: shiftId } = req.params;
    const { breakType, location, notes } = req.body;

    if (!guardId) {
      return res.status(401).json({
        success: false,
        error: 'Guard not found',
      });
    }

    const breakRecord = await shiftService.startBreak({
      shiftId,
      guardId,
      breakType,
      location,
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Break started successfully',
      data: breakRecord,
    });
  } catch (error: any) {
    logger.error('Error starting break:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to start break',
    });
  }
};

/**
 * End break
 */
export const endBreak = async (req: Request, res: Response) => {
  try {
    const guardId = getGuardId(req as any);
    const { shiftId, breakId } = req.params;
    const { location, notes } = req.body;

    if (!guardId) {
      return res.status(401).json({
        success: false,
        error: 'Guard not found',
      });
    }

    const breakRecord = await shiftService.endBreak({
      shiftId,
      breakId,
      guardId,
      location,
      notes,
    });

    res.json({
      success: true,
      message: 'Break ended successfully',
      data: breakRecord,
    });
  } catch (error: any) {
    logger.error('Error ending break:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to end break',
    });
  }
};

/**
 * Report incident
 */
export const reportIncident = async (req: Request, res: Response) => {
  try {
    const guardId = getGuardId(req as any);
    const { id: shiftId } = req.params;
    const { incidentType, severity, title, description, location, attachments } = req.body;

    if (!guardId) {
      return res.status(401).json({
        success: false,
        error: 'Guard not found',
      });
    }

    const incident = await shiftService.reportIncident({
      shiftId,
      guardId,
      incidentType,
      severity,
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
      error: error.message || 'Failed to report incident',
    });
  }
};
