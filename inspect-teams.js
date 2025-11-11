// Script to inspect current team structure
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function inspectTeams() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('🔍 Inspecting current teams...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db();
    const teamsCollection = db.collection('teams');
    
    console.log(`📊 Database: ${db.databaseName}`);
    
    // Get all teams
    const teams = await teamsCollection.find({}).toArray();
    
    console.log(`\n📋 Found ${teams.length} teams total`);
    
    if (teams.length === 0) {
      console.log('No teams found in database');
      return;
    }
    
    teams.forEach((team, index) => {
      console.log(`\n${index + 1}. Team: ${team.name}`);
      console.log(`   ID: ${team._id}`);
      console.log(`   Active: ${team.isActive}`);
      console.log(`   Leader ID: ${team.teamLeaderId || 'None'}`);
      console.log(`   Members: ${team.members ? team.members.length : 0}`);
      console.log(`   Has leaderSlot: ${!!team.leaderSlot}`);
      console.log(`   Has memberSlots: ${!!team.memberSlots}`);
      
      if (team.leaderSlot) {
        console.log(`   Leader Slot - Current: ${team.leaderSlot.currentHolder || 'None'}`);
        console.log(`   Leader Slot - History: ${team.leaderSlot.history?.length || 0} entries`);
      }
      
      if (team.memberSlots) {
        console.log(`   Member Slots: ${team.memberSlots.length}`);
        const occupied = team.memberSlots.filter(slot => slot.currentHolder).length;
        console.log(`   Occupied Slots: ${occupied}`);
      }
    });
    
  } catch (error) {
    console.error('💥 Inspection failed:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

inspectTeams().catch(console.error);