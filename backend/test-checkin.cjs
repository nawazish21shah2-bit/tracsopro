// Test script for check-in and check-out endpoints
const http = require('http');

const BASE_URL = 'http://localhost:3000/api';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function tryLogin(email, password) {
    console.log(`   Trying ${email} with password: ${password.substring(0, 3)}...`);
    const result = await makeRequest('POST', '/auth/login', { email, password });
    if (result.data.success) {
        console.log(`   ✅ Login successful for ${email}`);
    }
    return result;
}

async function runTests() {
    console.log('=== Testing Check-In/Check-Out API ===\n');

    // Step 1: Try different guard credentials
    console.log('1. Trying to login with guard credentials...');

    const credentials = [
        { email: 'guard@test.com', password: 'password' },
        { email: 'guard1@example.com', password: 'Passw0rd!' },
        { email: 'guard1@example.com', password: 'password' },
        { email: 'guard2@example.com', password: 'Passw0rd!' },
        { email: 'admin@example.com', password: 'Passw0rd!' },
    ];

    let loginResult = null;
    let loggedInEmail = null;

    for (const cred of credentials) {
        const result = await tryLogin(cred.email, cred.password);
        if (result.data.success) {
            loginResult = result;
            loggedInEmail = cred.email;
            break;
        }
    }

    if (!loginResult || !loginResult.data.success || !loginResult.data.token) {
        console.log('\n❌ Could not login with any guard credentials. Please run seed first.');
        return;
    }

    const token = loginResult.data.token;
    console.log(`\n   ✅ Logged in as: ${loggedInEmail}`);
    console.log('   Token:', token.substring(0, 30) + '...');

    // Step 2: Get upcoming/today shifts
    console.log('\n2. Getting today\'s shifts...');
    const todayShifts = await makeRequest('GET', '/shifts/today', null, token);
    console.log('   Status:', todayShifts.status);
    console.log('   Shift count:', todayShifts.data.data?.length || 0);
    if (todayShifts.data.data?.length > 0) {
        console.log('   Shifts:', JSON.stringify(todayShifts.data.data.map(s => ({
            id: s.id?.substring(0, 8),
            location: s.locationName,
            status: s.status,
            start: new Date(s.scheduledStartTime).toLocaleTimeString(),
        })), null, 2));
    }

    // Also check upcoming shifts
    console.log('\n3. Getting upcoming shifts...');
    const upcomingShifts = await makeRequest('GET', '/shifts/upcoming', null, token);
    console.log('   Status:', upcomingShifts.status);
    console.log('   Shift count:', upcomingShifts.data.data?.length || 0);
    if (upcomingShifts.data.data?.length > 0) {
        console.log('   Shifts:', JSON.stringify(upcomingShifts.data.data.map(s => ({
            id: s.id?.substring(0, 8),
            location: s.locationName,
            status: s.status,
            start: new Date(s.scheduledStartTime).toLocaleTimeString(),
        })), null, 2));
    }

    // Find a shift that can be checked into
    let shiftToTest = null;
    let allShifts = [...(todayShifts.data.data || []), ...(upcomingShifts.data.data || [])];

    // Find a SCHEDULED shift first
    shiftToTest = allShifts.find(s => s.status === 'SCHEDULED');

    // If no scheduled shift, find an IN_PROGRESS for check-out testing
    if (!shiftToTest) {
        shiftToTest = allShifts.find(s => s.status === 'IN_PROGRESS');
    }

    if (!shiftToTest) {
        console.log('\n❌ No shifts found to test.');
        console.log('\n   Creating a test shift now...');

        // Create a shift for testing
        const createResult = await makeRequest('POST', '/admin/shifts', {
            guardEmail: loggedInEmail,
            locationName: 'Test Location',
            locationAddress: '123 Test Street, New York, NY 10001',
            scheduledStartTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
            scheduledEndTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours from now
        }, token);

        console.log('   Create shift result:', createResult.status);

        if (!createResult.data.success) {
            console.log('\n   Could not create shift. You may need to:');
            console.log('   1. Run the test shift seeder: npx ts-node prisma/seed-test-checkin.ts');
            console.log('   2. Or use admin panel to create a shift for this guard');
            return;
        }

        shiftToTest = createResult.data.data;
    }

    console.log('\n4. Found shift to test:');
    console.log('   Shift ID:', shiftToTest.id);
    console.log('   Location:', shiftToTest.locationName);
    console.log('   Status:', shiftToTest.status);
    console.log('   Start:', new Date(shiftToTest.scheduledStartTime).toLocaleString());

    // Step 4: Test Check-In
    if (shiftToTest.status === 'SCHEDULED') {
        console.log('\n5. Testing CHECK-IN...');
        const checkInResult = await makeRequest(
            'POST',
            `/shifts/${shiftToTest.id}/check-in`,
            {
                location: {
                    latitude: 40.7128,
                    longitude: -74.006,
                    accuracy: 10,
                    address: '123 Test Street, New York, NY 10001',
                },
            },
            token
        );
        console.log('   Status:', checkInResult.status);
        console.log('   Response:', JSON.stringify(checkInResult.data, null, 2));

        if (checkInResult.data.success) {
            console.log('\n   ✅ CHECK-IN SUCCESSFUL!');
            console.log('   Shift is now: IN_PROGRESS');
            shiftToTest.status = 'IN_PROGRESS'; // Update for check-out test
        } else {
            console.log('\n   ❌ Check-in failed!');
            console.log('   Error:', checkInResult.data.error || checkInResult.data.message);
        }
    }

    // Step 5: Test Check-Out
    if (shiftToTest.status === 'IN_PROGRESS') {
        console.log('\n6. Testing CHECK-OUT...');
        const checkOutResult = await makeRequest(
            'POST',
            `/shifts/${shiftToTest.id}/check-out`,
            {
                location: {
                    latitude: 40.7129,
                    longitude: -74.0061,
                    accuracy: 8,
                    address: '123 Test Street, New York, NY 10001',
                },
                notes: 'Shift completed successfully - test check-out',
            },
            token
        );
        console.log('   Status:', checkOutResult.status);
        console.log('   Response:', JSON.stringify(checkOutResult.data, null, 2));

        if (checkOutResult.data.success) {
            console.log('\n   ✅ CHECK-OUT SUCCESSFUL!');
            console.log('   Shift is now: COMPLETED');
        } else {
            console.log('\n   ❌ Check-out failed!');
            console.log('   Error:', checkOutResult.data.error || checkOutResult.data.message);
        }
    }

    console.log('\n=== Test Complete ===');
}

runTests().catch(console.error);
