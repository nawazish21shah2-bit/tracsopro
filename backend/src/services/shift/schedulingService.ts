import { ShiftStatus } from '@prisma/client';
import { addDays } from 'date-fns';
import { NotFoundError, BadRequestError, ValidationError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import shiftConflictService, { ConflictInfo } from '../shiftConflictService.js';
import prisma from '../../config/database.js';
import { transformShiftForFrontend } from './transformShift.js';
import type { CreateShiftData } from './types.js';

export type { CreateShiftData } from './types.js';

class ShiftService {
  /**
   * Block create/update when guard has overlapping shifts or exceeds overtime limits.
   */
  private async assertShiftSchedulingAllowed(
    data: {
      guardId?: string | null;
      siteId?: string | null;
      scheduledStartTime: Date;
      scheduledEndTime: Date;
    },
    excludeShiftId?: string
  ): Promise<void> {
    if (!data.guardId) {
      return;
    }

    const conflicts = await shiftConflictService.detectConflicts({
      guardId: data.guardId,
      siteId: data.siteId || undefined,
      scheduledStartTime: data.scheduledStartTime,
      scheduledEndTime: data.scheduledEndTime,
      excludeShiftId,
    });

    const blockingConflicts = conflicts.filter((c: ConflictInfo) => c.severity === 'error');
    if (blockingConflicts.length > 0) {
      throw new ValidationError(
        `Cannot schedule shift: ${blockingConflicts.map((c: ConflictInfo) => c.message).join('; ')}`
      );
    }

    const warnings = conflicts.filter((c: ConflictInfo) => c.severity === 'warning');
    if (warnings.length > 0) {
      logger.warn(`Shift scheduling warnings: ${warnings.map((c: ConflictInfo) => c.message).join('; ')}`);
    }
  }

  /**
   * Create a new shift
   * Guard can be assigned later via assignGuardToShift method
   */
  async createShift(data: CreateShiftData, securityCompanyId?: string): Promise<any> {
    // Validate guard exists if guardId is provided
    if (data.guardId) {
      const guard = await prisma.guard.findUnique({
        where: { id: data.guardId },
        include: {
          companyGuards: {
            where: { isActive: true },
            select: { securityCompanyId: true },
          },
        },
      });

      if (!guard) {
        throw new NotFoundError('Guard not found');
      }

      // Multi-tenant: Verify guard belongs to company if securityCompanyId provided
      if (securityCompanyId) {
        const guardCompany = guard.companyGuards.find(
          cg => cg.securityCompanyId === securityCompanyId
        );
        if (!guardCompany) {
          throw new ValidationError('Guard does not belong to your company');
        }
      }
    }

    // If siteId is provided, validate and get clientId from site
    let siteId: string | null = null;
    let clientId: string | null = data.clientId || null;

    if (data.siteId) {
      const site = await prisma.site.findUnique({
        where: { id: data.siteId },
        include: {
          client: {
            include: {
              companyClients: {
                where: { isActive: true },
                select: { securityCompanyId: true },
              },
            },
          },
          companySites: {
            select: { securityCompanyId: true },
          },
        },
      });

      if (!site) {
        throw new NotFoundError('Site not found');
      }

      // Multi-tenant: Verify site belongs to company if securityCompanyId provided
      if (securityCompanyId) {
        const siteCompany = site.companySites.find(
          cs => cs.securityCompanyId === securityCompanyId
        );
        if (!siteCompany) {
          throw new ValidationError('Site does not belong to your company');
        }
      }

      siteId = site.id;
      clientId = site.clientId;

      // Use site's name and address if not provided
      if (!data.locationName) {
        data.locationName = site.name;
      }
      if (!data.locationAddress) {
        data.locationAddress = site.address;
      }
    }

    // Multi-tenant: Verify client belongs to company when clientId is provided directly
    if (!data.siteId && clientId && securityCompanyId) {
      const companyClient = await prisma.companyClient.findFirst({
        where: {
          clientId,
          securityCompanyId,
          isActive: true,
        },
      });
      if (!companyClient) {
        throw new ValidationError('Client does not belong to your company');
      }
    }

    const shiftData: any = {
      siteId: siteId,
      clientId: clientId,
      locationId: data.locationId,
      locationName: data.locationName,
      locationAddress: data.locationAddress,
      scheduledStartTime: data.scheduledStartTime,
      scheduledEndTime: data.scheduledEndTime,
      description: data.description,
      notes: data.notes,
    };

    if (data.guardId) {
      shiftData.guardId = data.guardId;
    }

    await this.assertShiftSchedulingAllowed(
      {
        guardId: data.guardId,
        siteId,
        scheduledStartTime: data.scheduledStartTime,
        scheduledEndTime: data.scheduledEndTime,
      }
    );

    const shift = await prisma.shift.create({
      data: shiftData,
      include: {
        guard: data.guardId ? {
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
        } : undefined,
        site: {
          include: {
            client: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true }
                }
              }
            }
          }
        },
        client: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        },
        location: true,
      },
    });

    logger.info(`Shift created${data.guardId ? ` for guard ${data.guardId}` : ' (unassigned)'}${siteId ? ` at site ${siteId}` : ''}: ${shift.id}`, {
      shiftId: shift.id,
      guardId: shift.guardId,
      scheduledStartTime: shift.scheduledStartTime,
      scheduledEndTime: shift.scheduledEndTime,
      status: shift.status,
    });

    return shift;
  }

  /**
   * Create recurring shifts for a week (7 days) or month (30 days)
   */
  async createBulkShifts(
    data: CreateShiftData & { repeatPattern: 'week' | 'month' },
    securityCompanyId?: string
  ): Promise<{ count: number; shifts: any[] }> {
    const durationMs =
      data.scheduledEndTime.getTime() - data.scheduledStartTime.getTime();
    const dayCount = data.repeatPattern === 'week' ? 7 : 30;
    const shifts: any[] = [];

    for (let i = 0; i < dayCount; i++) {
      const dayStart = new Date(data.scheduledStartTime);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart.getTime() + durationMs);

      const shift = await this.createShift(
        {
          ...data,
          scheduledStartTime: dayStart,
          scheduledEndTime: dayEnd,
        },
        securityCompanyId
      );
      shifts.push(shift);
    }

    logger.info(`Bulk created ${shifts.length} shifts (${data.repeatPattern})`);
    return { count: shifts.length, shifts };
  }

  /**
   * Assign a guard to an existing shift
   */
  async assignGuardToShift(shiftId: string, guardId: string, securityCompanyId?: string): Promise<any> {
    // Validate shift exists and is unassigned
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        site: {
          include: {
            companySites: {
              where: { isActive: true },
              select: { securityCompanyId: true },
            },
          },
        },
        client: {
          include: {
            companyClients: {
              where: { isActive: true },
              select: { securityCompanyId: true },
            },
          },
        },
      },
    });

    if (!shift) {
      throw new NotFoundError('Shift not found');
    }

    if (securityCompanyId) {
      const shiftBelongsToCompany =
        (shift.site && shift.site.companySites.some(cs => cs.securityCompanyId === securityCompanyId)) ||
        (shift.client && shift.client.companyClients.some(cc => cc.securityCompanyId === securityCompanyId));

      if (!shiftBelongsToCompany) {
        throw new ValidationError('Shift does not belong to your company');
      }
    }

    if (shift.guardId) {
      throw new ValidationError('Shift already has a guard assigned');
    }

    if (shift.status !== 'SCHEDULED') {
      throw new ValidationError('Can only assign guard to scheduled shifts');
    }

    // Validate guard exists and belongs to company
    const guard = await prisma.guard.findUnique({
      where: { id: guardId },
      include: {
        companyGuards: {
          where: { isActive: true },
          select: { securityCompanyId: true },
        },
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

    if (!guard) {
      throw new NotFoundError('Guard not found');
    }

    // Multi-tenant: Verify guard belongs to company if securityCompanyId provided
    if (securityCompanyId) {
      const guardCompany = guard.companyGuards.find(
        cg => cg.securityCompanyId === securityCompanyId
      );
      if (!guardCompany) {
        throw new ValidationError('Guard does not belong to your company');
      }
    }

    // Check for conflicts using conflict service
    const conflicts = await shiftConflictService.detectConflicts({
      guardId: guardId,
      siteId: shift.siteId || undefined,
      scheduledStartTime: shift.scheduledStartTime,
      scheduledEndTime: shift.scheduledEndTime,
      excludeShiftId: shiftId, // Exclude current shift from conflict checks
    });

    // Block assignment if there are error-level conflicts
    const blockingConflicts = conflicts.filter((c: ConflictInfo) => c.severity === 'error');
    if (blockingConflicts.length > 0) {
      const errorMessages = blockingConflicts.map((c: ConflictInfo) => c.message).join('; ');
      throw new ValidationError(`Cannot assign guard: ${errorMessages}`);
    }

    // Log warnings but allow assignment
    const warnings = conflicts.filter((c: ConflictInfo) => c.severity === 'warning');
    if (warnings.length > 0) {
      logger.warn(`Guard assignment warnings: ${warnings.map((c: ConflictInfo) => c.message).join('; ')}`);
    }

    // Assign guard to shift
    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        guardId: guardId,
      },
      include: {
        guard: {
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
        },
        site: {
          include: {
            client: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true }
                }
              }
            }
          }
        },
        client: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        },
        location: true,
      },
    });

    logger.info(`Guard ${guardId} assigned to shift ${shiftId}`);

    return updatedShift;
  }

  /**
   * Update an existing shift (admin or client owner)
   */
  async updateShift(
    shiftId: string,
    data: {
      guardId?: string | null;
      siteId?: string;
      scheduledStartTime?: Date;
      scheduledEndTime?: Date;
      description?: string;
      notes?: string;
    },
    options?: { securityCompanyId?: string; clientId?: string }
  ): Promise<any> {
    // Validate shift exists
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        site: {
          include: {
            companySites: { where: { isActive: true }, select: { securityCompanyId: true } },
          },
        },
        client: {
          include: {
            companyClients: { where: { isActive: true }, select: { securityCompanyId: true } },
          },
        },
      },
    });

    if (!shift) throw new NotFoundError('Shift not found');

    // Ownership check for admin (company)
    if (options?.securityCompanyId) {
      const belongs =
        (shift.site && shift.site.companySites.some(cs => cs.securityCompanyId === options.securityCompanyId)) ||
        (shift.client && shift.client.companyClients.some(cc => cc.securityCompanyId === options.securityCompanyId));
      if (!belongs) throw new ValidationError('Shift does not belong to your company');
    }

    // Ownership check for client
    if (options?.clientId && shift.clientId !== options.clientId) {
      throw new ValidationError('Shift does not belong to this client');
    }

    // Can only edit SCHEDULED shifts
    if (shift.status !== 'SCHEDULED') {
      throw new ValidationError('Only scheduled shifts can be edited');
    }

    const updateData: any = {};
    if (data.scheduledStartTime !== undefined) updateData.scheduledStartTime = data.scheduledStartTime;
    if (data.scheduledEndTime !== undefined) updateData.scheduledEndTime = data.scheduledEndTime;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if ('guardId' in data) updateData.guardId = data.guardId ?? null;
    if (data.siteId !== undefined) updateData.siteId = data.siteId;

    const effectiveGuardId =
      'guardId' in data ? (data.guardId ?? null) : shift.guardId;
    const effectiveSiteId = data.siteId ?? shift.siteId;
    const effectiveStart = data.scheduledStartTime ?? shift.scheduledStartTime;
    const effectiveEnd = data.scheduledEndTime ?? shift.scheduledEndTime;

    await this.assertShiftSchedulingAllowed(
      {
        guardId: effectiveGuardId,
        siteId: effectiveSiteId,
        scheduledStartTime: effectiveStart,
        scheduledEndTime: effectiveEnd,
      },
      shiftId
    );

    const updated = await prisma.shift.update({
      where: { id: shiftId },
      data: updateData,
      include: {
        guard: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        site: {
          include: {
            client: {
              include: { user: { select: { firstName: true, lastName: true, email: true } } },
            },
          },
        },
        client: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
        location: true,
      },
    });

    logger.info(`Shift ${shiftId} updated`);
    return updated;
  }

  /**
   * Delete (cancel) a shift. Only SCHEDULED shifts can be deleted.
   */
  async deleteShift(
    shiftId: string,
    options?: { securityCompanyId?: string; clientId?: string }
  ): Promise<{ success: boolean }> {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        site: {
          include: {
            companySites: { where: { isActive: true }, select: { securityCompanyId: true } },
          },
        },
        client: {
          include: {
            companyClients: { where: { isActive: true }, select: { securityCompanyId: true } },
          },
        },
      },
    });

    if (!shift) throw new NotFoundError('Shift not found');

    // Ownership check for admin
    if (options?.securityCompanyId) {
      const belongs =
        (shift.site && shift.site.companySites.some(cs => cs.securityCompanyId === options.securityCompanyId)) ||
        (shift.client && shift.client.companyClients.some(cc => cc.securityCompanyId === options.securityCompanyId));
      if (!belongs) throw new ValidationError('Shift does not belong to your company');
    }

    // Ownership check for client
    if (options?.clientId && shift.clientId !== options.clientId) {
      throw new ValidationError('Shift does not belong to this client');
    }

    // Allow cancelling SCHEDULED or IN_PROGRESS shifts; hard-delete if SCHEDULED
    if (shift.status === 'COMPLETED') {
      throw new ValidationError('Completed shifts cannot be deleted');
    }

    if (shift.status === 'SCHEDULED') {
      // Hard delete scheduled shifts
      await prisma.shift.delete({ where: { id: shiftId } });
    } else {
      // Soft-cancel in-progress shifts
      await prisma.shift.update({
        where: { id: shiftId },
        data: { status: 'CANCELLED' },
      });
    }

    logger.info(`Shift ${shiftId} deleted/cancelled`);
    return { success: true };
  }

  /**
   * Get shift by ID
   */
  async getShiftById(shiftId: string) {
    return await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        guard: {
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
        },
        location: true,
        shiftReports: true,
      },
    });
  }

  async getShiftsByDateRange(
    startDate: Date,
    endDate: Date,
    options?: {
      guardId?: string;
      clientId?: string;
      siteId?: string;
      securityCompanyId?: string;
    }
  ) {
    const whereClause: any = {
      scheduledStartTime: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (options?.guardId) {
      whereClause.guardId = options.guardId;
    }

    if (options?.clientId) {
      whereClause.clientId = options.clientId;
    }

    if (options?.siteId) {
      whereClause.siteId = options.siteId;
    }

    // Multi-tenant filtering by security company
    if (options?.securityCompanyId) {
      whereClause.OR = [
        // Guard belongs to company
        {
          guard: {
            companyGuards: {
              some: {
                securityCompanyId: options.securityCompanyId,
                isActive: true,
              },
            },
          },
        },
        // Client belongs to company
        {
          client: {
            companyClients: {
              some: {
                securityCompanyId: options.securityCompanyId,
                isActive: true,
              },
            },
          },
        },
        // Site belongs to company
        {
          site: {
            companySites: {
              some: {
                securityCompanyId: options.securityCompanyId,
                isActive: true,
              },
            },
          },
        },
      ];
    }

    const shifts = await prisma.shift.findMany({
      where: whereClause,
      include: {
        guard: {
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
        },
        site: {
          include: {
            client: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true }
                }
              }
            }
          }
        },
        client: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        },
        location: true,
      },
      orderBy: {
        scheduledStartTime: 'asc',
      },
    });

    return transformShiftForFrontend(shifts);
  }

  /**
   * Get client's shifts (for client dashboard)
   */
  async getClientShifts(
    clientId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      status?: ShiftStatus;
      siteId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      clientId,
    };

    if (options?.startDate || options?.endDate) {
      whereClause.scheduledStartTime = {};
      if (options.startDate) {
        whereClause.scheduledStartTime.gte = options.startDate;
      }
      if (options.endDate) {
        whereClause.scheduledStartTime.lte = options.endDate;
      }
    }

    if (options?.status) {
      whereClause.status = options.status;
    }

    if (options?.siteId) {
      whereClause.siteId = options.siteId;
    }

    const [shifts, total] = await Promise.all([
      prisma.shift.findMany({
        where: whereClause,
        include: {
          guard: {
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
          },
          site: true,
          location: true,
        },
        orderBy: {
          scheduledStartTime: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.shift.count({ where: whereClause }),
    ]);

    return {
      shifts: transformShiftForFrontend(shifts),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get 30-day schedule for guard or admin
   */
  async get30DaySchedule(
    guardId?: string,
    securityCompanyId?: string,
    startDate?: Date
  ) {
    const start = startDate || new Date();
    const end = addDays(start, 30);

    return this.getShiftsByDateRange(start, end, {
      guardId,
      securityCompanyId,
    });
  }
}

export default new ShiftService();
