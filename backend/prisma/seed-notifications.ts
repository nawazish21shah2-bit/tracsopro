import { PrismaClient, NotificationType } from '@prisma/client';
import { subDays, subHours, subMinutes, addDays } from 'date-fns';

const prisma = new PrismaClient();

async function seedNotifications() {
  console.log('🌱 Starting notification seeding...\n');

  try {
    // Get all users by role
    const guards = await prisma.user.findMany({
      where: { role: 'GUARD', isActive: true },
      include: { guard: true },
    });

    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT', isActive: true },
      include: { client: true },
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      include: { companyUsers: { where: { isActive: true }, take: 1 } },
    });

    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN', isActive: true },
    });

    console.log(`Found ${guards.length} guards, ${clients.length} clients, ${admins.length} admins, ${superAdmins.length} super admins\n`);

    // Get some sites and shifts for context
    const sites = await prisma.site.findMany({ take: 5 });
    const shifts = await prisma.shift.findMany({ 
      take: 10,
      include: { 
        guard: { include: { user: true } },
        site: true,
      },
    });

    const notifications: any[] = [];
    const now = new Date();

    // ===== NOTIFICATIONS FOR GUARDS =====
    console.log('Creating notifications for guards...');
    for (const guard of guards) {
      const guardProfile = guard.guard;
      if (!guardProfile) continue;

      // Get guard's shifts
      const guardShifts = shifts.filter(s => s.guardId === guardProfile.id);
      const guardSite = guardShifts.length > 0 ? guardShifts[0].site : sites[0];

      // Shift reminder (upcoming shift)
      if (guardShifts.length > 0) {
        const upcomingShift = guardShifts.find(s => new Date(s.scheduledStartTime) > now);
        if (upcomingShift) {
          const shiftTime = new Date(upcomingShift.scheduledStartTime);
          const reminderTime = subHours(shiftTime, 1);
          
          notifications.push({
            userId: guard.id,
            type: NotificationType.SHIFT_REMINDER,
            title: 'Shift Reminder',
            message: `Your shift starts in 1 hour at ${guardSite?.name || 'your assigned location'}`,
            data: JSON.stringify({
              shiftId: upcomingShift.id,
              siteId: guardSite?.id,
              siteName: guardSite?.name,
              startTime: upcomingShift.scheduledStartTime,
            }),
            isRead: false,
            createdAt: reminderTime > now ? now : reminderTime,
          });
        }
      }

      // System notification (welcome)
      notifications.push({
        userId: guard.id,
        type: NotificationType.SYSTEM,
        title: 'Welcome to Guard Tracking',
        message: `Welcome ${guard.firstName}! Your account is active and ready to use.`,
        data: JSON.stringify({
          type: 'welcome',
        }),
        isRead: false,
        createdAt: subDays(now, 7),
      });

      // Message notification (if there are other users)
      if (guards.length > 1 || admins.length > 0) {
        const otherUser = admins[0] || guards.find(g => g.id !== guard.id);
        if (otherUser) {
          notifications.push({
            userId: guard.id,
            type: NotificationType.MESSAGE,
            title: 'New Message',
            message: `You have a new message from ${otherUser.firstName} ${otherUser.lastName}`,
            data: JSON.stringify({
              conversationId: `chat_${otherUser.id}_${guard.id}`,
              senderId: otherUser.id,
            }),
            isRead: false,
            createdAt: subHours(now, 2),
          });
        }
      }
    }

    // ===== NOTIFICATIONS FOR CLIENTS =====
    console.log('Creating notifications for clients...');
    for (const client of clients) {
      const clientProfile = client.client;
      if (!clientProfile) continue;

      // Get client's sites
      const clientSites = sites.filter(s => s.clientId === clientProfile.id);
      const clientSite = clientSites[0] || sites[0];

      // Guard check-in notification
      if (guards.length > 0 && clientSite) {
        const guard = guards[0];
        const guardProfile = guard.guard;
        if (guardProfile) {
          const checkInTime = subHours(now, 3);
          notifications.push({
            userId: client.id,
            type: NotificationType.SYSTEM,
            title: 'Guard Checked In',
            message: `${guard.firstName} ${guard.lastName} checked in at ${clientSite.name} at ${checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
            data: JSON.stringify({
              guardId: guardProfile.id,
              guardName: `${guard.firstName} ${guard.lastName}`,
              siteId: clientSite.id,
              siteName: clientSite.name,
              checkInTime: checkInTime.toISOString(),
            }),
            isRead: false,
            createdAt: checkInTime,
          });
        }
      }

      // Incident alert
      if (guards.length > 0 && clientSite) {
        const guard = guards[0];
        const guardProfile = guard.guard;
        if (guardProfile) {
          notifications.push({
            userId: client.id,
            type: NotificationType.INCIDENT_ALERT,
            title: 'Incident Report Submitted',
            message: `${guard.firstName} ${guard.lastName} sent an incident report from ${clientSite.name}`,
            data: JSON.stringify({
              guardId: guardProfile.id,
              guardName: `${guard.firstName} ${guard.lastName}`,
              siteId: clientSite.id,
              siteName: clientSite.name,
              type: 'incident_report',
            }),
            isRead: false,
            createdAt: subHours(now, 1),
          });
        }
      }

      // System notification
      notifications.push({
        userId: client.id,
        type: NotificationType.SYSTEM,
        title: 'Account Activated',
        message: `Welcome ${client.firstName}! Your client account is now active.`,
        data: JSON.stringify({
          type: 'account_activated',
        }),
        isRead: true,
        createdAt: subDays(now, 5),
      });
    }

    // ===== NOTIFICATIONS FOR ADMINS =====
    console.log('Creating notifications for admins...');
    for (const admin of admins) {
      // Get admin's company
      const companyUser = admin.companyUsers[0];
      if (!companyUser) continue;

      // Get guards in admin's company
      const companyGuards = await prisma.companyGuard.findMany({
        where: { 
          securityCompanyId: companyUser.securityCompanyId,
          isActive: true,
        },
        include: { guard: { include: { user: true } } },
        take: 3,
      });

      // Guard check-in notifications
      for (const companyGuard of companyGuards) {
        const guard = companyGuard.guard;
        const guardUser = guard.user;
        const guardSite = sites[0];

        if (guardSite) {
          // Create check-in notification matching design
          const checkInTime = new Date();
          checkInTime.setHours(8, 12, 0, 0); // 08:12 am
          if (checkInTime > now) {
            checkInTime.setDate(checkInTime.getDate() - 1);
          }
          
          const timeStr = checkInTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
          }).toLowerCase();
          
          notifications.push({
            userId: admin.id,
            type: NotificationType.SYSTEM,
            title: 'Guard Checked In',
            message: `${guardUser.firstName} ${guardUser.lastName} checked in at ${timeStr}`,
            data: JSON.stringify({
              guardId: guard.id,
              guardName: `${guardUser.firstName} ${guardUser.lastName}`,
              siteId: guardSite.id,
              siteName: guardSite.name || 'Site Alpha',
              checkInTime: checkInTime.toISOString(),
            }),
            isRead: false,
            createdAt: checkInTime,
          });
        }

        // Incident alert (matching design)
        if (guardSite) {
          notifications.push({
            userId: admin.id,
            type: NotificationType.INCIDENT_ALERT,
            title: 'Incident Report',
            message: `${guardUser.firstName} ${guardUser.lastName} sent an incident report`,
            data: JSON.stringify({
              guardId: guard.id,
              guardName: `${guardUser.firstName} ${guardUser.lastName}`,
              siteId: guardSite.id,
              siteName: guardSite.name || 'Site Alpha',
              type: 'incident_report',
            }),
            isRead: false,
            createdAt: subHours(now, 2),
          });
        }
      }

      // Emergency alert
      if (companyGuards.length > 0) {
        const guard = companyGuards[0].guard;
        const guardUser = guard.user;
        const guardSite = sites[0];

        if (guardSite) {
          notifications.push({
            userId: admin.id,
            type: NotificationType.EMERGENCY,
            title: '🚨 EMERGENCY ALERT: SECURITY',
            message: `${guardUser.firstName} ${guardUser.lastName} has triggered a high security alert at ${guardSite.name}. Location: GPS coordinates provided`,
            data: JSON.stringify({
              alertId: `alert_${Date.now()}`,
              guardId: guard.id,
              guardName: `${guardUser.firstName} ${guardUser.lastName}`,
              siteId: guardSite.id,
              siteName: guardSite.name,
              type: 'SECURITY',
              severity: 'HIGH',
            }),
            isRead: false,
            createdAt: subMinutes(now, 30),
          });
        }
      }

      // System notification
      notifications.push({
        userId: admin.id,
        type: NotificationType.SYSTEM,
        title: 'Dashboard Updated',
        message: 'Your dashboard has been updated with the latest statistics.',
        data: JSON.stringify({
          type: 'dashboard_update',
        }),
        isRead: true,
        createdAt: subDays(now, 1),
      });
    }

    // ===== NOTIFICATIONS FOR SUPER ADMINS =====
    console.log('Creating notifications for super admins...');
    for (const superAdmin of superAdmins) {
      // Platform-level notifications
      notifications.push({
        userId: superAdmin.id,
        type: NotificationType.SYSTEM,
        title: 'Platform Activity',
        message: `New company registered: ${admins.length > 0 ? 'Security Company' : 'Test Company'}`,
        data: JSON.stringify({
          type: 'company_registered',
        }),
        isRead: false,
        createdAt: subDays(now, 2),
      });

      notifications.push({
        userId: superAdmin.id,
        type: NotificationType.SYSTEM,
        title: 'System Status',
        message: 'All systems operational. Platform running smoothly.',
        data: JSON.stringify({
          type: 'system_status',
        }),
        isRead: true,
        createdAt: subDays(now, 1),
      });

      // Emergency alert (platform-wide)
      if (guards.length > 0) {
        const guard = guards[0];
        const guardProfile = guard.guard;
        if (guardProfile) {
          notifications.push({
            userId: superAdmin.id,
            type: NotificationType.EMERGENCY,
            title: '🚨 EMERGENCY ALERT: CRITICAL',
            message: `${guard.firstName} ${guard.lastName} has triggered a critical emergency alert. Immediate attention required.`,
            data: JSON.stringify({
              alertId: `alert_${Date.now()}`,
              guardId: guardProfile.id,
              guardName: `${guard.firstName} ${guard.lastName}`,
              type: 'PANIC',
              severity: 'CRITICAL',
            }),
            isRead: false,
            createdAt: subHours(now, 1),
          });
        }
      }
    }

    // Create all notifications
    console.log(`\nCreating ${notifications.length} notifications...`);
    const created = await prisma.notification.createMany({
      data: notifications,
      skipDuplicates: true,
    });

    console.log(`✅ Created ${created.count} notifications\n`);

    // Summary
    console.log('📊 Notification Summary:');
    console.log(`   - Guards: ${guards.length} users`);
    console.log(`   - Clients: ${clients.length} users`);
    console.log(`   - Admins: ${admins.length} users`);
    console.log(`   - Super Admins: ${superAdmins.length} users`);
    console.log(`   - Total Notifications: ${created.count}\n`);

    console.log('✅ Notification seeding completed!');

  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
seedNotifications()
  .then(() => {
    console.log('✅ Seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });

export default seedNotifications;

