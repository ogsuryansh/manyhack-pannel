const fetch = require('node-fetch');

// Helper to create a cookie jar
class CookieJar {
  constructor() {
    this.cookies = {};
  }
  
  setCookie(cookieString) {
    if (cookieString) {
      const [nameValue] = cookieString.split(';');
      const [name, value] = nameValue.split('=');
      this.cookies[name] = value;
    }
  }
  
  getCookieString() {
    return Object.entries(this.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }
}

async function testSessionSecurity() {
  try {
    console.log('Testing session-based device security...');
    
    // Test 1: Register a new user
    const timestamp = Date.now();
    const username = 'sessiontest' + timestamp;
    const email = 'sessiontest' + timestamp + '@example.com';
    
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
    
    // Test 2: Login from "device 1" (simulate different browsers)
    console.log('\n=== Test 2: Login from Device 1 ===');
    const cookieJar1 = new CookieJar();
    
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
    
    // Extract session cookie
    const setCookie1 = loginResponse1.headers.get('set-cookie');
    if (setCookie1) {
      cookieJar1.setCookie(setCookie1);
    }
    
    if (loginResponse1.ok) {
      const loginData1 = await loginResponse1.json();
      console.log('✅ Login successful from Device 1');
      console.log('Session cookie set:', !!setCookie1);
      
      // Test 3: Use session from Device 1
      console.log('\n=== Test 3: Using Device 1 Session ===');
      const meResponse1 = await fetch('http://localhost:5000/api/auth/me', {
        headers: { 
          'Cookie': cookieJar1.getCookieString(),
          'User-Agent': 'Device1-Browser/1.0',
          'X-Forwarded-For': '192.168.1.100'
        }
      });
      
      if (meResponse1.ok) {
        const userData1 = await meResponse1.json();
        console.log('✅ Device 1 session works:', userData1.username);
      } else {
        console.log('❌ Device 1 session failed:', await meResponse1.text());
      }
      
      // Test 4: Login from "device 2" (different IP and user agent)
      console.log('\n=== Test 4: Login from Device 2 (Different Device) ===');
      const cookieJar2 = new CookieJar();
      
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
      
      const setCookie2 = loginResponse2.headers.get('set-cookie');
      if (setCookie2) {
        cookieJar2.setCookie(setCookie2);
      }
      
      if (loginResponse2.ok) {
        console.log('✅ Login successful from Device 2');
        
        // Test 5: Try to use Device 1 session after Device 2 login (should fail)
        console.log('\n=== Test 5: Using Device 1 Session After Device 2 Login ===');
        const meResponse1After = await fetch('http://localhost:5000/api/auth/me', {
          headers: { 
            'Cookie': cookieJar1.getCookieString(),
            'User-Agent': 'Device1-Browser/1.0',
            'X-Forwarded-For': '192.168.1.100'
          }
        });
        
        if (meResponse1After.ok) {
          console.log('❌ Device 1 session still works (this should not happen)');
        } else {
          const errorData = await meResponse1After.json();
          console.log('✅ Device 1 session correctly rejected:', errorData.message);
          console.log('Error code:', errorData.code);
        }
        
        // Test 6: Use Device 2 session (should work)
        console.log('\n=== Test 6: Using Device 2 Session (Should Work) ===');
        const meResponse2 = await fetch('http://localhost:5000/api/auth/me', {
          headers: { 
            'Cookie': cookieJar2.getCookieString(),
            'User-Agent': 'Device2-Browser/2.0',
            'X-Forwarded-For': '192.168.1.200'
          }
        });
        
        if (meResponse2.ok) {
          const userData2 = await meResponse2.json();
          console.log('✅ Device 2 session works:', userData2.username);
        } else {
          console.log('❌ Device 2 session failed:', await meResponse2.text());
        }
        
      } else {
        console.log('❌ Device 2 login failed:', await loginResponse2.text());
      }
      
    } else {
      console.log('❌ Device 1 login failed:', await loginResponse1.text());
    }
    
    console.log('\n=== Session-Based Device Security Test Complete ===');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testSessionSecurity();
