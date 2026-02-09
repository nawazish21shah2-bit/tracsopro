// Reset guard1 password and test check-in/check-out
const http = require('http');

const BASE_URL = 'http://localhost:3000/api';

function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

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
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function runTests() {
    console.log('=== Testing Check-In/Check-Out for guard1@example.com ===\n');

    // Login as guard1 with Passw0rd!
    console.log('1. Logging in as guard1@example.com...');
    const loginResult = await makeRequest('POST', '/auth/login', {
        email: 'guard1@example.com',
        password: 'Passw0rd!',
    });

    console.log('   Status:', loginResult.status);

    if (!loginResult.data.success) {
        console.log('   Response:', JSON.stringify(loginResult.data, null, 2));
        console.log('\n❌ Login failed. Checking if user exists...');

        // Try to register/update the user
        console.log('\n   Trying to register guard1...');
        const registerResult = await makeRequest('POST', '/auth/register', {
            email: 'guard1@example.com',
            password: 'Passw0rd!',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            role: 'GUARD',
        });
        console.log('   Register status:', registerResult.status);
        console.log('   Register response:', JSON.stringify(registerResult.data, null, 2));
        return;
    }

    const token = loginResult.data.token;
    console.log('   ✅ Login successful!');
    console.log('   Token:', token.substring(0, 30) + '...');

    // Get shifts
    console.log('\n2. Getting today/upcoming shifts...');
    const todayShifts = await makeRequest('GET', '/shifts/today', null, token);
    const upcomingShifts = await makeRequest('GET', '/shifts/upcoming', null, token);

    console.log('   Today shifts:', todayShifts.data.data?.length || 0);
    console.log('   Upcoming shifts:', upcomingShifts.data.data?.length || 0);

    let allShifts = [...(todayShifts.data.data || []), ...(upcomingShifts.data.data || [])];

    if (allShifts.length > 0) {
        console.log('\n   All shifts:');
        allShifts.forEach(s => {
            console.log(`   - ${s.id.substring(0, 8)}... | ${s.status} | ${s.locationName} | ${new Date(s.scheduledStartTime).toLocaleString()}`);
        });
    }

    // Find shift to test
    let shift = allShifts.find(s => s.status === 'SCHEDULED') || allShifts.find(s => s.status === 'IN_PROGRESS');

    if (!shift) {
        console.log('\n❌ No testable shifts found. Run: npx tsx prisma/seed-test-checkin.ts');
        return;
    }

    console.log('\n3. Testing with shift:', shift.id);
    console.log('   Status:', shift.status);
    console.log('   Location:', shift.locationName);

    // Test Check-In
    if (shift.status === 'SCHEDULED') {
        console.log('\n4. Testing CHECK-IN...');
        const result = await makeRequest('POST', `/shifts/${shift.id}/check-in`, {
            location: { latitude: 40.7128, longitude: -74.006, accuracy: 10 }
        }, token);

        console.log('   Status:', result.status);
        console.log('   Success:', result.data.success);
        if (result.data.success) {
            console.log('   ✅ CHECK-IN SUCCESSFUL! Shift now IN_PROGRESS');
            shift.status = 'IN_PROGRESS';
        } else {
            console.log('   ❌ Check-in failed:', result.data.error || result.data.message);
        }
    }

    // Test Check-Out
    if (shift.status === 'IN_PROGRESS') {
        console.log('\n5. Testing CHECK-OUT...');
        const result = await makeRequest('POST', `/shifts/${shift.id}/check-out`, {
            location: { latitude: 40.7129, longitude: -74.0061, accuracy: 8 },
            notes: 'Test check-out completed'
        }, token);

        console.log('   Status:', result.status);
        console.log('   Success:', result.data.success);
        if (result.data.success) {
            console.log('   ✅ CHECK-OUT SUCCESSFUL! Shift now COMPLETED');
        } else {
            console.log('   ❌ Check-out failed:', result.data.error || result.data.message);
        }
    }

    console.log('\n=== Test Complete ===');
}

runTests().catch(console.error);
