const axios = require('axios');

axios.get('http://localhost:3000/api/health')
  .then(r => console.log('✅ Server is running:', r.data))
  .catch(e => console.error('❌ Server error:', e.message));
