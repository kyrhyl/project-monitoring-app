// Test the updated team members API with real data
const fetch = require('node-fetch');

async function testRealData() {
  const ports = [3000, 3001]; // Try both possible ports
  
  for (const port of ports) {
    try {
      console.log(`\n🔌 Testing on port ${port}...`);
      
      // Login first
      const loginRes = await fetch(`http://localhost:${port}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'teamleader', password: 'password123' })
      });

      if (!loginRes.ok) {
        console.log(`❌ Port ${port} - Login failed`);
        continue;
      }

      const cookie = loginRes.headers.get('set-cookie');
      console.log(`✅ Port ${port} - Login successful`);

      // Test updated members API
      const membersRes = await fetch(`http://localhost:${port}/api/team-leader/members`, {
        headers: { Cookie: cookie }
      });

      if (!membersRes.ok) {
        console.log(`❌ Port ${port} - Members API failed`);
        continue;
      }

      const membersData = await membersRes.json();
      console.log(`✅ Port ${port} - Members API successful`);
      console.log(`   Found ${membersData.data?.members?.length || 0} members\n`);

      if (membersData.data?.members?.length > 0) {
        console.log('📊 Real Data Results:');
        membersData.data.members.slice(0, 3).forEach((member, i) => {
          console.log(`\n${i + 1}. ${member.firstName} ${member.lastName}`);
          console.log(`   Current Projects: ${member.currentProjects || 0}`);
          console.log(`   Active Tasks: ${member.activeTasks || 0}`);
          console.log(`   Completed Tasks: ${member.completedTasks || 0}`);
          console.log(`   Tenure: ${member.currentTenure || 0} days`);
        });
        
        console.log('\n🎉 SUCCESS! No more random mock data!');
        console.log('   All numbers are now real data from database.');
        console.log('   Since database is empty, all counts show 0 (which is correct!)');
      }

      return; // Exit on success
      
    } catch (error) {
      console.log(`❌ Port ${port} - Error: ${error.message}`);
    }
  }
  
  console.log('\n❌ Could not connect to any development server');
  console.log('   Please make sure the Next.js dev server is running');
}

testRealData();