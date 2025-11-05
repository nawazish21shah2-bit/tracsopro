import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  shiftReminders: boolean;
  incidentAlerts: boolean;
}

export interface ProfileSettings {
  firstName: string;
  lastName: string;
  phone: string;
  timezone?: string;
}

export interface SupportTicket {
  subject: string;
  message: string;
  category: 'technical' | 'billing' | 'general' | 'urgent';
}

export class SettingsService {
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      // Check if user settings exist
      let userSettings = await prisma.userSettings.findUnique({
        where: { userId }
      });

      // Create default settings if they don't exist
      if (!userSettings) {
        userSettings = await prisma.userSettings.create({
          data: {
            userId,
            pushNotifications: true,
            emailNotifications: true,
            smsNotifications: false,
            shiftReminders: true,
            incidentAlerts: true
          }
        });
      }

      return {
        pushNotifications: userSettings.pushNotifications,
        emailNotifications: userSettings.emailNotifications,
        smsNotifications: userSettings.smsNotifications,
        shiftReminders: userSettings.shiftReminders,
        incidentAlerts: userSettings.incidentAlerts
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      throw new Error('Failed to get notification settings');
    }
  }

  async updateNotificationSettings(userId: string, settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const updatedSettings = await prisma.userSettings.upsert({
        where: { userId },
        update: settings,
        create: {
          userId,
          pushNotifications: settings.pushNotifications ?? true,
          emailNotifications: settings.emailNotifications ?? true,
          smsNotifications: settings.smsNotifications ?? false,
          shiftReminders: settings.shiftReminders ?? true,
          incidentAlerts: settings.incidentAlerts ?? true
        }
      });

      return {
        pushNotifications: updatedSettings.pushNotifications,
        emailNotifications: updatedSettings.emailNotifications,
        smsNotifications: updatedSettings.smsNotifications,
        shiftReminders: updatedSettings.shiftReminders,
        incidentAlerts: updatedSettings.incidentAlerts
      };
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw new Error('Failed to update notification settings');
    }
  }

  async getProfileSettings(userId: string): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          guard: {
            select: {
              experience: true,
              certificationUrls: true,
              status: true
            }
          },
          client: {
            select: {
              accountType: true,
              companyName: true,
              address: true,
              city: true,
              state: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      console.error('Error getting profile settings:', error);
      throw new Error('Failed to get profile settings');
    }
  }

  async updateProfileSettings(userId: string, profileData: Partial<ProfileSettings>): Promise<any> {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true
        }
      });

      return updatedUser;
    } catch (error) {
      console.error('Error updating profile settings:', error);
      throw new Error('Failed to update profile settings');
    }
  }

  async createSupportTicket(userId: string, ticketData: SupportTicket): Promise<any> {
    try {
      const ticket = await prisma.supportTicket.create({
        data: {
          userId,
          subject: ticketData.subject,
          message: ticketData.message,
          category: ticketData.category,
          status: 'OPEN'
        }
      });

      return ticket;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw new Error('Failed to create support ticket');
    }
  }

  async getAttendanceHistory(userId: string, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const skip = (page - 1) * limit;

      const shifts = await prisma.shift.findMany({
        where: {
          guardId: userId,
          status: 'COMPLETED'
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          checkInTime: true,
          checkOutTime: true,
          actualDuration: true,
          locationName: true,
          locationAddress: true
        },
        orderBy: {
          startTime: 'desc'
        },
        skip,
        take: limit
      });

      const total = await prisma.shift.count({
        where: {
          guardId: userId,
          status: 'COMPLETED'
        }
      });

      return {
        shifts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting attendance history:', error);
      throw new Error('Failed to get attendance history');
    }
  }

  async getPastJobs(userId: string, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const skip = (page - 1) * limit;

      const shifts = await prisma.shift.findMany({
        where: {
          guardId: userId,
          status: 'COMPLETED'
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          actualDuration: true,
          locationName: true,
          locationAddress: true
        },
        orderBy: {
          startTime: 'desc'
        },
        skip,
        take: limit
      });

      const total = await prisma.shift.count({
        where: {
          guardId: userId,
          status: 'COMPLETED'
        }
      });

      // Calculate earnings (would need hourlyRate from shift posting)
      const shiftsWithEarnings = shifts.map(shift => ({
        ...shift,
        earnings: 0 // TODO: Calculate from shift posting hourlyRate
      }));

      return {
        jobs: shiftsWithEarnings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting past jobs:', error);
      throw new Error('Failed to get past jobs');
    }
  }
}
