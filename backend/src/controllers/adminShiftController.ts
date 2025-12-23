import { Request, Response } from 'express';
import shiftService from '../services/shiftService.js';
import { logger } from '../utils/logger.js';
import { AuthRequest } from '../middleware/auth.js';

export const createShift = async (req: AuthRequest, res: Response) => {
  try {
    // SUPER_ADMIN can create shifts for any company (must provide securityCompanyId in body)
    // Regular ADMIN uses their own securityCompanyId
    let securityCompanyId = req.securityCompanyId;
    
    if (req.user?.role === 'SUPER_ADMIN') {
      securityCompanyId = req.body.securityCompanyId;
      if (!securityCompanyId) {
        return res.status(400).json({
          success: false,
          error: 'Security company ID is required in request body for SUPER_ADMIN.',
        });
      }
    } else if (!securityCompanyId) {
      return res.status(403).json({
        success: false,
        error: 'Security company ID not found. Admin must be linked to a company.',
      });
    }

    const { guardId, siteId, locationName, locationAddress, scheduledStartTime, scheduledEndTime, description, notes, clientId } = req.body;

    // Admin can create shift with or without guard (can assign later)
    if (!scheduledStartTime || !scheduledEndTime) {
      return res.status(400).json({
        success: false,
        error: 'scheduledStartTime and scheduledEndTime are required',
      });
    }

    // If siteId is provided, locationName and locationAddress can be omitted (will be fetched from site)
    // If siteId is not provided, locationName and locationAddress are required
    if (!siteId && (!locationName || !locationAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Either siteId or both locationName and locationAddress are required',
      });
    }

    logger.info('Creating admin shift', {
      guardId,
      siteId,
      scheduledStartTime,
      scheduledEndTime,
      locationName,
      locationAddress,
      securityCompanyId: req.securityCompanyId,
    });

    const shift = await shiftService.createShift({
      guardId: guardId || undefined, // Optional - can assign later
      siteId, // Optional: if provided, will link to site and client
      clientId: clientId || undefined, // Support direct clientId
      locationName: locationName || '', // Will be overridden by site data if siteId provided
      locationAddress: locationAddress || '', // Will be overridden by site data if siteId provided
      scheduledStartTime: new Date(scheduledStartTime),
      scheduledEndTime: new Date(scheduledEndTime),
      description,
      notes,
    }, securityCompanyId);

    logger.info('Admin shift created successfully', {
      shiftId: shift.id,
      guardId: shift.guardId,
      scheduledStartTime: shift.scheduledStartTime,
      scheduledEndTime: shift.scheduledEndTime,
      status: shift.status,
    });

    return res.status(201).json({
      success: true,
      message: 'Shift created successfully',
      data: shift,
    });
  } catch (error: any) {
    logger.error('Admin create shift error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to create shift',
    });
  }
};

export const getShifts = async (req: AuthRequest, res: Response) => {
  try {
    const { date, guardId, startDate, endDate } = req.query;

    // Support both single date and date range
    if (date) {
      const targetDate = new Date(date as string);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
        });
      }

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const shifts = await shiftService.getShiftsByDateRange(
        startOfDay,
        endOfDay,
        {
          guardId: guardId as string | undefined,
          securityCompanyId: req.securityCompanyId,
        }
      );

      return res.status(200).json({
        success: true,
        data: shifts,
        message: 'Shifts fetched successfully',
      });
    } else if (startDate && endDate) {
      // Date range query
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
        });
      }

      const shifts = await shiftService.getShiftsByDateRange(start, end, {
        guardId: guardId as string | undefined,
        securityCompanyId: req.securityCompanyId,
      });

      return res.status(200).json({
        success: true,
        data: shifts,
        message: 'Shifts fetched successfully',
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either date or both startDate and endDate are required',
      });
    }
  } catch (error: any) {
    logger.error('Admin get shifts error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch shifts',
    });
  }
};

export const get30DaySchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { guardId, startDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date();
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid startDate format. Use YYYY-MM-DD',
      });
    }

    const shifts = await shiftService.get30DaySchedule(
      guardId as string | undefined,
      req.securityCompanyId,
      start
    );

    return res.status(200).json({
      success: true,
      data: shifts,
      message: '30-day schedule fetched successfully',
    });
  } catch (error: any) {
    logger.error('Admin get 30-day schedule error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch 30-day schedule',
    });
  }
};

/**
 * Assign a guard to an unassigned shift
 */
export const assignGuardToShift = async (req: AuthRequest, res: Response) => {
  try {
    let securityCompanyId = req.securityCompanyId;
    
    if (req.user?.role === 'SUPER_ADMIN') {
      securityCompanyId = req.body.securityCompanyId;
      if (!securityCompanyId) {
        return res.status(400).json({
          success: false,
          error: 'Security company ID is required in request body for SUPER_ADMIN.',
        });
      }
    } else if (!securityCompanyId) {
      return res.status(403).json({
        success: false,
        error: 'Security company ID not found. Admin must be linked to a company.',
      });
    }

    const { shiftId } = req.params;
    const { guardId } = req.body;

    if (!guardId) {
      return res.status(400).json({
        success: false,
        error: 'guardId is required',
      });
    }

    const shift = await shiftService.assignGuardToShift(shiftId, guardId, securityCompanyId);

    return res.status(200).json({
      success: true,
      message: 'Guard assigned to shift successfully',
      data: shift,
    });
  } catch (error: any) {
    logger.error('Admin assign guard error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to assign guard to shift',
    });
  }
};

/**
 * Get unassigned shifts (shifts without guards)
 */
export const getUnassignedShifts = async (req: AuthRequest, res: Response) => {
  try {
    let securityCompanyId = req.securityCompanyId;
    
    if (req.user?.role === 'SUPER_ADMIN') {
      securityCompanyId = req.body.securityCompanyId || req.query.securityCompanyId as string;
    }

    if (!securityCompanyId) {
      return res.status(403).json({
        success: false,
        error: 'Security company ID not found',
      });
    }

    const { date, startDate, endDate } = req.query;

    let start: Date;
    let end: Date;

    if (date) {
      const targetDate = new Date(date as string);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
        });
      }
      start = new Date(targetDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(targetDate);
      end.setHours(23, 59, 59, 999);
    } else if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
        });
      }
    } else {
      // Default to today if no date specified
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }

    const shifts = await shiftService.getShiftsByDateRange(start, end, {
      securityCompanyId,
    });

    // Filter to only unassigned shifts
    const unassignedShifts = shifts.filter((shift: any) => !shift.guardId && shift.status === 'SCHEDULED');

    return res.status(200).json({
      success: true,
      data: unassignedShifts,
      message: 'Unassigned shifts fetched successfully',
    });
  } catch (error: any) {
    logger.error('Admin get unassigned shifts error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch unassigned shifts',
    });
  }
};

export default {
  createShift,
  getShifts,
  get30DaySchedule,
  assignGuardToShift,
  getUnassignedShifts,
};
