// Run this script to synchronize existing user-team relationships
// Usage: node sync-teams.js

const { MongoClient } = require('mongodb');

async function syncTeamMembers() {
  const uri = process.env.MONGODB_URI || 'your_mongodb_connection_string';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('DocTracker');
    const users = db.collection('users');
    const teams = db.collection('teams');
    
    // Clear all team members arrays first
    await teams.updateMany({}, { $set: { members: [] } });
    console.log('Cleared all team members arrays');
    
    // Get all active users with team assignments
    const usersWithTeams = await users.find({ 
      teamId: { $exists: true, $ne: null },
      isActive: true 
    }).toArray();
    
    console.log(`Found ${usersWithTeams.length} users with team assignments`);
    
    // Group users by team
    const teamGroups = {};
    usersWithTeams.forEach(user => {
      const teamId = user.teamId.toString();
      if (!teamGroups[teamId]) {
        teamGroups[teamId] = [];
      }
      teamGroups[teamId].push(user._id);
    });
    
    // Update each team with its members
    for (const [teamId, memberIds] of Object.entries(teamGroups)) {
      const result = await teams.updateOne(
        { _id: new (require('mongodb')).ObjectId(teamId) },
        { $set: { members: memberIds } }
      );
      
      console.log(`Updated team ${teamId} with ${memberIds.length} members`);
    }
    
    console.log('Team synchronization completed!');
    
  } catch (error) {
    console.error('Error syncing teams:', error);
  } finally {
    await client.close();
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  syncTeamMembers();
}

module.exports = { syncTeamMembers };