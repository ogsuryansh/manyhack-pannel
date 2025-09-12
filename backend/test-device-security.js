const fetch = require('node-fetch');

async function testDeviceSecurity() {
  try {
    console.log('Testing device security system...');
    
    // Test 1: Register a new user
    const timestamp = Date.now();
    const username = 'devicetest' + timestamp;
    const email = 'devicetest' + timestamp + '@example.com';
    
    console.log('\n=== Test 1: Register User ===');
    const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username,
        email: email,
        password: 'password123',
        referralCode: 'TESTING'
      })
    });
    
    if (registerResponse.ok) {
      console.log('✅ User registered successfully');
    } else {
      console.log('❌ Registration failed:', await registerResponse.text());
      return;
    }
    
    // Test 2: Login from "device 1"
    console.log('\n=== Test 2: Login from Device 1 ===');
    const loginResponse1 = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Device1-Browser/1.0',
        'X-Forwarded-For': '192.168.1.100'
      },
      body: JSON.stringify({
        username: username,
        password: 'password123'
      })
    });
    
    if (loginResponse1.ok) {
      const loginData1 = await loginResponse1.json();
      console.log('✅ Login successful from Device 1');
      console.log('Token contains deviceId:', !!loginData1.token);
      
      // Test 3: Login from "device 2" (different IP and user agent)
      console.log('\n=== Test 3: Login from Device 2 (Different Device) ===');
      const loginResponse2 = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Device2-Browser/2.0',
          'X-Forwarded-For': '192.168.1.200'
        },
        body: JSON.stringify({
          username: username,
          password: 'password123'
        })
      });
      
      if (loginResponse2.ok) {
        const loginData2 = await loginResponse2.json();
        console.log('✅ Login successful from Device 2');
        
        // Test 4: Try to use token from Device 1 (should fail)
        console.log('\n=== Test 4: Using Device 1 Token After Device 2 Login ===');
        const testResponse = await fetch('http://localhost:5000/api/auth/me', {
          headers: { 
            'Authorization': `Bearer ${loginData1.token}`,
            'User-Agent': 'Device1-Browser/1.0',
            'X-Forwarded-For': '192.168.1.100'
          }
        });
        
        if (testResponse.ok) {
          console.log('❌ Device 1 token still works (this should not happen)');
        } else {
          const errorData = await testResponse.json();
          console.log('✅ Device 1 token correctly rejected:', errorData.message);
          console.log('Error code:', errorData.code);
        }
        
        // Test 5: Use token from Device 2 (should work)
        console.log('\n=== Test 5: Using Device 2 Token (Should Work) ===');
        const testResponse2 = await fetch('http://localhost:5000/api/auth/me', {
          headers: { 
            'Authorization': `Bearer ${loginData2.token}`,
            'User-Agent': 'Device2-Browser/2.0',
            'X-Forwarded-For': '192.168.1.200'
          }
        });
        
        if (testResponse2.ok) {
          console.log('✅ Device 2 token works correctly');
        } else {
          console.log('❌ Device 2 token failed:', await testResponse2.text());
        }
        
      } else {
        console.log('❌ Device 2 login failed:', await loginResponse2.text());
      }
      
    } else {
      console.log('❌ Device 1 login failed:', await loginResponse1.text());
    }
    
    console.log('\n=== Device Security Test Complete ===');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testDeviceSecurity();

