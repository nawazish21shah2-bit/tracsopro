// Incident Report Service
import { IncidentReportStatus } from '@prisma/client';
import prisma from '../config/database.js';
import notificationService from './notificationService.js';
import { logger } from '../utils/logger.js';

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
          status: IncidentReportStatus.SUBMITTED,
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

    try {
      const guardCompany = await prisma.companyGuard.findFirst({
        where: { guardId: guard.id, isActive: true },
        select: { securityCompanyId: true },
      });

      if (guardCompany) {
        const companyAdmins = await prisma.companyUser.findMany({
          where: { securityCompanyId: guardCompany.securityCompanyId, isActive: true },
          select: { userId: true },
        });
        const adminUserIds = companyAdmins.map((cu) => cu.userId).filter(Boolean);
        const guardName = `${guard.user.firstName} ${guard.user.lastName}`;
        const locationLabel = location?.name ? ` at ${location.name}` : '';

        if (adminUserIds.length > 0) {
          await notificationService.createBulkNotifications(
            adminUserIds,
            {
              type: 'INCIDENT_ALERT',
              title: 'New Incident Report',
              message: `${guardName} submitted a ${reportType} report${locationLabel}.`,
              data: { incidentId: report.id, reportId: report.id },
              sendPush: true,
              priority: 'high',
            },
            guardCompany.securityCompanyId,
            guard.user.id
          );
        }
      }
    } catch (err) {
      logger.error('Failed to notify admins of new incident report:', err);
    }

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

  async respondToReport(reportId: string, userId: string, userRole: string, status: string, responseNotes?: string) {
    try {
      // Find the report with simplified includes to avoid Prisma validation errors
      // CompanyClient has 'client' and 'securityCompany' relations, not 'user'
      const report = await prisma.incidentReport.findUnique({
        where: { id: reportId },
        include: {
          guard: {
            include: {
              user: true,
              companyGuards: {
                include: {
                  securityCompany: true
                }
              }
            }
          }
        }
      });

      if (!report) {
        throw new Error('Report not found');
      }

      // Verify access based on role
      if (userRole === 'CLIENT') {
        // Client can only respond to reports from guards assigned to their sites
        const client = await prisma.client.findUnique({
          where: { userId },
          include: {
            sites: {
              include: {
                shifts: {
                  where: {
                    guardId: report.guardId
                  }
                }
              }
            }
          }
        });

        if (!client) {
          throw new Error('Client not found');
        }

        // Check if guard has any shifts for this client's sites
        const hasAccess = client.sites.some(site => site.shifts.length > 0);
        if (!hasAccess) {
          throw new Error('Access denied: This report does not belong to your sites');
        }
      } else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        // Admin can respond to reports from guards in their company
        if (userRole !== 'SUPER_ADMIN') {
          const admin = await prisma.companyUser.findFirst({
            where: { userId },
            include: {
              securityCompany: {
                include: {
                  guards: {
                    where: {
                      guardId: report.guardId,
                      isActive: true
                    }
                  }
                }
              }
            }
          });

          if (!admin || admin.securityCompany.guards.length === 0) {
            throw new Error('Access denied: This report does not belong to your company');
          }
        }
      } else {
        throw new Error('Unauthorized: Only clients and admins can respond to reports');
      }

      // Update report status and add response to description
      const responseText = responseNotes
        ? `\n\n[Response by ${userRole} - ${status}]: ${responseNotes}`
        : `\n\n[Response by ${userRole} - ${status}]`;

      const newStatus =
        status === 'REVIEWED'
          ? IncidentReportStatus.REVIEWED
          : status === 'RESOLVED'
            ? IncidentReportStatus.RESOLVED
            : report.status;
      
      const historyEntry = {
        status: newStatus,
        changedBy: userRole,
        notes: responseNotes || '',
        timestamp: new Date().toISOString()
      };

      // @ts-expect-error Prisma Json field typing for statusHistory
      const currentHistory = report.statusHistory ? (report.statusHistory as any[]) : [];
      const newHistory = [...currentHistory, historyEntry];

      const updatedReport = await prisma.incidentReport.update({
        where: { id: reportId },
        data: {
          status: newStatus,
          description: report.description + responseText,
          statusHistory: newHistory,
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

      // Send notification to the guard (not the admin/client who responded)
      try {
        await notificationService.createNotification({
          userId: report.guard.user.id,
          type: 'INCIDENT_ALERT',
          title: `Report ${newStatus}`,
          message: `Your incident report has been ${newStatus.toLowerCase()} by ${userRole}. ${responseNotes ? `Notes: ${responseNotes}` : ''}`,
          data: { reportId: updatedReport.id },
          sendPush: true,
        }, undefined, userId);
      } catch (err) {
        logger.error('Failed to send notification to guard:', err);
      }

      return this.formatIncidentReport(updatedReport);
    } catch (error) {
      logger.error('Error responding to report:', error);
      throw error;
    }
  }

  private formatIncidentReport(report: any) {
    // Extract response from description if present
    const responseMatch = report.description?.match(/\[Response by (.+?) - (.+?)\]:?\s*(.+?)$/s);
    const responseNotes = responseMatch ? responseMatch[3]?.trim() : null;
    const description = responseMatch ? report.description.substring(0, responseMatch.index) : report.description;

    return {
      id: report.id,
      reportType: report.reportType,
      description: description || report.description,
      status: report.status,
      responseNotes: responseNotes || null,
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
      statusHistory: Array.isArray(report.statusHistory) ? report.statusHistory : (report.statusHistory ? report.statusHistory : []),
    };
  }
}

export default new IncidentReportService();
