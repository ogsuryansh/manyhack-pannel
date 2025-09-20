const fetch = require('node-fetch');

async function testLockTimeBehavior() {
  try {
    console.log('Testing device lock time behavior...');
    
    const username = 'testuser' + Date.now();
    const password = 'testpass123';
    
    // Step 1: Register a new user
    console.log('\n=== Step 1: Register User ===');
    const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username,
        email: username + '@test.com',
        password: password,
        referralCode: 'WELCOME2024'
      })
    });
    
    if (registerResponse.ok) {
      console.log('✅ User registered successfully');
    } else {
      console.log('❌ Registration failed:', await registerResponse.text());
      return;
    }
    
    // Step 2: First login (should set initial lock time)
    console.log('\n=== Step 2: First Login (Sets Lock Time) ===');
    const login1Response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (login1Response.ok) {
      console.log('✅ First login successful');
      const login1Data = await login1Response.json();
      console.log('Login time:', new Date().toISOString());
    } else {
      console.log('❌ First login failed:', await login1Response.text());
      return;
    }
    
    // Step 3: Wait 30 seconds
    console.log('\n=== Step 3: Waiting 30 seconds ===');
    await new Promise(resolve => setTimeout(resolve, 30000));
    console.log('Waited 30 seconds, current time:', new Date().toISOString());
    
    // Step 4: Second login (should keep original lock time)
    console.log('\n=== Step 4: Second Login (Should Keep Original Lock Time) ===');
    const login2Response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (login2Response.ok) {
      console.log('✅ Second login successful');
      console.log('Login time:', new Date().toISOString());
    } else {
      console.log('❌ Second login failed:', await login2Response.text());
    }
    
    // Step 5: Try to reset device lock (should fail - not 1 minute yet)
    console.log('\n=== Step 5: Try Reset Device Lock (Should Fail) ===');
    const resetResponse = await fetch('http://localhost:5000/api/auth/reset-device-lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const resetData = await resetResponse.json();
    console.log('Reset response status:', resetResponse.status);
    console.log('Reset response:', resetData);
    
    // Step 6: Wait another 35 seconds (total 65 seconds = 1+ minute)
    console.log('\n=== Step 6: Waiting 35 more seconds (Total 65 seconds) ===');
    await new Promise(resolve => setTimeout(resolve, 35000));
    console.log('Waited 35 more seconds, current time:', new Date().toISOString());
    
    // Step 7: Try to reset device lock again (should succeed)
    console.log('\n=== Step 7: Try Reset Device Lock Again (Should Succeed) ===');
    const reset2Response = await fetch('http://localhost:5000/api/auth/reset-device-lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const reset2Data = await reset2Response.json();
    console.log('Reset response status:', reset2Response.status);
    console.log('Reset response:', reset2Data);
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLockTimeBehavior();
