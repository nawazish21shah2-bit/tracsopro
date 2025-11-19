import { Request, Response } from 'express';
import shiftService from '../services/shiftServiceSimple.js';
import { logger } from '../utils/logger.js';

export const createShift = async (req: Request, res: Response) => {
  try {
    const { guardId, locationName, locationAddress, scheduledStartTime, scheduledEndTime, description, notes } = req.body;

    if (!guardId || !locationName || !locationAddress || !scheduledStartTime || !scheduledEndTime) {
      return res.status(400).json({
        success: false,
        error: 'guardId, locationName, locationAddress, scheduledStartTime and scheduledEndTime are required',
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
