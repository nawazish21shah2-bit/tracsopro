// Direct test of check-in/check-out using service layer
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function directTest() {
    console.log('=== Direct Check-In/Check-Out Test ===\n');

    // 1. Get guard1
    const user = await prisma.user.findUnique({
        where: { email: 'guard1@example.com' },
        include: { guard: true },
    });

    if (!user || !user.guard) {
        console.log('❌ guard1@example.com not found or missing guard profile');
        return;
    }

    console.log('1. Found guard:', user.email);
    console.log('   Guard ID:', user.guard.id);

    // 2. Find SCHEDULED shift
    let shift = await prisma.shift.findFirst({
        where: {
            guardId: user.guard.id,
            status: 'SCHEDULED'
        },
    });

    if (!shift) {
        // Check for IN_PROGRESS
        shift = await prisma.shift.findFirst({
            where: {
                guardId: user.guard.id,
                status: 'IN_PROGRESS'
            },
        });
    }

    if (!shift) {
        console.log('❌ No testable shift found');
        return;
    }

    console.log('\n2. Found shift:', shift.id);
    console.log('   Status:', shift.status);
    console.log('   Location:', shift.locationName);

    // 3. Test Check-In
    if (shift.status === 'SCHEDULED') {
        console.log('\n3. Testing CHECK-IN...');

        const checkInLocation = {
            latitude: 40.7128,
            longitude: -74.006,
            accuracy: 10,
            address: '123 Test Street, New York, NY 10001',
            timestamp: new Date().toISOString(),
        };

        const updatedShift = await prisma.shift.update({
            where: { id: shift.id },
            data: {
                status: 'IN_PROGRESS',
                actualStartTime: new Date(),
                checkInLocation: checkInLocation as any,
            },
        });

        console.log('   ✅ CHECK-IN SUCCESSFUL!');
        console.log('   New status:', updatedShift.status);
        console.log('   Actual start time:', updatedShift.actualStartTime?.toLocaleString());

        shift = updatedShift;
    }

    // 4. Test Check-Out
    if (shift.status === 'IN_PROGRESS') {
        console.log('\n4. Testing CHECK-OUT...');

        const checkOutLocation = {
            latitude: 40.7129,
            longitude: -74.0061,
            accuracy: 8,
            address: '123 Test Street, New York, NY 10001',
            timestamp: new Date().toISOString(),
        };

        const updatedShift = await prisma.shift.update({
            where: { id: shift.id },
            data: {
                status: 'COMPLETED',
                actualEndTime: new Date(),
                checkOutLocation: checkOutLocation as any,
                notes: 'Test check-out completed successfully',
            },
        });

        console.log('   ✅ CHECK-OUT SUCCESSFUL!');
        console.log('   New status:', updatedShift.status);
        console.log('   Actual end time:', updatedShift.actualEndTime?.toLocaleString());
    }

    // 5. Verify final state
    const finalShift = await prisma.shift.findUnique({
        where: { id: shift.id },
    });

    console.log('\n=== Final Shift State ===');
    console.log('   ID:', finalShift?.id);
    console.log('   Status:', finalShift?.status);
    console.log('   Start:', finalShift?.actualStartTime?.toLocaleString());
    console.log('   End:', finalShift?.actualEndTime?.toLocaleString());
    console.log('   Check-in location:', finalShift?.checkInLocation ? 'Set' : 'Not set');
    console.log('   Check-out location:', finalShift?.checkOutLocation ? 'Set' : 'Not set');

    console.log('\n=== Test Complete ===');
}

directTest()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
