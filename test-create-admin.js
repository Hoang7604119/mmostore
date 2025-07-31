const https = require('https');

// Test create admin API
async function testCreateAdmin() {
  console.log('Testing create admin API...');
  
  // First check existing admins
  console.log('\n1. Checking existing admin users...');
  
  const getOptions = {
    hostname: 'mmostore.site',
    port: 443,
    path: '/api/setup/create-admin',
    method: 'GET'
  };
  
  return new Promise((resolve) => {
    const getReq = https.request(getOptions, (getRes) => {
      let getBody = '';
      
      getRes.on('data', (chunk) => {
        getBody += chunk;
      });
      
      getRes.on('end', () => {
        console.log('GET Status:', getRes.statusCode);
        console.log('GET Response:', getBody);
        
        try {
          const getData = JSON.parse(getBody);
          console.log('Existing admins:', getData.adminCount);
          
          if (getData.adminCount > 0) {
            console.log('Admin users found:', JSON.stringify(getData.admins, null, 2));
            resolve(getData.admins[0]); // Return first admin
          } else {
            console.log('\n2. No admin users found, creating new admin...');
            createNewAdmin(resolve);
          }
        } catch (e) {
          console.log('Could not parse GET response as JSON');
          console.log('\n2. Attempting to create new admin...');
          createNewAdmin(resolve);
        }
      });
    });
    
    getReq.on('error', (error) => {
      console.error('GET request error:', error);
      resolve(null);
    });
    
    getReq.end();
  });
}

function createNewAdmin(resolve) {
  const postOptions = {
    hostname: 'mmostore.site',
    port: 443,
    path: '/api/setup/create-admin',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const postReq = https.request(postOptions, (postRes) => {
    let postBody = '';
    
    postRes.on('data', (chunk) => {
      postBody += chunk;
    });
    
    postRes.on('end', () => {
      console.log('POST Status:', postRes.statusCode);
      console.log('POST Response:', postBody);
      
      try {
        const postData = JSON.parse(postBody);
        if (postData.success) {
          console.log('✅ Admin user created successfully!');
          console.log('Credentials:', postData.credentials);
          resolve(postData.admin);
        } else {
          console.log('❌ Failed to create admin:', postData.message);
          resolve(null);
        }
      } catch (e) {
        console.log('Could not parse POST response as JSON');
        resolve(null);
      }
    });
  });
  
  postReq.on('error', (error) => {
    console.error('POST request error:', error);
    resolve(null);
  });
  
  postReq.end();
}

// Test login with admin credentials
async function testAdminLogin() {
  console.log('\n3. Testing admin login...');
  
  const loginData = JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  });
  
  const loginOptions = {
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
    const loginReq = https.request(loginOptions, (loginRes) => {
      let loginBody = '';
      
      loginRes.on('data', (chunk) => {
        loginBody += chunk;
      });
      
      loginRes.on('end', () => {
        console.log('Login Status:', loginRes.statusCode);
        console.log('Login Response:', loginBody);
        
        if (loginRes.statusCode === 200) {
          console.log('✅ Admin login successful!');
          
          // Extract token from Set-Cookie header
          const cookies = loginRes.headers['set-cookie'];
          let token = null;
          
          if (cookies) {
            for (const cookie of cookies) {
              if (cookie.startsWith('token=')) {
                token = cookie.split(';')[0].split('=')[1];
                break;
              }
            }
          }
          
          resolve(token);
        } else {
          console.log('❌ Admin login failed');
          resolve(null);
        }
      });
    });
    
    loginReq.on('error', (error) => {
      console.error('Login request error:', error);
      resolve(null);
    });
    
    loginReq.write(loginData);
    loginReq.end();
  });
}

// Test confirm webhook with admin token
async function testConfirmWebhookWithToken(token) {
  console.log('\n4. Testing confirm webhook with admin token...');
  
  const webhookData = JSON.stringify({
    webhookUrl: 'https://mmostore.site/api/payment/webhook'
  });
  
  const webhookOptions = {
    hostname: 'mmostore.site',
    port: 443,
    path: '/api/payment/confirm-webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(webhookData),
      'Cookie': `token=${token}`
    }
  };
  
  return new Promise((resolve) => {
    const webhookReq = https.request(webhookOptions, (webhookRes) => {
      let webhookBody = '';
      
      webhookRes.on('data', (chunk) => {
        webhookBody += chunk;
      });
      
      webhookRes.on('end', () => {
        console.log('\n=== CONFIRM WEBHOOK RESPONSE ===');
        console.log('Status:', webhookRes.statusCode);
        console.log('Body:', webhookBody);
        
        try {
          const parsed = JSON.parse(webhookBody);
          console.log('Parsed response:', JSON.stringify(parsed, null, 2));
          
          if (webhookRes.statusCode === 200 && parsed.success) {
            console.log('✅ Webhook confirmation successful!');
          } else {
            console.log('❌ Webhook confirmation failed:', parsed.error || parsed.details);
          }
        } catch (e) {
          console.log('Could not parse response as JSON');
        }
        
        resolve();
      });
    });
    
    webhookReq.on('error', (error) => {
      console.error('Webhook request error:', error);
      resolve();
    });
    
    webhookReq.write(webhookData);
    webhookReq.end();
  });
}

// Run all tests
async function runAllTests() {
  console.log('=== ADMIN SETUP AND WEBHOOK TEST ===');
  
  try {
    // Step 1: Create or check admin
    const admin = await testCreateAdmin();
    
    if (!admin) {
      console.log('❌ Could not create or find admin user');
      return;
    }
    
    // Step 2: Login as admin
    const token = await testAdminLogin();
    
    if (!token) {
      console.log('❌ Could not login as admin');
      return;
    }
    
    // Step 3: Test confirm webhook
    await testConfirmWebhookWithToken(token);
    
    console.log('\n=== TEST COMPLETED ===');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

runAllTests().catch(console.error);