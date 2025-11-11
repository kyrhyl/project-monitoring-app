require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

async function checkSlots() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected');
    
    const db = client.db('doctracker');
    
    // Get Building Team
    const team = await db.collection('teams').findOne({ name: 'Building Team' });
    
    if (!team) {
      console.log('Team not found');
      return;
    }
    
    console.log('Team found:', team.name);
    console.log('Member slots:', team.memberSlots?.length || 0);
    
    if (team.memberSlots && team.memberSlots.length > 0) {
      console.log('\nFirst 3 slots:');
      team.memberSlots.slice(0, 3).forEach((slot, i) => {
        console.log(`Slot ${i+1}:`, {
          hasCurrentHolder: !!slot.currentHolder,
          currentHolder: slot.currentHolder?.toString(),
          hasHistory: !!slot.history,
          historyLength: slot.history?.length || 0,
          allKeys: Object.keys(slot)
        });
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkSlots();