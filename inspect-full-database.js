const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

async function inspectDatabase() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // Get the default database name or use the connection info
    const db = client.db(); // This will use the default database from connection string
    const dbName = db.databaseName;
    
    console.log(`🗄️  Database: ${dbName}`);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Collections:');
    
    if (collections.length === 0) {
      console.log('   No collections found');
      return;
    }
    
    for (const collection of collections) {
      console.log(`   📄 ${collection.name}`);
      
      // Count documents in each collection
      const count = await db.collection(collection.name).countDocuments();
      console.log(`      Documents: ${count}`);
      
      // If it's the projects collection, show status values
      if (collection.name === 'projects' && count > 0) {
        console.log('      🔍 Inspecting projects collection...');
        
        const statuses = await db.collection('projects').distinct('status');
        console.log(`      Status values: ${statuses.join(', ')}`);
        
        // Show each project with its status
        const projects = await db.collection('projects').find({}, { 
          projection: { name: 1, status: 1, _id: 1 } 
        }).toArray();
        
        console.log('      📋 Projects:');
        projects.forEach(project => {
          console.log(`         ${project.name}: ${project.status}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

inspectDatabase();