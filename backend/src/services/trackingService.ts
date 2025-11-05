import prisma from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class TrackingService {
  async recordLocation(guardId: string, data: any) {
    const guard = await prisma.guard.findUnique({
      where: { id: guardId },
    });

    if (!guard) {
      throw new NotFoundError('Guard not found');
    }

    const record = await prisma.trackingRecord.create({
      data: {
        guardId,
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
}

export default new TrackingService();
