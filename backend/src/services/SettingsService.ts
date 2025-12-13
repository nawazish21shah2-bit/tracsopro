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
  firstName?: string;
  lastName?: string;
  phone?: string;
  timezone?: string;
  language?: string;
}

export interface SupportTicket {
  subject: string;
  message: string;
  category: 'technical' | 'billing' | 'general' | 'urgent';
}

export class SettingsService {
  async getNotificationSettings(userId: string): Promise<NotificationSettings & { timezone?: string; language?: string }> {
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
            incidentAlerts: true,
            language: 'en'
          }
        });
      }

      return {
        pushNotifications: userSettings.pushNotifications,
        emailNotifications: userSettings.emailNotifications,
        smsNotifications: userSettings.smsNotifications,
        shiftReminders: userSettings.shiftReminders,
        incidentAlerts: userSettings.incidentAlerts,
        timezone: userSettings.timezone || undefined,
        language: userSettings.language || 'en'
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      throw new Error('Failed to get notification settings');
    }
  }

  async updateNotificationSettings(userId: string, settings: Partial<NotificationSettings & { timezone?: string; language?: string }>): Promise<NotificationSettings & { timezone?: string; language?: string }> {
    try {
      const updateData: any = {};
      
      // Update notification settings
      if (settings.pushNotifications !== undefined) updateData.pushNotifications = settings.pushNotifications;
      if (settings.emailNotifications !== undefined) updateData.emailNotifications = settings.emailNotifications;
      if (settings.smsNotifications !== undefined) updateData.smsNotifications = settings.smsNotifications;
      if (settings.shiftReminders !== undefined) updateData.shiftReminders = settings.shiftReminders;
      if (settings.incidentAlerts !== undefined) updateData.incidentAlerts = settings.incidentAlerts;
      
      // Update timezone and language if provided
      if (settings.timezone !== undefined) updateData.timezone = settings.timezone || null;
      if (settings.language !== undefined) updateData.language = settings.language || 'en';

      const updatedSettings = await prisma.userSettings.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          pushNotifications: settings.pushNotifications ?? true,
          emailNotifications: settings.emailNotifications ?? true,
          smsNotifications: settings.smsNotifications ?? false,
          shiftReminders: settings.shiftReminders ?? true,
          incidentAlerts: settings.incidentAlerts ?? true,
          timezone: settings.timezone || null,
          language: settings.language || 'en'
        }
      });

      return {
        pushNotifications: updatedSettings.pushNotifications,
        emailNotifications: updatedSettings.emailNotifications,
        smsNotifications: updatedSettings.smsNotifications,
        shiftReminders: updatedSettings.shiftReminders,
        incidentAlerts: updatedSettings.incidentAlerts,
        timezone: updatedSettings.timezone || undefined,
        language: updatedSettings.language || 'en'
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
          userSettings: {
            select: {
              timezone: true,
              language: true
            }
          },
          guard: {
            select: {
              experience: true,
              certificationUrls: true,
              status: true,
              employeeId: true,
              department: true
            }
          },
          client: {
            select: {
              id: true,
              accountType: true,
              companyName: true,
              companyRegistrationNumber: true,
              taxId: true,
              address: true,
              city: true,
              state: true,
              zipCode: true,
              country: true,
              website: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Merge user settings with user data
      return {
        ...user,
        timezone: user.userSettings?.timezone || null,
        language: user.userSettings?.language || 'en'
      };
    } catch (error) {
      console.error('Error getting profile settings:', error);
      throw new Error('Failed to get profile settings');
    }
  }

  async updateCompanyDetails(userId: string, companyData: {
    companyName?: string;
    companyRegistrationNumber?: string;
    taxId?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    website?: string;
  }): Promise<any> {
    try {
      // Get client record
      const client = await prisma.client.findUnique({
        where: { userId },
        select: { id: true }
      });

      if (!client) {
        throw new Error('Client record not found');
      }

      // Update client details
      const updateData: any = {};
      if (companyData.companyName !== undefined) updateData.companyName = companyData.companyName;
      if (companyData.companyRegistrationNumber !== undefined) updateData.companyRegistrationNumber = companyData.companyRegistrationNumber;
      if (companyData.taxId !== undefined) updateData.taxId = companyData.taxId;
      if (companyData.address !== undefined) updateData.address = companyData.address;
      if (companyData.city !== undefined) updateData.city = companyData.city;
      if (companyData.state !== undefined) updateData.state = companyData.state;
      if (companyData.zipCode !== undefined) updateData.zipCode = companyData.zipCode;
      if (companyData.country !== undefined) updateData.country = companyData.country;
      if (companyData.website !== undefined) updateData.website = companyData.website;

      const updatedClient = await prisma.client.update({
        where: { id: client.id },
        data: updateData,
        select: {
          id: true,
          companyName: true,
          companyRegistrationNumber: true,
          taxId: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          website: true
        }
      });

      return updatedClient;
    } catch (error) {
      console.error('Error updating company details:', error);
      throw new Error('Failed to update company details');
    }
  }

  async updateProfileSettings(userId: string, profileData: Partial<ProfileSettings>): Promise<any> {
    try {
      // Update user profile
      const updateData: any = {};
      if (profileData.firstName !== undefined) updateData.firstName = profileData.firstName;
      if (profileData.lastName !== undefined) updateData.lastName = profileData.lastName;
      if (profileData.phone !== undefined) updateData.phone = profileData.phone;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true
        }
      });

      // Update user settings (timezone and language)
      if (profileData.timezone !== undefined || profileData.language !== undefined) {
        const settingsUpdate: any = {};
        if (profileData.timezone !== undefined) settingsUpdate.timezone = profileData.timezone;
        if (profileData.language !== undefined) settingsUpdate.language = profileData.language;

        await prisma.userSettings.upsert({
          where: { userId },
          update: settingsUpdate,
          create: {
            userId,
            timezone: profileData.timezone || null,
            language: profileData.language || 'en',
            pushNotifications: true,
            emailNotifications: true,
            smsNotifications: false,
            shiftReminders: true,
            incidentAlerts: true
          }
        });
      }

      // Get updated settings for response
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
        select: {
          timezone: true,
          language: true
        }
      });

      return {
        ...updatedUser,
        timezone: userSettings?.timezone || null,
        language: userSettings?.language || 'en'
      };
    } catch (error) {
      console.error('Error updating profile settings:', error);
      throw new Error('Failed to update profile settings');
    }
  }

  async createSupportTicket(userId: string, ticketData: SupportTicket): Promise<any> {
    try {
      // Map lowercase category to enum
      const categoryMap: Record<string, 'TECHNICAL' | 'BILLING' | 'GENERAL' | 'URGENT'> = {
        'technical': 'TECHNICAL',
        'billing': 'BILLING',
        'general': 'GENERAL',
        'urgent': 'URGENT'
      };

      const category = categoryMap[ticketData.category.toLowerCase()] || 'GENERAL';

      // Validate required fields
      if (!ticketData.subject || !ticketData.message) {
        throw new Error('Subject and message are required');
      }

      const ticket = await prisma.supportTicket.create({
        data: {
          userId,
          subject: ticketData.subject.trim(),
          message: ticketData.message.trim(),
          category: category,
          status: 'OPEN',
          priority: category === 'URGENT' ? 'URGENT' : category === 'TECHNICAL' ? 'HIGH' : 'NORMAL'
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return ticket;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create support ticket');
    }
  }

  async getSupportTickets(userId: string, page: number = 1, limit: number = 20): Promise<{
    tickets: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const skip = (page - 1) * limit;

      const [tickets, total] = await Promise.all([
        prisma.supportTicket.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }),
        prisma.supportTicket.count({ where: { userId } })
      ]);

      return {
        tickets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting support tickets:', error);
      throw new Error('Failed to get support tickets');
    }
  }

  async getSupportTicketById(ticketId: string, userId: string): Promise<any> {
    try {
      const ticket = await prisma.supportTicket.findFirst({
        where: {
          id: ticketId,
          userId
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!ticket) {
        throw new Error('Support ticket not found');
      }

      return ticket;
    } catch (error) {
      console.error('Error getting support ticket:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get support ticket');
    }
  }

  async getAttendanceHistory(userId: string, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const skip = (page - 1) * limit;

      // First, get the guard record to find shifts
      const guard = await prisma.guard.findUnique({
        where: { userId },
        select: { id: true }
      });

      if (!guard) {
        return {
          shifts: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          }
        };
      }

      const shifts = await prisma.shift.findMany({
        where: {
          guardId: guard.id,
          status: 'COMPLETED'
        },
        select: {
          id: true,
          scheduledStartTime: true,
          scheduledEndTime: true,
          actualStartTime: true,
          actualEndTime: true,
          locationName: true,
          locationAddress: true,
          totalBreakTime: true
        },
        orderBy: {
          scheduledStartTime: 'desc'
        },
        skip,
        take: limit
      });

      const total = await prisma.shift.count({
        where: {
          guardId: guard.id,
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

      // First, get the guard record to find shifts
      const guard = await prisma.guard.findUnique({
        where: { userId },
        select: { id: true }
      });

      if (!guard) {
        return {
          jobs: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          }
        };
      }

      const shifts = await prisma.shift.findMany({
        where: {
          guardId: guard.id,
          status: 'COMPLETED'
        },
        select: {
          id: true,
          scheduledStartTime: true,
          scheduledEndTime: true,
          actualStartTime: true,
          actualEndTime: true,
          locationName: true,
          locationAddress: true,
          totalBreakTime: true
        },
        orderBy: {
          scheduledStartTime: 'desc'
        },
        skip,
        take: limit
      });

      const total = await prisma.shift.count({
        where: {
          guardId: guard.id,
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
