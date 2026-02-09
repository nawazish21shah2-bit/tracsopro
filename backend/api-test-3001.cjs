// API Test on port 3001
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
    console.log('=== API Test on Port 3001 ===\n');

    // Test health endpoint
    console.log('0. Testing health...');
    const health = await get('/health', null);
    console.log('   Status:', health.status);
    console.log('   Success:', health.success);

    // Login as admin first to verify
    console.log('\n1. Login as admin@example.com...');
    const adminLogin = await post('/auth/login', {
        email: 'admin@example.com',
        password: 'Passw0rd!'
    });
    console.log('   Status:', adminLogin.status);
    console.log('   Success:', adminLogin.success);

    if (!adminLogin.success) {
        console.log('   Message:', adminLogin.message);
        console.log('\n❌ Admin login failed!');
        return;
    }

    const adminToken = adminLogin.data?.token || adminLogin.token;
    console.log('   ✅ Admin logged in!');

    // Create a new guard via admin API
    console.log('\n2. Create new guard (via Admin API)...');
    const guardEmail = `testguard_${Date.now()}@example.com`;
    const createGuard = await post('/admin/users', {
        email: guardEmail,
        password: 'Passw0rd!',
        firstName: 'API',
        lastName: 'TestGuard',
        phone: '+1234567777',
        role: 'GUARD',
    }, adminToken);
    console.log('   Status:', createGuard.status);
    console.log('   Success:', createGuard.success);

    if (!createGuard.success) {
        console.log('   Error:', createGuard.error || createGuard.message);
    } else {
        console.log('   ✅ Guard created:', guardEmail);
    }

    // Login as the new guard
    console.log('\n3. Login as new guard...');
    const guardLogin = await post('/auth/login', {
        email: guardEmail,
        password: 'Passw0rd!'
    });
    console.log('   Status:', guardLogin.status);
    console.log('   Success:', guardLogin.success);

    if (!guardLogin.success) {
        console.log('   Error:', guardLogin.message);
        console.log('\n   Trying guard1@example.com instead...');
        const guard1Login = await post('/auth/login', {
            email: 'guard1@example.com',
            password: 'Passw0rd!'
        });
        if (guard1Login.success) {
            console.log('   ✅ guard1@example.com logged in!');
            testShifts(guard1Login.data?.token || guard1Login.token);
        }
        return;
    }

    const guardToken = guardLogin.data?.token || guardLogin.token;
    console.log('   ✅ Guard logged in!');

    await testShifts(guardToken);
}

async function testShifts(token) {
    // Get shifts
    console.log('\n4. Get shifts...');
    const today = await get('/shifts/today', token);
    const upcoming = await get('/shifts/upcoming', token);
    console.log('   Today shifts:', today.data?.length || 0);
    console.log('   Upcoming shifts:', upcoming.data?.length || 0);

    const allShifts = [...(today.data || []), ...(upcoming.data || [])];
    let shift = allShifts.find(s => s.status === 'SCHEDULED');

    if (!shift) {
        shift = allShifts.find(s => s.status === 'IN_PROGRESS');
    }

    if (!shift) {
        console.log('\n   No shifts available. Run: npx tsx admin-flow-test.ts to create one');
        return;
    }

    console.log('\n5. Found shift:', shift.id?.substring(0, 8) + '...');
    console.log('   Status:', shift.status);
    console.log('   Location:', shift.locationName);

    // Check-in
    if (shift.status === 'SCHEDULED') {
        console.log('\n6. CHECK-IN...');
        const checkin = await post('/shifts/' + shift.id + '/check-in', {
            location: { latitude: 40.7128, longitude: -74.006, accuracy: 10 }
        }, token);
        console.log('   Status:', checkin.status);
        console.log('   Success:', checkin.success);
        if (checkin.success) {
            console.log('   ✅ CHECK-IN SUCCESSFUL!');
            shift.status = 'IN_PROGRESS';
        } else {
            console.log('   ❌ Error:', checkin.error || checkin.message);
        }
    }

    // Check-out
    if (shift.status === 'IN_PROGRESS') {
        console.log('\n7. CHECK-OUT...');
        const checkout = await post('/shifts/' + shift.id + '/check-out', {
            location: { latitude: 40.7129, longitude: -74.0061, accuracy: 8 },
            notes: 'API test checkout on port 3001'
        }, token);
        console.log('   Status:', checkout.status);
        console.log('   Success:', checkout.success);
        if (checkout.success) {
            console.log('   ✅ CHECK-OUT SUCCESSFUL!');
        } else {
            console.log('   ❌ Error:', checkout.error || checkout.message);
        }
    }

    console.log('\n=== API Test Complete ===');
}

main().catch(console.error);
