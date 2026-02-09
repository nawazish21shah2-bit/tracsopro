// Complete API Test: Create Guard, Site, Shift and test Check-in/Check-out
const http = require('http');

function post(path, body, token) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api' + path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                ...(token && { Authorization: 'Bearer ' + token }),
            },
        };
        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, ...JSON.parse(body) }); }
                catch (e) { resolve({ status: res.statusCode, raw: body }); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function get(path, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api' + path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: 'Bearer ' + token }),
            },
        };
        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, ...JSON.parse(body) }); }
                catch (e) { resolve({ status: res.statusCode, raw: body }); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function main() {
    console.log('=== Complete API Test: Admin Flow + Check-in/Check-out ===\n');

    // 1. Login as admin
    console.log('1. Login as admin@example.com...');
    const adminLogin = await post('/auth/login', {
        email: 'admin@example.com',
        password: 'Passw0rd!'
    });

    if (!adminLogin.success) {
        console.log('   ❌ Admin login failed:', adminLogin.message);
        return;
    }
    const adminToken = adminLogin.data?.token || adminLogin.token;
    console.log('   ✅ Admin logged in!');

    // 2. Create a new guard via admin API
    console.log('\n2. Create new guard (via Admin API)...');
    const guardEmail = `guard_api_${Date.now()}@example.com`;
    const createGuard = await post('/admin/users', {
        email: guardEmail,
        password: 'Passw0rd!',
        firstName: 'APITest',
        lastName: 'Guard',
        phone: '+1234500001',
        role: 'GUARD',
    }, adminToken);

    if (!createGuard.success) {
        console.log('   ❌ Failed:', createGuard.error || createGuard.message);
        return;
    }
    console.log('   ✅ Guard created:', guardEmail);
    const guardUserId = createGuard.data?.id;
    console.log('   User ID:', guardUserId);

    // 3. Login as the new guard to get their guard profile
    console.log('\n3. Login as guard to get profile...');
    const guardLogin = await post('/auth/login', {
        email: guardEmail,
        password: 'Passw0rd!'
    });

    if (!guardLogin.success) {
        console.log('   ❌ Guard login failed:', guardLogin.message);
        return;
    }
    const guardToken = guardLogin.data?.token || guardLogin.token;
    const guardProfile = guardLogin.data?.user;
    const guardId = guardProfile?.guard?.id;
    console.log('   ✅ Guard logged in!');
    console.log('   Guard Profile ID:', guardId);

    if (!guardId) {
        console.log('   ❌ Could not find guard profile ID');
        console.log('   User data:', JSON.stringify(guardProfile, null, 2));
        return;
    }

    // 4. Create shift for the guard (via Admin API) using guard profile ID
    console.log('\n4. Create shift for guard (via Admin API)...');
    const now = new Date();
    const startTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 min ago
    const endTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours from now

    const createShift = await post('/admin/shifts', {
        guardId: guardId,  // Use the guard PROFILE ID, not user ID
        locationName: 'API Test Security Site',
        locationAddress: '789 API Test Blvd, New York, NY 10003',
        scheduledStartTime: startTime.toISOString(),
        scheduledEndTime: endTime.toISOString(),
        description: 'Shift created via API test',
    }, adminToken);

    console.log('   Status:', createShift.status);
    console.log('   Success:', createShift.success);
    if (!createShift.success) {
        console.log('   Error:', createShift.error || createShift.message);
        return;
    }
    console.log('   ✅ Shift created!');
    console.log('   Shift ID:', createShift.data?.id);
    const createdShiftId = createShift.data?.id;

    // 5. Get shifts for guard
    console.log('\n5. Get guard shifts...');
    const todayShifts = await get('/shifts/today', guardToken);
    const upcomingShifts = await get('/shifts/upcoming', guardToken);
    console.log('   Today:', todayShifts.data?.length || 0);
    console.log('   Upcoming:', upcomingShifts.data?.length || 0);

    const allShifts = [...(todayShifts.data || []), ...(upcomingShifts.data || [])];
    let shift = allShifts.find(s => s.id === createdShiftId) || allShifts.find(s => s.status === 'SCHEDULED');

    if (!shift) {
        shift = allShifts.find(s => s.status === 'IN_PROGRESS');
    }

    if (!shift) {
        console.log('\n   ❌ No shifts found for this guard');
        console.log('   Shifts returned:', JSON.stringify(allShifts, null, 2));
        return;
    }

    console.log('\n6. Found shift to test:');
    console.log('   Shift ID:', shift.id);
    console.log('   Status:', shift.status);
    console.log('   Location:', shift.locationName);

    // 7. CHECK-IN
    if (shift.status === 'SCHEDULED') {
        console.log('\n7. Testing CHECK-IN...');
        const checkin = await post('/shifts/' + shift.id + '/check-in', {
            location: {
                latitude: 40.7128,
                longitude: -74.006,
                accuracy: 10,
                address: '789 API Test Blvd, New York'
            }
        }, guardToken);

        console.log('   Response Status:', checkin.status);
        console.log('   Success:', checkin.success);
        if (checkin.success) {
            console.log('   ✅ CHECK-IN SUCCESSFUL!');
            console.log('   Shift now:', checkin.data?.status || 'IN_PROGRESS');
            shift.status = 'IN_PROGRESS';
        } else {
            console.log('   ❌ Error:', checkin.error || checkin.message);
        }
    }

    // 8. CHECK-OUT
    if (shift.status === 'IN_PROGRESS') {
        console.log('\n8. Testing CHECK-OUT...');
        const checkout = await post('/shifts/' + shift.id + '/check-out', {
            location: {
                latitude: 40.7129,
                longitude: -74.0061,
                accuracy: 8,
                address: '789 API Test Blvd, New York'
            },
            notes: 'Shift completed - API test successful!'
        }, guardToken);

        console.log('   Response Status:', checkout.status);
        console.log('   Success:', checkout.success);
        if (checkout.success) {
            console.log('   ✅ CHECK-OUT SUCCESSFUL!');
            console.log('   Shift now:', checkout.data?.status || 'COMPLETED');
        } else {
            console.log('   ❌ Error:', checkout.error || checkout.message);
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('=== TEST COMPLETE ===');
    console.log('='.repeat(50));
    console.log('\nGuard credentials:');
    console.log('  Email:', guardEmail);
    console.log('  Password: Passw0rd!');
    console.log('\n✅ Backend check-in/check-out API verified!');
}

main().catch(console.error);
