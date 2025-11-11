require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkDatabases() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    console.log('Connection URI:', process.env.MONGODB_URI.replace(/:[^:@]*@/, ':***@'));
    
    // List all databases
    const admin = client.db().admin();
    const databases = await admin.listDatabases();
    
    console.log('\n📁 Available databases:');
    databases.databases.forEach(db => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / (1024 * 1024)).toFixed(2)} MB)`);
    });
    
    // Check both possible database names
    const dbNames = ['doctracker', 'test'];
    
    for (const dbName of dbNames) {
      console.log(`\n🔍 Checking database: ${dbName}`);
      const db = client.db(dbName);
      
      try {
        const collections = await db.listCollections().toArray();
        console.log(`   Collections: ${collections.map(c => c.name).join(', ')}`);
        
        if (collections.find(c => c.name === 'projects')) {
          const projectCount = await db.collection('projects').countDocuments();
          console.log(`   Projects: ${projectCount}`);
          
          if (projectCount > 0) {
            const sampleProjects = await db.collection('projects').find({}).limit(2).toArray();
            sampleProjects.forEach(project => {
              console.log(`     - ${project.name || project.title || 'Unnamed'}`);
            });
          }
        }
        
        if (collections.find(c => c.name === 'tasks')) {
          const taskCount = await db.collection('tasks').countDocuments();
          console.log(`   Tasks: ${taskCount}`);
          
          if (taskCount > 0) {
            const sampleTasks = await db.collection('tasks').find({}).limit(2).toArray();
            sampleTasks.forEach(task => {
              console.log(`     - ${task.title}`);
            });
          }
        }
      } catch (error) {
        console.log(`   Error accessing ${dbName}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkDatabases();