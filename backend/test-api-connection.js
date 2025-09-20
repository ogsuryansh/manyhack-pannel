const fetch = require('node-fetch');

async function testApiConnection() {
  try {
    console.log('Testing API connection...');
    
    // Test CORS endpoint
    const corsResponse = await fetch('http://localhost:5000/api/cors-test', {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:3000',
        'User-Agent': 'Test-Client/1.0'
      }
    });
    
    console.log('CORS Test Status:', corsResponse.status);
    console.log('CORS Test Headers:', corsResponse.headers.raw());
    
    const corsData = await corsResponse.text();
    console.log('CORS Test Response:', corsData);
    
    // Test login endpoint
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
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
    
    console.log('\nLogin Test Status:', loginResponse.status);
    console.log('Login Test Headers:', loginResponse.headers.raw());
    
    const loginData = await loginResponse.text();
    console.log('Login Test Response:', loginData);
    
    // Test device reset endpoint (should fail without auth)
    const resetResponse = await fetch('http://localhost:5000/api/auth/reset-device-lock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
        'User-Agent': 'Test-Client/1.0'
      }
    });
    
    console.log('\nReset Test Status:', resetResponse.status);
    console.log('Reset Test Headers:', resetResponse.headers.raw());
    
    const resetData = await resetResponse.text();
    console.log('Reset Test Response:', resetData);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testApiConnection();
