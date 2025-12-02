import prisma from '../config/database.js';
import { GuardStatus, ShiftStatus, ShiftAssignmentStatus } from '@prisma/client';

export class AdminService {
  /**
   * Get admin dashboard statistics
   */
  async getDashboardStats(adminId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

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
        // Total guards
        prisma.guard.count(),
        
        // Active guards (ON_DUTY or ACTIVE)
        prisma.guard.count({
          where: {
            status: { in: [GuardStatus.ON_DUTY, GuardStatus.ACTIVE] },
          },
        }),
        
        // Total sites - using Site model instead of Location
        prisma.site.count(),
        
        // Active sites
        prisma.site.count({
          where: { isActive: true },
        }),
        
      // Today's incidents - count from AssignmentReport
      prisma.assignmentReport.count({
        where: {
          submittedAt: { gte: today },
          type: { in: ['INCIDENT', 'MEDICAL_EMERGENCY', 'SECURITY_BREACH'] },
        },
      }),
      
      // Pending incidents (not resolved) - count from AssignmentReport with SUBMITTED status
      prisma.assignmentReport.count({
        where: {
          status: 'SUBMITTED',
          type: { in: ['INCIDENT', 'MEDICAL_EMERGENCY', 'SECURITY_BREACH'] },
        },
      }),
        
      // Emergency alerts - count from AssignmentReport with MEDICAL_EMERGENCY type and SUBMITTED status
      prisma.assignmentReport.count({
        where: {
          type: 'MEDICAL_EMERGENCY',
          status: 'SUBMITTED',
        },
      }),
        
        // Scheduled shifts (this week) - count ShiftAssignments instead
        prisma.shiftAssignment.count({
          where: {
            startTime: {
              gte: today,
              lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
            },
            status: { in: [ShiftAssignmentStatus.ASSIGNED, ShiftAssignmentStatus.IN_PROGRESS] },
          },
        }),
      ]);

      // Calculate revenue (mock for now - can be calculated from shift assignments)
      const revenue = 0; // TODO: Calculate from shift assignments and billing

      // Calculate client satisfaction (mock for now)
      const clientSatisfaction = 4.8; // TODO: Calculate from ratings/feedback

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
  async getRecentActivity(limit: number = 10) {
    const activities = await prisma.shiftAssignment.findMany({
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
        shiftPosting: {
          include: {
            site: {
              select: { name: true },
            },
          },
        },
      },
    });

    return activities.map((activity) => {
      const guardName = activity.guard?.user
        ? `${activity.guard.user.firstName} ${activity.guard.user.lastName}`
        : 'Unknown Guard';
      const siteName = activity.site?.name || activity.shiftPosting?.site?.name || 'Unknown Site';

      let text = '';
      let icon = 'user';
      let iconColor = '#16A34A';

      if (activity.status === ShiftAssignmentStatus.IN_PROGRESS && activity.checkInTime) {
        text = `${guardName} checked in at ${siteName}`;
        icon = 'check-in';
        iconColor = '#16A34A';
      } else if (activity.status === ShiftAssignmentStatus.COMPLETED && activity.checkOutTime) {
        text = `${guardName} completed shift at ${siteName}`;
        icon = 'check-out';
        iconColor = '#3B82F6';
      } else if (activity.status === ShiftAssignmentStatus.ASSIGNED) {
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

