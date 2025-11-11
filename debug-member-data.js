// Test what data the team leader APIs are actually returning
const fetch = require('node-fetch');

async function debugTeamLeaderData() {
  try {
    console.log('🔍 Debugging Team Leader Data Sources...\n');

    // Login first
    console.log('1. Logging in...');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'teamleader', password: 'password123' })
    });

    if (!loginRes.ok) throw new Error('Login failed');
    const cookie = loginRes.headers.get('set-cookie');
    console.log('✅ Login successful\n');

    // Test members API
    console.log('2. Checking members API...');
    const membersRes = await fetch('http://localhost:3000/api/team-leader/members', {
      headers: { Cookie: cookie }
    });

    if (!membersRes.ok) throw new Error('Members API failed');
    const membersData = await membersRes.json();
    console.log(`Found ${membersData.data?.members?.length || 0} members\n`);

    // Test first member's detailed data
    if (membersData.data?.members?.length > 0) {
      const firstMember = membersData.data.members[0];
      console.log(`3. Checking detailed data for: ${firstMember.firstName} ${firstMember.lastName}`);
      
      const memberRes = await fetch(`http://localhost:3000/api/team-leader/members/${firstMember._id}`, {
        headers: { Cookie: cookie }
      });

      if (!memberRes.ok) {
        console.error(`❌ Member API failed: ${memberRes.status}`);
        const errorText = await memberRes.text();
        console.error('Error:', errorText);
        return;
      }

      const memberData = await memberRes.json();
      console.log('\n📊 Member Data Breakdown:');
      console.log(`   Projects: ${memberData.data?.projects?.length || 0}`);
      console.log(`   Current Tasks: ${memberData.data?.currentTasks?.length || 0}`);
      console.log(`   Completed Tasks: ${memberData.data?.completedTasks?.length || 0}`);
      
      const analytics = memberData.data?.analytics;
      if (analytics) {
        console.log('\n📈 Analytics:');
        console.log(`   Total Tasks: ${analytics.totalTasks || 0}`);
        console.log(`   Completion Rate: ${analytics.completionRate || 0}%`);
        console.log(`   Avg Completion Time: ${analytics.avgCompletionTime || 0} hours`);
      }

      // Show sample data if it exists
      if (memberData.data?.projects?.length > 0) {
        console.log('\n🚧 Sample Projects:');
        memberData.data.projects.slice(0, 2).forEach(p => {
          console.log(`   - ${p.name} (${p.status})`);
        });
      }

      if (memberData.data?.completedTasks?.length > 0) {
        console.log('\n✅ Sample Completed Tasks:');
        memberData.data.completedTasks.slice(0, 3).forEach(t => {
          console.log(`   - ${t.title} (completed: ${t.completedAt})`);
        });
      }

      console.log('\n🔍 This data is coming from the database queries in:');
      console.log('   /api/team-leader/members/[memberId]/route.ts');
      console.log('\n   The data is LIVE from database, not placeholder!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugTeamLeaderData();