
import fetch from 'node-fetch';

async function testLogin() {
    console.log('🧪 Testing Login API...');

    const endpoint = 'http://localhost:3001/api/auth/login';
    const credentials = {
        email: 'admin@example.com',
        password: 'Passw0rd!'
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        console.log(`📡 Status: ${response.status} ${response.statusText}`);

        const data = await response.json();
        console.log('📦 Body:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('✅ Login SUCCESS! The API is working correctly.');
        } else {
            console.log('❌ Login FAILED! The issue is on the server side.');
        }
    } catch (error) {
        console.error('💥 Connection Error:', error.message);
        console.log('Check if the server is running on localhost:3000');
    }
}

testLogin();
