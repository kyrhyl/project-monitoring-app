require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function debugSlotStructure() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('doctracker');
    const teams = db.collection('teams');
    
    // Get the Building Team and examine its exact structure
    const buildingTeam = await teams.findOne({ name: 'Building Team' });
    
    if (buildingTeam) {
      console.log('\n=== BUILDING TEAM STRUCTURE ===');
      console.log('Team Name:', buildingTeam.name);
      console.log('Member Slots Count:', buildingTeam.memberSlots?.length || 0);
      
      if (buildingTeam.memberSlots && buildingTeam.memberSlots.length > 0) {
        console.log('\n=== FIRST MEMBER SLOT DETAILED ===');
        const firstSlot = buildingTeam.memberSlots[0];
        console.log('Full slot structure:');
        console.log(JSON.stringify(firstSlot, null, 2));
        
        console.log('\n=== ALL SLOT PROPERTIES ===');
        buildingTeam.memberSlots.forEach((slot, index) => {
          console.log(`Slot ${index + 1}:`);
          console.log(`  slotId: ${slot.slotId}`);
          console.log(`  currentHolder: ${slot.currentHolder}`);
          console.log(`  history length: ${slot.history?.length || 0}`);
          
          if (slot.history && slot.history.length > 0) {
            console.log(`  Latest history entry:`);
            const latest = slot.history[slot.history.length - 1];
            console.log(`    userId: ${latest.userId}`);
            console.log(`    assignedAt: ${latest.assignedAt}`);
            console.log(`    unassignedAt: ${latest.unassignedAt}`);
            console.log(`    assignedBy: ${latest.assignedBy}`);
          }
          
          // Check for any endDate property
          if (slot.endDate !== undefined) {
            console.log(`  endDate: ${slot.endDate}`);
          }
          
          console.log(`  All properties: ${Object.keys(slot).join(', ')}`);
          console.log('---');
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

debugSlotStructure();