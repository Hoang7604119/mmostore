const fetch = require('node-fetch');

async function testPendingCreditsAPI() {
  try {
    console.log('Testing pending credits API...');
    
    // First, let's try to get the API without authentication to see the error
    console.log('\n1. Testing without authentication:');
    const response1 = await fetch('http://localhost:3000/api/user/pending-credits', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response1.status);
    const result1 = await response1.json();
    console.log('Response:', result1);
    
    // Test with a mock token (this will likely fail but shows the flow)
    console.log('\n2. Testing with mock token:');
    const response2 = await fetch('http://localhost:3000/api/user/pending-credits', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'token=mock-token'
      }
    });
    
    console.log('Status:', response2.status);
    const result2 = await response2.json();
    console.log('Response:', result2);
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testPendingCreditsAPI();