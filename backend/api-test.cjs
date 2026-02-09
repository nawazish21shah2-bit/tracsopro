// Simple API test for check-in/check-out
const http = require('http');

function post(path, body, token) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'localhost',
            port: 3000,
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
            port: 3000,
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
    console.log('=== API Test for guard1@example.com ===\n');

    // 1. Login
    console.log('1. Login...');
    const login = await post('/auth/login', {
        email: 'guard1@example.com',
        password: 'Passw0rd!'
    });
    console.log('   Status:', login.status);
    console.log('   Success:', login.success);

    if (!login.success || !login.token) {
        console.log('   Message:', login.message);
        console.log('\n❌ Login failed! Please restart the backend server to sync with DB.');
        return;
    }

    const token = login.token;
    console.log('   ✅ Logged in! Token:', token.substring(0, 20) + '...');

    // 2. Get shifts
    console.log('\n2. Getting shifts...');
    const today = await get('/shifts/today', token);
    const upcoming = await get('/shifts/upcoming', token);
    console.log('   Today:', today.data?.length || 0, 'shifts');
    console.log('   Upcoming:', upcoming.data?.length || 0, 'shifts');

    const allShifts = [...(today.data || []), ...(upcoming.data || [])];
    const shift = allShifts.find(s => s.status === 'SCHEDULED') || allShifts.find(s => s.status === 'IN_PROGRESS');

    if (!shift) {
        console.log('\n❌ No shifts found. Run: npx tsx setup-guard1.ts');
        return;
    }

    console.log('\n3. Test shift:', shift.id.substring(0, 8) + '...');
    console.log('   Status:', shift.status);
    console.log('   Location:', shift.locationName);

    // 3. Check-in
    if (shift.status === 'SCHEDULED') {
        console.log('\n4. CHECK-IN...');
        const checkin = await post('/shifts/' + shift.id + '/check-in', {
            location: { latitude: 40.7128, longitude: -74.006, accuracy: 10 }
        }, token);
        console.log('   Status:', checkin.status);
        console.log('   Success:', checkin.success);
        if (checkin.success) {
            console.log('   ✅ CHECK-IN SUCCESSFUL!');
            shift.status = 'IN_PROGRESS';
        } else {
            console.log('   ❌ Failed:', checkin.error || checkin.message);
        }
    }

    // 4. Check-out
    if (shift.status === 'IN_PROGRESS') {
        console.log('\n5. CHECK-OUT...');
        const checkout = await post('/shifts/' + shift.id + '/check-out', {
            location: { latitude: 40.7129, longitude: -74.0061, accuracy: 8 },
            notes: 'API test checkout'
        }, token);
        console.log('   Status:', checkout.status);
        console.log('   Success:', checkout.success);
        if (checkout.success) {
            console.log('   ✅ CHECK-OUT SUCCESSFUL!');
        } else {
            console.log('   ❌ Failed:', checkout.error || checkout.message);
        }
    }

    console.log('\n=== Test Complete ===');
}

main().catch(console.error);
