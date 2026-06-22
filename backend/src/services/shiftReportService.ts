import { ReportTypeEnum, ShiftReport } from '@prisma/client';
import prisma from '../config/database.js';

export interface CreateShiftReportData {
  shiftId: string;
  guardId: string;
  reportType: ReportTypeEnum;
  content: string;
}

class ShiftReportService {
  /**
   * Create a shift report
   */
  async createShiftReport(data: CreateShiftReportData): Promise<ShiftReport> {
    const guard = await prisma.guard.findFirst({
      where: { userId: data.guardId },
      select: { id: true },
    });

    if (!guard) {
      throw new Error('Guard profile not found');
    }

    const shift = await prisma.shift.findUnique({
      where: { id: data.shiftId },
    });

    if (!shift) {
      throw new Error('Shift not found');
    }

    if (shift.guardId !== guard.id) {
      throw new Error('Unauthorized: This shift does not belong to you');
    }

    return await prisma.shiftReport.create({
      data: {
        shiftId: data.shiftId,
        guardId: data.guardId,
        reportType: data.reportType,
        content: data.content,
      },
      include: {
        shift: {
          include: {
            location: true,
          },
        },
      },
    });
  }

  /**
   * Get shift report by ID
   */
  async getShiftReportById(reportId: string) {
    return await prisma.shiftReport.findUnique({
      where: { id: reportId },
      include: {
        shift: {
          include: {
            location: true,
          },
        },
        guard: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get all reports for a guard
   */
  async getGuardReports(guardId: string, limit: number = 50) {
    return await prisma.shiftReport.findMany({
      where: {
        guardId,
      },
      include: {
        shift: {
          include: {
            location: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get reports for a specific shift
   */
  async getShiftReports(shiftId: string, guardUserId: string) {
    const guard = await prisma.guard.findFirst({
      where: { userId: guardUserId },
      select: { id: true },
    });

    if (!guard) {
      throw new Error('Guard profile not found');
    }

    const shift = await prisma.shift.findFirst({
      where: { id: shiftId, guardId: guard.id },
    });

    if (!shift) {
      throw new Error('Unauthorized: This shift does not belong to you');
    }

    return await prisma.shiftReport.findMany({
      where: {
        shiftId,
      },
      include: {
        guard: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });
  }

  /**
   * Get reports by type for a guard
   */
  async getGuardReportsByType(guardId: string, reportType: ReportTypeEnum) {
    return await prisma.shiftReport.findMany({
      where: {
        guardId,
        reportType,
      },
      include: {
        shift: {
          include: {
            location: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });
  }

  /**
   * Update a shift report
   */
  async updateShiftReport(reportId: string, guardId: string, content: string) {
    // Verify report belongs to guard
    const report = await prisma.shiftReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    if (report.guardId !== guardId) {
      throw new Error('Unauthorized: This report does not belong to you');
    }

    return await prisma.shiftReport.update({
      where: { id: reportId },
      data: {
        content,
      },
      include: {
        shift: {
          include: {
            location: true,
          },
        },
      },
    });
  }

  /**
   * Get shift reports scoped to a security company (admin)
   */
  async getCompanyShiftReports(
    securityCompanyId: string,
    page: number = 1,
    limit: number = 50
  ) {
    const skip = (page - 1) * limit;

    const companyGuards = await prisma.companyGuard.findMany({
      where: { securityCompanyId, isActive: true },
      select: { guardId: true },
    });
    const guardIds = companyGuards.map(cg => cg.guardId);

    const guards = guardIds.length
      ? await prisma.guard.findMany({
          where: { id: { in: guardIds } },
          select: { userId: true },
        })
      : [];
    const guardUserIds = guards.map(g => g.userId);

    const where: any = {
      OR: [
        ...(guardUserIds.length ? [{ guardId: { in: guardUserIds } }] : []),
        {
          shift: {
            OR: [
              { client: { companyClients: { some: { securityCompanyId, isActive: true } } } },
              { site: { companySites: { some: { securityCompanyId, isActive: true } } } },
            ],
          },
        },
      ],
    };

    if (!where.OR.length) {
      return { reports: [], pagination: { page, limit, total: 0, pages: 0 } };
    }

    const [reports, total] = await Promise.all([
      prisma.shiftReport.findMany({
        where,
        include: {
          shift: {
            include: {
              site: { select: { name: true, address: true } },
              guard: {
                include: {
                  user: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                  },
                },
              },
            },
          },
          guard: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.shiftReport.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete a shift report
   */
  async deleteShiftReport(reportId: string, guardId: string) {
    // Verify report belongs to guard
    const report = await prisma.shiftReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    if (report.guardId !== guardId) {
      throw new Error('Unauthorized: This report does not belong to you');
    }

    return await prisma.shiftReport.delete({
      where: { id: reportId },
    });
  }
}

export default new ShiftReportService();
