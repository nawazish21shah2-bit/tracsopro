import { Request, Response } from 'express';
import { EmergencyService } from '../services/emergencyService.js';
import { logger } from '../utils/logger.js';

const emergencyService = EmergencyService.getInstance();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    guardId?: string;
  };
}

/**
 * Trigger emergency alert (Guards only)
 */
export const triggerEmergencyAlert = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, severity, location, message } = req.body;
    const guardId = req.user?.guardId;

    if (!guardId) {
      return res.status(400).json({
        success: false,
        message: 'Guard ID not found in request',
      });
    }

    // Validate required fields
    if (!type || !severity || !location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, severity, location',
      });
    }

    // Validate location coordinates
    if (!location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location must include latitude and longitude',
      });
    }

    const alert = await emergencyService.triggerEmergencyAlert({
      guardId,
      type,
      severity,
      location,
      message,
    });

    logger.info(`Emergency alert triggered by guard ${guardId}: ${type} - ${severity}`);

    res.status(201).json({
      success: true,
      data: alert,
      message: 'Emergency alert triggered successfully',
    });
  } catch (error) {
    logger.error('Error triggering emergency alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger emergency alert',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Acknowledge emergency alert (Admins and Clients)
 */
export const acknowledgeEmergencyAlert = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { alertId } = req.params;
    const acknowledgedBy = req.user?.id;

    if (!acknowledgedBy) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    await emergencyService.acknowledgeEmergencyAlert(alertId, acknowledgedBy);

    logger.info(`Emergency alert ${alertId} acknowledged by ${acknowledgedBy}`);

    res.json({
      success: true,
      message: 'Emergency alert acknowledged successfully',
    });
  } catch (error) {
    logger.error('Error acknowledging emergency alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge emergency alert',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Resolve emergency alert (Admins only)
 */
export const resolveEmergencyAlert = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { alertId } = req.params;
    const { resolution, status = 'RESOLVED' } = req.body;
    const resolvedBy = req.user?.id;

    if (!resolvedBy) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!resolution) {
      return res.status(400).json({
        success: false,
        message: 'Resolution description is required',
      });
    }

    await emergencyService.resolveEmergencyAlert(alertId, resolvedBy, resolution, status);

    logger.info(`Emergency alert ${alertId} resolved by ${resolvedBy}: ${status}`);

    res.json({
      success: true,
      message: 'Emergency alert resolved successfully',
    });
  } catch (error) {
    logger.error('Error resolving emergency alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve emergency alert',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Get active emergency alerts (Admins and Clients)
 */
export const getActiveEmergencyAlerts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const alerts = await emergencyService.getActiveEmergencyAlerts();

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    logger.error('Error getting active emergency alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active emergency alerts',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Get emergency alert history for a guard (All roles)
 */
export const getGuardEmergencyHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { guardId } = req.params;
    const { limit = '50' } = req.query;

    // Guards can only see their own history
    if (req.user?.role === 'GUARD' && req.user?.guardId !== guardId) {
      return res.status(403).json({
        success: false,
        message: 'Guards can only access their own emergency history',
      });
    }

    const alerts = await emergencyService.getGuardEmergencyHistory(
      guardId,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    logger.error('Error getting guard emergency history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get guard emergency history',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Get emergency statistics (Admins only)
 */
export const getEmergencyStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // This would be implemented with proper date filtering
    // For now, return basic stats
    const activeAlerts = await emergencyService.getActiveEmergencyAlerts();
    
    const stats = {
      activeAlerts: activeAlerts.length,
      criticalAlerts: activeAlerts.filter(alert => alert.severity === 'CRITICAL').length,
      highAlerts: activeAlerts.filter(alert => alert.severity === 'HIGH').length,
      mediumAlerts: activeAlerts.filter(alert => alert.severity === 'MEDIUM').length,
      lowAlerts: activeAlerts.filter(alert => alert.severity === 'LOW').length,
      alertsByType: {
        panic: activeAlerts.filter(alert => alert.type === 'PANIC').length,
        medical: activeAlerts.filter(alert => alert.type === 'MEDICAL').length,
        security: activeAlerts.filter(alert => alert.type === 'SECURITY').length,
        fire: activeAlerts.filter(alert => alert.type === 'FIRE').length,
        custom: activeAlerts.filter(alert => alert.type === 'CUSTOM').length,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting emergency statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency statistics',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

export default {
  triggerEmergencyAlert,
  acknowledgeEmergencyAlert,
  resolveEmergencyAlert,
  getActiveEmergencyAlerts,
  getGuardEmergencyHistory,
  getEmergencyStatistics,
};
