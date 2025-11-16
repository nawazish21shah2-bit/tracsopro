import prisma from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

interface GeofenceEventData {
  guardId: string;
  geofenceId: string;
  eventType: 'ENTER' | 'EXIT';
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
  timestamp: number;
}

export class TrackingService {
  async recordLocation(guardId: string, data: any) {
    // First try to find guard by ID, then by userId
    let guard = await prisma.guard.findUnique({
      where: { id: guardId },
    });

    if (!guard) {
      // Try to find guard by userId
      guard = await prisma.guard.findUnique({
        where: { userId: guardId },
      });
    }

    if (!guard) {
      throw new NotFoundError('Guard not found');
    }

    const record = await prisma.trackingRecord.create({
      data: {
        guardId: guard.id, // Use the actual guard ID
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        batteryLevel: data.batteryLevel,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      },
    });

    logger.debug(`Location recorded for guard: ${guardId}`);

    return record;
  }

  async getGuardTrackingHistory(guardId: string, startDate?: Date, endDate?: Date, limit: number = 100) {
    const guard = await prisma.guard.findUnique({
      where: { id: guardId },
    });

    if (!guard) {
      throw new NotFoundError('Guard not found');
    }

    const where: any = { guardId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const records = await prisma.trackingRecord.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    return records;
  }

  async getLatestLocation(guardId: string) {
    const guard = await prisma.guard.findUnique({
      where: { id: guardId },
    });

    if (!guard) {
      throw new NotFoundError('Guard not found');
    }

    const latest = await prisma.trackingRecord.findFirst({
      where: { guardId },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return latest;
  }

  async getActiveGuardsLocations() {
    // Get all guards currently on duty
    const activeGuards = await prisma.guard.findMany({
      where: {
        status: 'ON_DUTY',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get latest location for each guard
    const locationsPromises = activeGuards.map(async (guard) => {
      const latest = await prisma.trackingRecord.findFirst({
        where: { guardId: guard.id },
        orderBy: {
          timestamp: 'desc',
        },
      });

      return {
        guardId: guard.id,
        guardName: `${guard.user.firstName} ${guard.user.lastName}`,
        employeeId: guard.employeeId,
        location: latest,
      };
    });

    const locations = await Promise.all(locationsPromises);

    return locations.filter(l => l.location !== null);
  }

  async deleteOldRecords(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.trackingRecord.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Deleted ${result.count} old tracking records`);

    return { deleted: result.count };
  }

  /**
   * Record geofence event (enter/exit)
   */
  async recordGeofenceEvent(eventData: GeofenceEventData) {
    try {
      // Validate guard exists (try by ID first, then by userId)
      let guard = await prisma.guard.findUnique({
        where: { id: eventData.guardId },
      });

      if (!guard) {
        // Try to find guard by userId
        guard = await prisma.guard.findUnique({
          where: { userId: eventData.guardId },
        });
      }

      if (!guard) {
        throw new NotFoundError('Guard not found');
      }

      // Record the geofence event
      const geofenceEvent = await prisma.geofenceEvent.create({
        data: {
          guardId: guard.id, // Use the actual guard ID
          geofenceId: eventData.geofenceId,
          eventType: eventData.eventType,
          latitude: eventData.location.latitude,
          longitude: eventData.location.longitude,
          accuracy: eventData.location.accuracy,
          timestamp: new Date(eventData.timestamp),
        },
      });

      logger.info(`Geofence ${eventData.eventType} event recorded for guard ${eventData.guardId}`);

      return geofenceEvent;
    } catch (error) {
      logger.error('Failed to record geofence event:', error);
      throw error;
    }
  }

  /**
   * Get geofence events for a guard
   */
  async getGeofenceEvents(guardId: string, startDate?: Date, endDate?: Date) {
    const guard = await prisma.guard.findUnique({
      where: { id: guardId },
    });

    if (!guard) {
      throw new NotFoundError('Guard not found');
    }

    const where: any = { guardId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const events = await prisma.geofenceEvent.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
    });

    return events;
  }

  /**
   * Get real-time location data for dashboard
   */
  async getRealTimeLocationData() {
    try {
      // Get all active guards with their latest locations
      const activeGuards = await prisma.guard.findMany({
        where: {
          status: {
            in: ['ON_DUTY', 'ACTIVE'],
          },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      const locationData = await Promise.all(
        activeGuards.map(async (guard) => {
          // Get latest location
          const latestLocation = await prisma.trackingRecord.findFirst({
            where: { guardId: guard.id },
            orderBy: { timestamp: 'desc' },
          });

          // Get current shift if any
          const currentShift = await prisma.shift.findFirst({
            where: {
              guardId: guard.id,
              status: 'IN_PROGRESS',
            },
            include: {
              location: true,
            },
          });

          return {
            guard: {
              id: guard.id,
              employeeId: guard.employeeId,
              name: `${guard.user.firstName} ${guard.user.lastName}`,
              status: guard.status,
            },
            location: latestLocation,
            currentShift: currentShift,
            lastUpdate: latestLocation?.timestamp,
          };
        })
      );

      return locationData.filter(data => data.location !== null);
    } catch (error) {
      logger.error('Failed to get real-time location data:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Check if location is within geofence
   */
  async checkLocationInGeofences(guardId: string, latitude: number, longitude: number) {
    try {
      // Get all active geofences for sites where guard might be assigned
      const activeShifts = await prisma.shift.findMany({
        where: {
          guardId,
          status: {
            in: ['SCHEDULED', 'IN_PROGRESS'],
          },
        },
        include: {
          location: true,
        },
      });

      const geofenceChecks = activeShifts.map(shift => {
        if (!shift.location) return null;

        const distance = this.calculateDistance(
          latitude,
          longitude,
          shift.location.latitude,
          shift.location.longitude
        );

        // Assume 100m radius for now (could be configurable per location)
        const isWithinGeofence = distance <= 100;

        return {
          shiftId: shift.id,
          locationId: shift.locationId,
          locationName: shift.location.name,
          distance,
          isWithinGeofence,
        };
      }).filter(check => check !== null);

      return geofenceChecks;
    } catch (error) {
      logger.error('Failed to check geofences:', error);
      throw error;
    }
  }

  /**
   * Get location analytics for admin dashboard
   */
  async getLocationAnalytics(startDate?: Date, endDate?: Date) {
    try {
      const where: any = {};

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = startDate;
        if (endDate) where.timestamp.lte = endDate;
      }

      // Total location records
      const totalRecords = await prisma.trackingRecord.count({ where });

      // Unique guards tracked
      const uniqueGuards = await prisma.trackingRecord.findMany({
        where,
        select: { guardId: true },
        distinct: ['guardId'],
      });

      // Average accuracy
      const accuracyStats = await prisma.trackingRecord.aggregate({
        where,
        _avg: { accuracy: true },
        _min: { accuracy: true },
        _max: { accuracy: true },
      });

      // Records per day
      const recordsPerDay = await prisma.trackingRecord.groupBy({
        by: ['timestamp'],
        where,
        _count: true,
      });

      return {
        totalRecords,
        uniqueGuardsCount: uniqueGuards.length,
        accuracyStats: {
          average: accuracyStats._avg.accuracy,
          min: accuracyStats._min.accuracy,
          max: accuracyStats._max.accuracy,
        },
        recordsPerDay: recordsPerDay.length,
      };
    } catch (error) {
      logger.error('Failed to get location analytics:', error);
      throw error;
    }
  }
}

export default new TrackingService();
