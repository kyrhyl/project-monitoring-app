require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function listTeams() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected');
    
    const db = client.db('doctracker');
    const teams = await db.collection('teams').find({}, { projection: { name: 1, isActive: 1 } }).toArray();
    
    console.log('All teams:');
    teams.forEach(team => {
      console.log(`- ${team.name} (Active: ${team.isActive})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

listTeams();