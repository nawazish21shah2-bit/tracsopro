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

async function runTests() {
    console.log('=== Testing Check-In/Check-Out API ===\n');

    // Step 1: Login as guard
    console.log('1. Logging in as guard1@example.com...');
    const loginResult = await makeRequest('POST', '/auth/login', {
        email: 'guard1@example.com',
        password: 'password',
    });

    console.log('   Status:', loginResult.status);
    console.log('   Response:', JSON.stringify(loginResult.data, null, 2));

    if (!loginResult.data.success) {
        console.log('\n   ❌ Login failed! Trying with password123...');
        const loginResult2 = await makeRequest('POST', '/auth/login', {
            email: 'guard1@example.com',
            password: 'password123',
        });
        console.log('   Status:', loginResult2.status);
        console.log('   Response:', JSON.stringify(loginResult2.data, null, 2));

        if (!loginResult2.data.success) {
            console.log('\n   ❌ Still failed. Trying guard@example.com...');
            const loginResult3 = await makeRequest('POST', '/auth/login', {
                email: 'guard@example.com',
                password: 'password123',
            });
            console.log('   Status:', loginResult3.status);
            console.log('   Response:', JSON.stringify(loginResult3.data, null, 2));

            if (loginResult3.data.success) {
                loginResult.data = loginResult3.data;
            }
        } else {
            loginResult.data = loginResult2.data;
        }
    }

    if (!loginResult.data.success || !loginResult.data.token) {
        console.log('\n❌ Could not login. Exiting...');
        return;
    }

    const token = loginResult.data.token;
    console.log('\n   ✅ Login successful! Token:', token.substring(0, 30) + '...');

    // Step 2: Get upcoming/today shifts
    console.log('\n2. Getting today\'s shifts...');
    const todayShifts = await makeRequest('GET', '/shifts/today', null, token);
    console.log('   Status:', todayShifts.status);
    console.log('   Response:', JSON.stringify(todayShifts.data, null, 2));

    // Also check upcoming shifts
    console.log('\n3. Getting upcoming shifts...');
    const upcomingShifts = await makeRequest('GET', '/shifts/upcoming', null, token);
    console.log('   Status:', upcomingShifts.status);
    console.log('   Response:', JSON.stringify(upcomingShifts.data, null, 2));

    // Find a shift that can be checked into
    let shiftToTest = null;

    if (todayShifts.data.success && todayShifts.data.data?.length > 0) {
        // Find a SCHEDULED shift
        shiftToTest = todayShifts.data.data.find(s => s.status === 'SCHEDULED');
        if (!shiftToTest) {
            // Find an IN_PROGRESS shift for check-out testing
            shiftToTest = todayShifts.data.data.find(s => s.status === 'IN_PROGRESS');
        }
    }

    if (!shiftToTest && upcomingShifts.data.success && upcomingShifts.data.data?.length > 0) {
        shiftToTest = upcomingShifts.data.data.find(s => s.status === 'SCHEDULED');
    }

    if (!shiftToTest) {
        console.log('\n❌ No shifts found to test. Please run the seed script first:');
        console.log('   npx ts-node prisma/seed-test-checkin.ts');
        return;
    }

    console.log('\n4. Found shift to test:');
    console.log('   Shift ID:', shiftToTest.id);
    console.log('   Location:', shiftToTest.locationName);
    console.log('   Status:', shiftToTest.status);
    console.log('   Start:', shiftToTest.scheduledStartTime);

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
            console.log('\n   ✅ Check-in successful!');
            shiftToTest.status = 'IN_PROGRESS'; // Update for check-out test
        } else {
            console.log('\n   ❌ Check-in failed!');
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
            console.log('\n   ✅ Check-out successful!');
        } else {
            console.log('\n   ❌ Check-out failed!');
        }
    }

    console.log('\n=== Test Complete ===');
}

runTests().catch(console.error);
