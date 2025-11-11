// Test individual member API endpoint
async function testMemberAPI() {
  try {
    // We'll use one of the member IDs we found earlier
    const memberId = '6911397d606465661fed2c73'; // First member from our test results
    
    console.log(`Testing member API for ID: ${memberId}`);
    
    // First login as team leader  
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'teamleader',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Login failed');
      return;
    }

    const setCookie = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful');

    // Test the individual member endpoint
    const memberResponse = await fetch(`http://localhost:3000/api/team-leader/members/${memberId}`, {
      headers: {
        'Cookie': setCookie
      }
    });

    console.log(`Member API status: ${memberResponse.status}`);
    
    if (!memberResponse.ok) {
      const errorText = await memberResponse.text();
      console.error('❌ Member API failed:', errorText);
      return;
    }

    const memberData = await memberResponse.json();
    console.log('✅ Member API successful');
    console.log('Member data:', JSON.stringify(memberData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Check if we're in Node.js or browser environment
if (typeof window === 'undefined') {
  // Node.js environment - need fetch polyfill
  const fetch = require('node-fetch');
  global.fetch = fetch;
}

testMemberAPI();