require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function comprehensiveDataScan() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    // List all databases
    const admin = client.db().admin();
    const databases = await admin.listDatabases();
    
    console.log('\n🔍 SCANNING ALL DATABASES FOR PROJECT/TASK DATA...\n');
    
    for (const dbInfo of databases.databases) {
      const dbName = dbInfo.name;
      console.log(`📁 Database: ${dbName} (${(dbInfo.sizeOnDisk / (1024 * 1024)).toFixed(2)} MB)`);
      
      try {
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        
        for (const collection of collections) {
          const collName = collection.name;
          
          // Check for projects
          if (collName === 'projects') {
            const projectCount = await db.collection('projects').countDocuments();
            console.log(`  📊 Projects: ${projectCount}`);
            
            if (projectCount > 0) {
              const projects = await db.collection('projects').find({}).limit(5).toArray();
              projects.forEach(p => {
                console.log(`    - ${p.name || p.title || 'Unnamed'} (${p.status || 'No status'})`);
                console.log(`      ID: ${p._id}, Created: ${p.createdAt}, Team: ${p.teamId}`);
              });
            }
          }
          
          // Check for tasks
          if (collName === 'tasks') {
            const taskCount = await db.collection('tasks').countDocuments();
            console.log(`  📋 Tasks: ${taskCount}`);
            
            if (taskCount > 0) {
              const tasks = await db.collection('tasks').find({}).limit(5).toArray();
              tasks.forEach(t => {
                console.log(`    - ${t.title || 'Unnamed'} (${t.status || 'No status'})`);
                console.log(`      ID: ${t._id}, Assignee: ${t.assigneeId}, Project: ${t.projectId}`);
              });
            }
          }
          
          // Check for any collection that might have task/project-like data
          if (['todos', 'assignments', 'workitems', 'activities'].includes(collName)) {
            const count = await db.collection(collName).countDocuments();
            if (count > 0) {
              console.log(`  ⚠️ Found ${count} documents in ${collName} collection`);
            }
          }
        }
        
      } catch (error) {
        console.log(`    ❌ Error accessing ${dbName}: ${error.message}`);
      }
      
      console.log(''); // Empty line between databases
    }
    
    // Also check what database the app actually connects to
    console.log('\n🔍 TESTING APP DATABASE CONNECTION...');
    const defaultDb = client.db(); // This uses the default from connection string
    console.log(`Default database name: ${defaultDb.databaseName}`);
    
    const appCollections = await defaultDb.listCollections().toArray();
    console.log(`Default DB collections: ${appCollections.map(c => c.name).join(', ')}`);
    
    if (appCollections.find(c => c.name === 'projects')) {
      const appProjects = await defaultDb.collection('projects').countDocuments();
      console.log(`Default DB projects: ${appProjects}`);
    }
    
    if (appCollections.find(c => c.name === 'tasks')) {
      const appTasks = await defaultDb.collection('tasks').countDocuments();
      console.log(`Default DB tasks: ${appTasks}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

comprehensiveDataScan();