// Incident Report Service
import prisma from '../config/database.js';

interface CreateIncidentReportData {
  guardId: string;
  reportType: string;
  description: string;
  location?: {
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  mediaFiles?: {
    url: string;
    type: 'image' | 'video';
    name?: string;
  }[];
}

interface IncidentReportFilters {
  guardId?: string;
  reportType?: string;
  startDate?: string;
  endDate?: string;
}

interface StatsFilters {
  startDate?: string;
  endDate?: string;
  guardId?: string;
}

class IncidentReportService {
  async createIncidentReport(data: CreateIncidentReportData) {
    const { guardId, reportType, description, location, mediaFiles } = data;

    // Verify guard exists
    const guard = await prisma.guard.findUnique({
      where: { userId: guardId },
      include: { user: true }
    });

    if (!guard) {
      throw new Error('Guard not found');
    }

    // Create the incident report
    const report = await prisma.$transaction(async (tx) => {
      // Create the main report
      const newReport = await tx.incidentReport.create({
        data: {
          guardId: guard.id,
          reportType,
          description,
          locationName: location?.name,
          locationAddress: location?.address,
          locationLatitude: location?.latitude,
          locationLongitude: location?.longitude,
          status: 'SUBMITTED',
          submittedAt: new Date(),
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
                }
              }
            }
          }
        }
      });

      // Add media files if provided
      if (mediaFiles && mediaFiles.length > 0) {
        await tx.incidentReportMedia.createMany({
          data: mediaFiles.map(file => ({
            incidentReportId: newReport.id,
            url: file.url,
            type: file.type,
            name: file.name,
          }))
        });
      }

      return newReport;
    });

    return this.formatIncidentReport(report);
  }

  async getIncidentReports(filters: IncidentReportFilters, page: number = 1, limit: number = 10, securityCompanyId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.guardId) {
      const guard = await prisma.guard.findUnique({
        where: { userId: filters.guardId }
      });
      if (guard) {
        where.guardId = guard.id;
      }
    }

    // Multi-tenant: Filter by company if provided
    if (securityCompanyId) {
      // Get all guard IDs in the company
      const [companyGuards] = await Promise.all([
        prisma.companyGuard.findMany({
          where: { securityCompanyId, isActive: true },
          select: { guardId: true },
        }),
      ]);

      const companyGuardIds = companyGuards.map(cg => cg.guardId);

      // Filter to only include reports from guards in the company
      if (where.guardId) {
        // If specific guardId is provided, validate it belongs to company
        if (!companyGuardIds.includes(where.guardId)) {
          // Return empty result if guard doesn't belong to company
          return {
            reports: [],
            pagination: { page, limit, total: 0, pages: 0 },
          };
        }
      } else {
        // Filter by company guards
        where.guardId = { in: companyGuardIds };
      }
    }

    if (filters.reportType) {
      where.reportType = filters.reportType;
    }

    if (filters.startDate || filters.endDate) {
      where.submittedAt = {};
      if (filters.startDate) {
        where.submittedAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.submittedAt.lte = new Date(filters.endDate);
      }
    }

    const [reports, total] = await Promise.all([
      prisma.incidentReport.findMany({
        where,
        include: {
          guard: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                }
              }
            }
          },
          media: true,
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.incidentReport.count({ where })
    ]);

    return {
      reports: reports.map(report => this.formatIncidentReport(report)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getIncidentReportById(id: string, guardId?: string) {
    const where: any = { id };

    if (guardId) {
      const guard = await prisma.guard.findUnique({
        where: { userId: guardId }
      });
      if (guard) {
        where.guardId = guard.id;
      }
    }

    const report = await prisma.incidentReport.findFirst({
      where,
      include: {
        guard: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        media: true,
      }
    });

    return report ? this.formatIncidentReport(report) : null;
  }

  async updateIncidentReport(id: string, guardId: string, updateData: any) {
    const guard = await prisma.guard.findUnique({
      where: { userId: guardId }
    });

    if (!guard) {
      throw new Error('Guard not found');
    }

    const report = await prisma.incidentReport.findFirst({
      where: { id, guardId: guard.id }
    });

    if (!report) {
      return null;
    }

    const updatedReport = await prisma.incidentReport.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
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
              }
            }
          }
        },
        media: true,
      }
    });

    return this.formatIncidentReport(updatedReport);
  }

  async deleteIncidentReport(id: string, guardId: string) {
    const guard = await prisma.guard.findUnique({
      where: { userId: guardId }
    });

    if (!guard) {
      throw new Error('Guard not found');
    }

    const report = await prisma.incidentReport.findFirst({
      where: { id, guardId: guard.id }
    });

    if (!report) {
      throw new Error('Incident report not found');
    }

    await prisma.$transaction(async (tx) => {
      // Delete media files first
      await tx.incidentReportMedia.deleteMany({
        where: { incidentReportId: id }
      });

      // Delete the report
      await tx.incidentReport.delete({
        where: { id }
      });
    });

    return true;
  }

  async getAllIncidentReports(filters: IncidentReportFilters, page: number = 1, limit: number = 10, securityCompanyId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.guardId) {
      const guard = await prisma.guard.findUnique({
        where: { userId: filters.guardId }
      });
      if (guard) {
        where.guardId = guard.id;
      }
    }

    // Multi-tenant: Filter by company if provided
    if (securityCompanyId) {
      // Get all guard IDs in the company
      const companyGuards = await prisma.companyGuard.findMany({
        where: { securityCompanyId, isActive: true },
        select: { guardId: true },
      });

      const companyGuardIds = companyGuards.map(cg => cg.guardId);

      // Filter to only include reports from guards in the company
      if (where.guardId) {
        // If specific guardId is provided, validate it belongs to company
        if (!companyGuardIds.includes(where.guardId)) {
          // Return empty result if guard doesn't belong to company
          return {
            reports: [],
            pagination: { page, limit, total: 0, pages: 0 },
          };
        }
      } else {
        // Filter by company guards
        where.guardId = { in: companyGuardIds };
      }
    }

    if (filters.reportType) {
      where.reportType = filters.reportType;
    }

    if (filters.startDate || filters.endDate) {
      where.submittedAt = {};
      if (filters.startDate) {
        where.submittedAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.submittedAt.lte = new Date(filters.endDate);
      }
    }

    const [reports, total] = await Promise.all([
      prisma.incidentReport.findMany({
        where,
        include: {
          guard: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                }
              }
            }
          },
          media: true,
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.incidentReport.count({ where })
    ]);

    return {
      reports: reports.map(report => this.formatIncidentReport(report)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getIncidentReportStats(filters: StatsFilters, securityCompanyId?: string) {
    const where: any = {};

    if (filters.guardId) {
      const guard = await prisma.guard.findUnique({
        where: { userId: filters.guardId }
      });
      if (guard) {
        where.guardId = guard.id;
      }
    }

    // Multi-tenant: Filter by company if provided
    if (securityCompanyId) {
      // Get all guard IDs in the company
      const companyGuards = await prisma.companyGuard.findMany({
        where: { securityCompanyId, isActive: true },
        select: { guardId: true },
      });

      const companyGuardIds = companyGuards.map(cg => cg.guardId).filter(Boolean);

      // If no guards in company, return empty stats
      if (companyGuardIds.length === 0) {
        return {
          totalReports: 0,
          reportsByType: {},
          reportsByStatus: {},
          recentReports: [],
        };
      }

      // Filter to only include reports from guards in the company
      if (where.guardId) {
        // If specific guardId is provided, validate it belongs to company
        if (!companyGuardIds.includes(where.guardId)) {
          // Return empty stats if guard doesn't belong to company
          return {
            totalReports: 0,
            reportsByType: {},
            reportsByStatus: {},
            recentReports: [],
          };
        }
      } else {
        // Filter by company guards
        where.guardId = { in: companyGuardIds };
      }
    }

    if (filters.startDate || filters.endDate) {
      where.submittedAt = {};
      if (filters.startDate) {
        where.submittedAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.submittedAt.lte = new Date(filters.endDate);
      }
    }

    const [
      totalReports,
      reportsByType,
      reportsByStatus,
      recentReports
    ] = await Promise.all([
      prisma.incidentReport.count({ where }),
      prisma.incidentReport.groupBy({
        by: ['reportType'],
        where,
        _count: { id: true }
      }),
      prisma.incidentReport.groupBy({
        by: ['status'],
        where,
        _count: { id: true }
      }),
      prisma.incidentReport.findMany({
        where,
        include: {
          guard: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        take: 5
      })
    ]);

    return {
      totalReports,
      reportsByType: reportsByType.map(item => ({
        type: item.reportType,
        count: item._count.id
      })),
      reportsByStatus: reportsByStatus.map(item => ({
        status: item.status,
        count: item._count.id
      })),
      recentReports: recentReports.map(report => this.formatIncidentReport(report))
    };
  }

  private formatIncidentReport(report: any) {
    return {
      id: report.id,
      reportType: report.reportType,
      description: report.description,
      status: report.status,
      location: {
        name: report.locationName,
        address: report.locationAddress,
        latitude: report.locationLatitude,
        longitude: report.locationLongitude,
      },
      guard: {
        id: report.guard.id,
        name: `${report.guard.user.firstName} ${report.guard.user.lastName}`,
        email: report.guard.user.email,
      },
      mediaFiles: report.media?.map((media: any) => ({
        id: media.id,
        url: media.url,
        type: media.type,
        name: media.name,
      })) || [],
      submittedAt: report.submittedAt,
      updatedAt: report.updatedAt,
      createdAt: report.createdAt,
    };
  }
}

export default new IncidentReportService();
