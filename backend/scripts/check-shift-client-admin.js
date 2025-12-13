// Script to check which client and admin will see reports/emergency alerts from a shift
import { PrismaClient } from '@prisma/client';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function checkShiftClientAdmin() {
  try {
    console.log('🔍 Checking which client and admin will see reports/emergency alerts...\n');

    // Find the active shift
    const shift = await prisma.shift.findFirst({
      where: { status: 'IN_PROGRESS' },
      include: {
        guard: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        site: {
          include: {
            client: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        client: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!shift) {
      console.log('❌ No active shift found. Please create a shift first.');
      return;
    }

    console.log('📊 SHIFT INFORMATION:');
    console.log(`   Shift ID: ${shift.id}`);
    console.log(`   Guard: ${shift.guard.user.firstName} ${shift.guard.user.lastName} (${shift.guard.user.email})`);
    console.log(`   Site: ${shift.site?.name || 'No site'}`);
    console.log(`   Status: ${shift.status}\n`);

    // Determine which client is associated
    const client = shift.client || shift.site?.client;
    
    if (client) {
      console.log('👤 CLIENT WHO WILL SEE REPORTS/ALERTS:');
      console.log(`   Name: ${client.user.firstName} ${client.user.lastName}`);
      console.log(`   Email: ${client.user.email}`);
      console.log(`   Client ID: ${client.id}\n`);
    } else {
      console.log('⚠️  WARNING: No client associated with this shift!\n');
    }

    // Find all admins
    console.log('👨‍💼 ADMINS WHO WILL SEE EMERGENCY ALERTS:');
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (admins.length > 0) {
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.firstName} ${admin.lastName} (${admin.email})`);
      });
    } else {
      console.log('   ⚠️  No admins found in the database!');
    }

    console.log('\n📋 SUMMARY:');
    console.log('   Emergency Alerts will be sent to:');
    console.log(`   - ALL ${admins.length} Admin(s)`);
    if (client) {
      console.log(`   - Client: ${client.user.email}`);
      console.log(`   - Emergency contacts for the guard (if any)`);
    }
    
    console.log('\n   Reports will be visible to:');
    if (client) {
      console.log(`   - Client: ${client.user.email} (via their Reports dashboard)`);
    } else {
      console.log('   - ⚠️  No client associated - reports may not be visible to any client!');
    }
    console.log(`   - Admins (can view all reports)`);

    console.log('\n💡 NOTE: Emergency alerts notify ALL admins, not just admins associated with the client.');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkShiftClientAdmin()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((e) => {
    console.error('\n❌ Check failed:', e);
    process.exit(1);
  });

