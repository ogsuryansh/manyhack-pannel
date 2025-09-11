const fetch = require('node-fetch');

async function testSession() {
  try {
    console.log('Testing session persistence...');
    
    // Step 1: Login
    console.log('\n=== Step 1: Login ===');
    const loginResponse = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'manyhackpanel',
        password: 'manyhackpanel123'
      })
    });
    
    console.log('Login status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    // Extract cookies
    const setCookie = loginResponse.headers.get('set-cookie');
    console.log('Set-Cookie header:', setCookie);
    
    // Step 2: Test with cookies
    console.log('\n=== Step 2: Test with cookies ===');
    const statsResponse = await fetch('http://localhost:5000/api/referral/stats', {
      method: 'GET',
      headers: {
        'Cookie': setCookie || ''
      }
    });
    
    console.log('Stats status:', statsResponse.status);
    const statsData = await statsResponse.text();
    console.log('Stats response:', statsData);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testSession();
