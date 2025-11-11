// Test the updated TeamSlotManager logic
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testUpdatedLogic() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Direct query using mongoose
    const team = await mongoose.connection.db.collection('teams').findOne({
      name: 'Building Team',
      isActive: true
    });

    if (!team) {
      console.log('❌ Team not found');
      return;
    }

    console.log(`✅ Found team: ${team.name}`);
    console.log(`📊 Total member slots: ${team.memberSlots?.length || 0}`);

    // Test the filtering logic from our updated TeamSlotManager
    if (team.memberSlots && team.memberSlots.length > 0) {
      let activeMembers = [];
      
      console.log('\n🔍 Analyzing slots:');
      
      team.memberSlots.forEach((slot, index) => {
        console.log(`\nSlot ${index + 1}:`);
        console.log(`  Has currentHolder: ${!!slot.currentHolder}`);
        
        if (slot.currentHolder) {
          console.log(`  CurrentHolder: ${slot.currentHolder.toString()}`);
          console.log(`  History entries: ${slot.history?.length || 0}`);
          
          let isActive = false;
          
          if (slot.history && slot.history.length > 0) {
            // Find latest assignment for current holder
            const currentHolderAssignments = slot.history.filter(entry => 
              entry.userId.toString() === slot.currentHolder.toString()
            );
            
            if (currentHolderAssignments.length > 0) {
              const latestAssignment = currentHolderAssignments
                .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())[0];
              
              console.log(`  Latest assignment:`);
              console.log(`    Assigned: ${latestAssignment.assignedAt}`);
              console.log(`    Unassigned: ${latestAssignment.unassignedAt || 'Still active'}`);
              
              isActive = !latestAssignment.unassignedAt;
            } else {
              console.log(`  ⚠️  currentHolder not found in history`);
              isActive = true; // Assume active if no history matches
            }
          } else {
            console.log(`  No history - assuming active`);
            isActive = true;
          }
          
          console.log(`  Status: ${isActive ? '✅ ACTIVE' : '❌ INACTIVE'}`);
          
          if (isActive) {
            activeMembers.push(slot.currentHolder);
          }
        }
      });
      
      console.log(`\n🎯 Result: ${activeMembers.length} active members found`);
      activeMembers.forEach((memberId, i) => {
        console.log(`  ${i + 1}. ${memberId.toString()}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testUpdatedLogic();