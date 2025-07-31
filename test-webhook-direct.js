const https = require('https');

// Test confirm webhook API directly without authentication
async function testConfirmWebhookDirect() {
  console.log('Testing confirm webhook API without authentication...');
  
  const webhookData = JSON.stringify({
    webhookUrl: 'https://mmostore.site/api/payment/webhook'
  });
  
  const options = {
    hostname: 'mmostore.site',
    port: 443,
    path: '/api/payment/confirm-webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(webhookData)
    }
  };
  
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log('\n=== CONFIRM WEBHOOK RESPONSE (No Auth) ===');
        console.log('Status:', res.statusCode);
        console.log('Headers:', JSON.stringify(res.headers, null, 2));
        console.log('Body:', body);
        
        try {
          const parsed = JSON.parse(body);
          console.log('Parsed response:', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('Could not parse response as JSON');
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      resolve();
    });
    
    req.write(webhookData);
    req.end();
  });
}

// Test GET method as well
async function testConfirmWebhookGet() {
  console.log('\nTesting confirm webhook API GET method...');
  
  const options = {
    hostname: 'mmostore.site',
    port: 443,
    path: '/api/payment/confirm-webhook',
    method: 'GET'
  };
  
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log('\n=== CONFIRM WEBHOOK GET RESPONSE ===');
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
        
        try {
          const parsed = JSON.parse(body);
          console.log('Parsed response:', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('Could not parse response as JSON');
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      resolve();
    });
    
    req.end();
  });
}

// Run both tests
async function runTests() {
  await testConfirmWebhookGet();
  await testConfirmWebhookDirect();
}

runTests().catch(console.error);