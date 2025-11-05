// Test script for site creation API
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testSiteCreation() {
  try {
    console.log('🧪 Testing Site Creation API...\n');

    // Step 1: Login as a client to get token
    console.log('1. Logging in as client...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'client@test.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');

    // Step 2: Create a test site
    console.log('\n2. Creating test site...');
    const siteData = {
      name: 'Test Site ' + Date.now(),
      address: '123 Test Street, Test City, TC 12345',
      city: 'Test City',
      state: 'TC',
      zipCode: '12345',
      description: 'This is a test site created by automated script',
      requirements: 'Licensed security guard with 2+ years experience',
      contactPerson: 'John Doe',
      contactPhone: '+1 555-123-4567'
    };

    const createResponse = await axios.post(`${API_BASE_URL}/sites`, siteData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!createResponse.data.success) {
      throw new Error('Site creation failed: ' + createResponse.data.message);
    }

    const createdSite = createResponse.data.data;
    console.log('✅ Site created successfully!');
    console.log('Site ID:', createdSite.id);
    console.log('Site Name:', createdSite.name);

    // Step 3: Fetch client sites to verify
    console.log('\n3. Fetching client sites to verify...');
    const sitesResponse = await axios.get(`${API_BASE_URL}/sites/my-sites`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!sitesResponse.data.success) {
      throw new Error('Failed to fetch sites');
    }

    const sites = sitesResponse.data.data.sites;
    console.log('✅ Sites fetched successfully!');
    console.log(`Found ${sites.length} sites`);
    
    // Check if our created site is in the list
    const foundSite = sites.find(site => site.id === createdSite.id);
    if (foundSite) {
      console.log('✅ Created site found in database!');
      console.log('Site details:', {
        id: foundSite.id,
        name: foundSite.name,
        address: foundSite.address,
        isActive: foundSite.isActive
      });
    } else {
      console.log('❌ Created site NOT found in database!');
    }

    console.log('\n🎉 Site creation test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testSiteCreation();
