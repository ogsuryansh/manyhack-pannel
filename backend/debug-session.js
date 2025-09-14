// Debug session flow script
const axios = require('axios');

const API_BASE = process.env.API_URL || 'https://api.gaminggarage.store/api';

async function debugSession() {
  console.log('🔍 Debugging session flow...\n');
  
  try {
    // Step 1: Check initial session status
    console.log('1. Checking initial session status...');
    const statusResponse = await axios.get(`${API_BASE}/admin/session-status`);
    console.log('Initial session status:', statusResponse.data);
    console.log('✅ Initial check completed\n');
    
    // Step 2: Admin login
    console.log('2. Attempting admin login...');
    const loginResponse = await axios.post(`${API_BASE}/admin/login`, {
      username: 'manyhack',
      password: 'manyhack_123'
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Login response:', loginResponse.data);
    console.log('✅ Admin login completed\n');
    
    // Step 3: Check session after login
    console.log('3. Checking session after login...');
    const statusResponse2 = await axios.get(`${API_BASE}/admin/session-status`, {
      withCredentials: true
    });
    console.log('Session after login:', statusResponse2.data);
    console.log('✅ Session check after login completed\n');
    
    // Step 4: Validate session
    console.log('4. Validating session...');
    const validateResponse = await axios.get(`${API_BASE}/admin/validate`, {
      withCredentials: true
    });
    console.log('Session validation:', validateResponse.data);
    console.log('✅ Session validation completed\n');
    
    // Step 5: Test admin check endpoint
    console.log('5. Testing admin check endpoint...');
    const checkResponse = await axios.get(`${API_BASE}/admin/check`, {
      withCredentials: true
    });
    console.log('Admin check response:', checkResponse.data);
    console.log('✅ Admin check completed\n');
    
    // Step 6: Test admin users endpoint
    console.log('6. Testing admin users endpoint...');
    const usersResponse = await axios.get(`${API_BASE}/admin/users`, {
      withCredentials: true
    });
    console.log('Users response status:', usersResponse.status);
    console.log('Users count:', usersResponse.data.users?.length || 0);
    console.log('✅ Admin users test completed\n');
    
    console.log('🎉 All session tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
    
    if (error.response?.status === 401) {
      console.log('\n🔧 401 Error Debug Info:');
      console.log('This usually means the session is not being properly maintained.');
      console.log('Check the server logs for session recovery attempts.');
    }
  }
}

// Run the debug
debugSession();
