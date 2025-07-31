const https = require('https');
const http = require('http');

// Test confirm webhook API
async function testConfirmWebhook() {
  console.log('Testing confirm webhook API...');
  
  // First, login to get admin token
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
  
  return new Promise((resolve, reject) => {
    const loginReq = https.request(loginOptions, (loginRes) => {
      let loginBody = '';
      
      loginRes.on('data', (chunk) => {
        loginBody += chunk;
      });
      
      loginRes.on('end', () => {
        console.log('Login response status:', loginRes.statusCode);
        console.log('Login response body:', loginBody);
        
        if (loginRes.statusCode === 200) {
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
          
          if (token) {
            console.log('Got admin token, testing confirm webhook...');
            
            // Now test confirm webhook
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
            
            const webhookReq = https.request(webhookOptions, (webhookRes) => {
              let webhookBody = '';
              
              webhookRes.on('data', (chunk) => {
                webhookBody += chunk;
              });
              
              webhookRes.on('end', () => {
                console.log('\n=== CONFIRM WEBHOOK RESPONSE ===');
                console.log('Status:', webhookRes.statusCode);
                console.log('Headers:', webhookRes.headers);
                console.log('Body:', webhookBody);
                
                try {
                  const parsed = JSON.parse(webhookBody);
                  console.log('Parsed response:', JSON.stringify(parsed, null, 2));
                } catch (e) {
                  console.log('Could not parse response as JSON');
                }
                
                resolve();
              });
            });
            
            webhookReq.on('error', (error) => {
              console.error('Webhook request error:', error);
              reject(error);
            });
            
            webhookReq.write(webhookData);
            webhookReq.end();
            
          } else {
            console.log('Could not extract token from login response');
            resolve();
          }
        } else {
          console.log('Login failed');
          resolve();
        }
      });
    });
    
    loginReq.on('error', (error) => {
      console.error('Login request error:', error);
      reject(error);
    });
    
    loginReq.write(loginData);
    loginReq.end();
  });
}

// Run the test
testConfirmWebhook().catch(console.error);