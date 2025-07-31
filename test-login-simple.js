const https = require('https');

// Test different admin credentials
const testCredentials = [
  { email: 'admin@example.com', password: 'admin123' },
  { email: 'admin@mmostore.site', password: 'admin123' },
  { email: 'admin', password: 'admin123' }
];

async function testLogin(credentials) {
  console.log(`\nTesting login with: ${credentials.email}`);
  
  const loginData = JSON.stringify(credentials);
  
  const options = {
    hostname: 'mmostore.site',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };
  
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${body}`);
        
        if (res.statusCode === 200) {
          console.log('✅ Login successful!');
          
          // Extract token from Set-Cookie header
          const cookies = res.headers['set-cookie'];
          if (cookies) {
            for (const cookie of cookies) {
              if (cookie.startsWith('token=')) {
                const token = cookie.split(';')[0].split('=')[1];
                console.log(`Token: ${token.substring(0, 20)}...`);
                break;
              }
            }
          }
        } else {
          console.log('❌ Login failed');
        }
        
        resolve(res.statusCode === 200);
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      resolve(false);
    });
    
    req.write(loginData);
    req.end();
  });
}

// Test all credentials
async function testAllLogins() {
  console.log('Testing admin login credentials...');
  
  for (const creds of testCredentials) {
    const success = await testLogin(creds);
    if (success) {
      console.log(`\n🎉 Found working credentials: ${creds.email}`);
      return creds;
    }
  }
  
  console.log('\n❌ No working credentials found');
  return null;
}

testAllLogins().catch(console.error);