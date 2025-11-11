// Script to verify and complete slot migration for specific teams
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function verifySlotMigration() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('🔍 Verifying slot-based migration...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db();
    const teamsCollection = db.collection('teams');
    
    console.log(`📊 Database: ${db.databaseName}`);
    
    // Get active teams
    const teams = await teamsCollection.find({ isActive: true }).toArray();
    
    console.log(`\n📋 Found ${teams.length} active teams`);
    
    for (const team of teams) {
      console.log(`\n🔄 Analyzing team: ${team.name}`);
      
      let needsUpdate = false;
      const updates = {};
      
      // Check leader slot
      if (team.teamLeaderId && team.leaderSlot) {
        const currentLeader = team.leaderSlot.currentHolder;
        if (!currentLeader || currentLeader.toString() !== team.teamLeaderId.toString()) {
          console.log(`  📋 Leader slot needs sync: ${team.teamLeaderId}`);
          
          // Update leader slot to match teamLeaderId
          updates.leaderSlot = {
            currentHolder: new ObjectId(team.teamLeaderId),
            history: team.leaderSlot.history || []
          };
          
          // Add to history if not already there
          const hasCurrentInHistory = updates.leaderSlot.history.some(
            entry => entry.userId.toString() === team.teamLeaderId.toString() && !entry.unassignedAt
          );
          
          if (!hasCurrentInHistory) {
            updates.leaderSlot.history.push({
              userId: new ObjectId(team.teamLeaderId),
              assignedAt: team.createdAt || new Date(),
              assignedBy: team.createdBy || new ObjectId()
            });
          }
          
          needsUpdate = true;
        }
      }
      
      // Check member slots
      if (team.members && team.members.length > 0 && team.memberSlots) {
        const currentSlotHolders = team.memberSlots
          .filter(slot => slot.currentHolder)
          .map(slot => slot.currentHolder.toString());
        
        const teamMemberIds = team.members.map(id => id.toString());
        
        // Check if slots match members
        const slotsMatch = teamMemberIds.every(id => currentSlotHolders.includes(id)) &&
                          currentSlotHolders.every(id => teamMemberIds.includes(id)) &&
                          teamMemberIds.length === currentSlotHolders.length;
        
        if (!slotsMatch) {
          console.log(`  👥 Member slots need sync: ${team.members.length} members vs ${currentSlotHolders.length} occupied slots`);
          
          // Rebuild member slots to match current members
          const newMemberSlots = team.members.map((memberId, index) => {
            // Try to find existing slot for this member
            const existingSlot = team.memberSlots.find(
              slot => slot.currentHolder && slot.currentHolder.toString() === memberId.toString()
            );
            
            if (existingSlot) {
              return existingSlot;
            }
            
            // Create new slot for this member
            return {
              slotId: new ObjectId(),
              currentHolder: new ObjectId(memberId),
              history: [{
                userId: new ObjectId(memberId),
                assignedAt: team.createdAt || new Date(),
                assignedBy: team.createdBy || new ObjectId()
              }]
            };
          });
          
          updates.memberSlots = newMemberSlots;
          needsUpdate = true;
        }
      }
      
      // Apply updates if needed
      if (needsUpdate) {
        console.log(`  🔧 Updating team with slot corrections...`);
        
        await teamsCollection.updateOne(
          { _id: team._id },
          { $set: updates }
        );
        
        console.log(`  ✅ Successfully updated ${team.name}`);
      } else {
        console.log(`  ✅ ${team.name} - slots are properly synchronized`);
      }
    }
    
    console.log('\n🎉 VERIFICATION COMPLETED!');
    
  } catch (error) {
    console.error('💥 Verification failed:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

verifySlotMigration().catch(console.error);