import { PrismaClient, ReportTypeEnum, ShiftReport } from '@prisma/client';

const prisma = new PrismaClient();

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
    // Verify shift exists and belongs to guard
    const shift = await prisma.shift.findUnique({
      where: { id: data.shiftId },
    });

    if (!shift) {
      throw new Error('Shift not found');
    }

    if (shift.guardId !== data.guardId) {
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
  async getShiftReports(shiftId: string) {
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
