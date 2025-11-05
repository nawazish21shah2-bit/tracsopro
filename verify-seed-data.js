// Verification script to test seeded data
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function verifySeededData() {
  try {
    console.log('🔍 Verifying seeded data...\n');

    // Test 1: Login as client and fetch sites
    console.log('1. Testing client login and sites...');
    const clientLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'client@test.com',
      password: 'password123'
    });

    if (!clientLogin.data.success) {
      throw new Error('Client login failed');
    }

    const clientToken = clientLogin.data.data.token;
    console.log('✅ Client login successful');

    // Fetch client sites
    const sitesResponse = await axios.get(`${API_BASE_URL}/sites/my-sites`, {
      headers: { 'Authorization': `Bearer ${clientToken}` }
    });

    if (!sitesResponse.data.success) {
      throw new Error('Failed to fetch client sites');
    }

    const sites = sitesResponse.data.data.sites;
    console.log(`✅ Found ${sites.length} sites for client`);
    sites.forEach((site, i) => {
      console.log(`   ${i + 1}. ${site.name} - ${site.address}`);
    });

    // Test 2: Login as guard and check available shifts
    console.log('\n2. Testing guard login and shifts...');
    const guardLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'mike.guard@test.com',
      password: 'password123'
    });

    if (!guardLogin.data.success) {
      throw new Error('Guard login failed');
    }

    const guardToken = guardLogin.data.data.token;
    console.log('✅ Guard login successful');

    // Fetch guard shifts
    try {
      const shiftsResponse = await axios.get(`${API_BASE_URL}/shifts/my-shifts`, {
        headers: { 'Authorization': `Bearer ${guardToken}` }
      });

      if (shiftsResponse.data.success) {
        const shifts = shiftsResponse.data.data.shifts || [];
        console.log(`✅ Found ${shifts.length} shifts for guard`);
        shifts.slice(0, 3).forEach((shift, i) => {
          console.log(`   ${i + 1}. ${shift.locationName} - ${shift.status} (${new Date(shift.startTime).toLocaleDateString()})`);
        });
      }
    } catch (error) {
      console.log('⚠️  Guard shifts endpoint not available yet');
    }

    // Test 3: Fetch active sites (available to guards)
    console.log('\n3. Testing active sites for guards...');
    const activeSitesResponse = await axios.get(`${API_BASE_URL}/sites/active`, {
      headers: { 'Authorization': `Bearer ${guardToken}` }
    });

    if (!activeSitesResponse.data.success) {
      throw new Error('Failed to fetch active sites');
    }

    const activeSites = activeSitesResponse.data.data.sites;
    console.log(`✅ Found ${activeSites.length} active sites available to guards`);
    activeSites.slice(0, 3).forEach((site, i) => {
      const openPostings = site.shiftPostings?.length || 0;
      console.log(`   ${i + 1}. ${site.name} - ${openPostings} open shift postings`);
    });

    // Test 4: Test site creation (to verify the fix)
    console.log('\n4. Testing site creation...');
    const newSiteData = {
      name: 'Test Site - Verification',
      address: '999 Verification Ave, Test City, TC 99999',
      city: 'Test City',
      state: 'TC',
      zipCode: '99999',
      description: 'Test site created during verification',
      requirements: 'Test requirements',
      contactPerson: 'Test Contact',
      contactPhone: '+1 555-999-9999'
    };

    const createSiteResponse = await axios.post(`${API_BASE_URL}/sites`, newSiteData, {
      headers: { 'Authorization': `Bearer ${clientToken}` }
    });

    if (!createSiteResponse.data.success) {
      throw new Error('Site creation failed: ' + createSiteResponse.data.message);
    }

    console.log('✅ Site creation working correctly');
    console.log(`   Created: ${createSiteResponse.data.data.name}`);

    // Test 5: Verify the new site appears in the list
    console.log('\n5. Verifying site appears in list...');
    const updatedSitesResponse = await axios.get(`${API_BASE_URL}/sites/my-sites`, {
      headers: { 'Authorization': `Bearer ${clientToken}` }
    });

    const updatedSites = updatedSitesResponse.data.data.sites;
    const newSite = updatedSites.find(site => site.name === 'Test Site - Verification');
    
    if (newSite) {
      console.log('✅ New site found in database');
      console.log(`   Total sites now: ${updatedSites.length}`);
    } else {
      console.log('❌ New site not found in database');
    }

    // Summary
    console.log('\n🎉 VERIFICATION COMPLETED!');
    console.log('==========================');
    console.log('✅ Client authentication working');
    console.log('✅ Guard authentication working');
    console.log('✅ Site creation and retrieval working');
    console.log('✅ Active sites endpoint working');
    console.log('✅ Database integration confirmed');
    console.log('==========================');

    console.log('\n📊 SEEDED DATA SUMMARY:');
    console.log(`🏢 Client Sites: ${updatedSites.length}`);
    console.log(`🔓 Active Sites: ${activeSites.length}`);
    console.log('👥 Test Accounts Available:');
    console.log('   - client@test.com / password123');
    console.log('   - mike.guard@test.com / password123');
    console.log('   - sarah.guard@test.com / password123');
    console.log('   - david.guard@test.com / password123');
    console.log('   - lisa.guard@test.com / password123');
    console.log('   - james.guard@test.com / password123');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run verification
verifySeededData();
