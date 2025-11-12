const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

async function checkProjectStatuses() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('project-monitoring');
    const collection = db.collection('projects');
    
    // Get all unique status values
    const statuses = await collection.distinct('status');
    console.log('\n📊 Current status values in database:', statuses);
    
    // Get count of projects for each status
    for (const status of statuses) {
      const count = await collection.countDocuments({ status });
      console.log(`   ${status}: ${count} projects`);
    }
    
    // Get all projects with their status and name for debugging
    console.log('\n📋 All projects:');
    const projects = await collection.find({}, { 
      projection: { name: 1, status: 1, _id: 1 } 
    }).toArray();
    
    projects.forEach(project => {
      console.log(`   ${project.name}: ${project.status} (${project._id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

checkProjectStatuses();