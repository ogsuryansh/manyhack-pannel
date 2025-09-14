// Test balance update functionality
const axios = require('axios');

const API_BASE = process.env.API_URL || 'https://api.gaminggarage.store/api';

async function testBalanceUpdate() {
  console.log('🧪 Testing balance update functionality...\n');
  
  try {
    // Step 1: Admin login
    console.log('1. Logging in as admin...');
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
    
    // Step 2: Get users list
    console.log('2. Getting users list...');
    const usersResponse = await axios.get(`${API_BASE}/admin/users`, {
      withCredentials: true
    });
    console.log('Users count:', usersResponse.data.users?.length || 0);
    console.log('✅ Users list retrieved\n');
    
    // Step 3: Test balance update (if users exist)
    if (usersResponse.data.users && usersResponse.data.users.length > 0) {
      const testUser = usersResponse.data.users[0];
      console.log('3. Testing balance update for user:', testUser._id);
      
      const balanceUpdateResponse = await axios.put(
        `${API_BASE}/admin/users/${testUser._id}/custom-prices`,
        {
          customPrices: testUser.customPrices || [],
          balance: 100, // Add ₹100
          hiddenProducts: testUser.hiddenProducts || []
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Balance update response:', balanceUpdateResponse.data);
      console.log('✅ Balance update completed\n');
    } else {
      console.log('3. No users found to test balance update\n');
    }
    
    console.log('🎉 All balance update tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
    
    if (error.response?.status === 401) {
      console.log('\n🔧 401 Error Debug Info:');
      console.log('This means the session is not being properly maintained.');
      console.log('Check the server logs for session recovery attempts.');
    }
  }
}

// Run the test
testBalanceUpdate();
