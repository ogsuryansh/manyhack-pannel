// Simple session test script
const axios = require('axios');

const API_BASE = process.env.API_URL || 'https://api.gaminggarage.store/api';

async function testSession() {
  console.log('🧪 Testing session functionality...\n');
  
  try {
    // Test 1: Check session status before login
    console.log('1. Checking session status before login...');
    const statusResponse = await axios.get(`${API_BASE}/admin/session-status`);
    console.log('Session status:', statusResponse.data);
    console.log('✅ Session status check completed\n');
    
    // Test 2: Admin login
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
    
    // Test 3: Check session status after login
    console.log('3. Checking session status after login...');
    const statusResponse2 = await axios.get(`${API_BASE}/admin/session-status`, {
      withCredentials: true
    });
    console.log('Session status after login:', statusResponse2.data);
    console.log('✅ Session status check after login completed\n');
    
    // Test 4: Test admin endpoint
    console.log('4. Testing admin endpoint...');
    const usersResponse = await axios.get(`${API_BASE}/admin/users`, {
      withCredentials: true
    });
    console.log('Users response status:', usersResponse.status);
    console.log('✅ Admin endpoint test completed\n');
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
  }
}

// Run the test
testSession();
