// Test script to check team leader members API
const fetch = require('node-fetch');

async function testMembersAPI() {
  try {
    // First login as team leader
    console.log('1. Logging in as team leader...');
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
      console.error('Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    
    // Extract cookie for authentication
    const setCookie = loginResponse.headers.get('set-cookie');
    console.log('Cookie:', setCookie);

    // Test team leader members API
    console.log('\n2. Fetching team members...');
    const membersResponse = await fetch('http://localhost:3000/api/team-leader/members', {
      method: 'GET',
      headers: {
        'Cookie': setCookie
      }
    });

    if (!membersResponse.ok) {
      console.error('Members API failed:', await membersResponse.text());
      return;
    }

    const membersData = await membersResponse.json();
    console.log('\n✅ Members API Response:');
    console.log('Success:', membersData.success);
    console.log('Team:', membersData.data?.team);
    console.log('Members count:', membersData.data?.members?.length || 0);
    
    if (membersData.data?.members?.length > 0) {
      console.log('\nFirst few members:');
      membersData.data.members.slice(0, 3).forEach((member, i) => {
        console.log(`${i + 1}. ${member.firstName} ${member.lastName} (${member.username})`);
        console.log(`   Role: ${member.role}, Tenure: ${member.tenure} days`);
        console.log(`   Slot ID: ${member.slotId}`);
      });
    } else {
      console.log('❌ No members found');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testMembersAPI();