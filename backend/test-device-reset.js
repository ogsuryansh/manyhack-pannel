const fetch = require('node-fetch');

async function testDeviceReset() {
  try {
    console.log('Testing device reset functionality...');
    
    // Test reset endpoint with username and password
    const resetResponse = await fetch('http://localhost:5000/api/auth/reset-device-lock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
        'User-Agent': 'Test-Client/1.0'
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass'
      })
    });
    
    console.log('\nReset Test Status:', resetResponse.status);
    console.log('Reset Test Headers:', resetResponse.headers.raw());
    
    const resetData = await resetResponse.text();
    console.log('Reset Test Response:', resetData);
    
    // Test with missing credentials
    const resetResponse2 = await fetch('http://localhost:5000/api/auth/reset-device-lock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
        'User-Agent': 'Test-Client/1.0'
      },
      body: JSON.stringify({})
    });
    
    console.log('\nReset Test 2 (No Credentials) Status:', resetResponse2.status);
    const resetData2 = await resetResponse2.text();
    console.log('Reset Test 2 Response:', resetData2);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDeviceReset();
