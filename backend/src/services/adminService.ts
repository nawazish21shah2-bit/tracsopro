import prisma from '../config/database.js';
import { GuardStatus, ShiftStatus } from '@prisma/client';

export class AdminService {
  /**
   * Get admin dashboard statistics
   */
  async getDashboardStats(adminId: string, securityCompanyId?: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Multi-tenant: Build company filters
      const guardWhere = securityCompanyId ? {
        companyGuards: {
          some: {
            securityCompanyId,
            isActive: true,
          },
        },
      } : {};

      const siteWhere = securityCompanyId ? {
        companySites: {
          some: {
            securityCompanyId,
          },
        },
      } : {};

      const shiftWhere = securityCompanyId ? {
        guard: {
          companyGuards: {
            some: {
              securityCompanyId,
              isActive: true,
            },
          },
        },
      } : {};

      const [
        totalGuards,
        activeGuards,
        totalSites,
        activeSites,
        incidentsToday,
        pendingIncidents,
        emergencyAlerts,
        scheduledShifts,
      ] = await Promise.all([
        // Total guards - filtered by company
        prisma.guard.count({
          where: guardWhere,
        }),
        
        // Active guards (ON_DUTY or ACTIVE) - filtered by company
        prisma.guard.count({
          where: {
            ...guardWhere,
            status: { in: [GuardStatus.ON_DUTY, GuardStatus.ACTIVE] },
          },
        }),
        
        // Total sites - filtered by company
        prisma.site.count({
          where: siteWhere,
        }),
        
        // Active sites - filtered by company
        prisma.site.count({
          where: {
            ...siteWhere,
            isActive: true,
          },
        }),
        
      // Today's incidents - filtered by company
      (await Promise.all([
        prisma.shiftReport.count({
          where: {
            submittedAt: { gte: today },
            reportType: { in: ['INCIDENT', 'EMERGENCY'] },
            shift: shiftWhere,
          },
        }),
        prisma.incidentReport.count({
          where: {
            submittedAt: { gte: today },
            guard: guardWhere,
          },
        }),
      ])).reduce((a, b) => a + b, 0),
      
      // Pending incidents (not resolved) - filtered by company
      prisma.incidentReport.count({
        where: {
          status: 'SUBMITTED',
          reportType: { in: ['INCIDENT', 'MEDICAL_EMERGENCY', 'SECURITY_BREACH'] },
          guard: guardWhere,
        },
      }),
        
      // Emergency alerts - filtered by company
      (await Promise.all([
        prisma.shiftReport.count({
          where: {
            reportType: 'EMERGENCY',
            submittedAt: { gte: today },
            shift: shiftWhere,
          },
        }),
        prisma.incidentReport.count({
          where: {
            reportType: 'MEDICAL_EMERGENCY',
            status: 'SUBMITTED',
            guard: guardWhere,
          },
        }),
      ])).reduce((a, b) => a + b, 0),
        
        // Scheduled shifts (this week) - filtered by company
        prisma.shift.count({
          where: {
            ...shiftWhere,
            scheduledStartTime: {
              gte: today,
              lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
            },
            status: { in: [ShiftStatus.SCHEDULED, ShiftStatus.IN_PROGRESS] },
          },
        }),
      ]);

      // Calculate revenue from paid billing records
      const paidBilling = await prisma.billingRecord.aggregate({
        where: {
          securityCompanyId,
          status: 'PAID',
        },
        _sum: {
          amount: true,
        },
      });

      const revenue = paidBilling._sum.amount || 0;

      // Calculate client satisfaction (mock for now - can be enhanced with ratings/feedback system)
      const clientSatisfaction = 4.8; // TODO: Calculate from ratings/feedback when implemented

      return {
        totalGuards,
        activeGuards,
        totalSites,
        activeSites,
        todayIncidents: incidentsToday,
        pendingIncidents,
        emergencyAlerts,
        scheduledShifts,
        revenue,
        clientSatisfaction,
      };
    } catch (error: any) {
      console.error('Error in getDashboardStats:', error);
      throw error;
    }
  }

  /**
   * Get recent activity for admin dashboard
   */
  async getRecentActivity(limit: number = 10, securityCompanyId?: string) {
    const where = securityCompanyId ? {
      guard: {
        companyGuards: {
          some: {
            securityCompanyId,
            isActive: true,
          },
        },
      },
    } : {};

    const activities = await prisma.shift.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        guard: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        site: {
          select: { name: true },
        },
      },
    });

    return activities.map((activity) => {
      const guardName = activity.guard?.user
        ? `${activity.guard.user.firstName} ${activity.guard.user.lastName}`
        : 'Unknown Guard';
      const siteName = activity.site?.name || 'Unknown Site';

      let text = '';
      let icon = 'user';
      let iconColor = '#16A34A';

      if (activity.status === ShiftStatus.IN_PROGRESS && activity.actualStartTime) {
        text = `${guardName} checked in at ${siteName}`;
        icon = 'check-in';
        iconColor = '#16A34A';
      } else if (activity.status === ShiftStatus.COMPLETED && activity.actualEndTime) {
        text = `${guardName} completed shift at ${siteName}`;
        icon = 'check-out';
        iconColor = '#3B82F6';
      } else if (activity.status === ShiftStatus.SCHEDULED) {
        text = `${guardName} assigned to shift at ${siteName}`;
        icon = 'schedule';
        iconColor = '#EC4899';
      }

      return {
        id: activity.id,
        text,
        time: this.formatTimeAgo(activity.updatedAt),
        icon,
        iconColor,
      };
    });
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }
}

export default new AdminService();

