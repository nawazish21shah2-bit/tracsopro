import { Request, Response } from 'express';
import shiftService from '../services/shiftServiceSimple.js';
import { logger } from '../utils/logger.js';

export const createShift = async (req: Request, res: Response) => {
  try {
    const { guardId, siteId, locationName, locationAddress, scheduledStartTime, scheduledEndTime, description, notes } = req.body;

    if (!guardId || !scheduledStartTime || !scheduledEndTime) {
      return res.status(400).json({
        success: false,
        error: 'guardId, scheduledStartTime and scheduledEndTime are required',
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

    const shift = await shiftService.createShift({
      guardId,
      siteId, // Optional: if provided, will link to site and client
      locationName: locationName || '', // Will be overridden by site data if siteId provided
      locationAddress: locationAddress || '', // Will be overridden by site data if siteId provided
      scheduledStartTime: new Date(scheduledStartTime),
      scheduledEndTime: new Date(scheduledEndTime),
      description,
      notes,
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

export default {
  createShift,
};
