require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function clearProjectsAndTasks() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db('test'); // Use 'test' database where the data actually is
    
    // Check current counts before deletion
    const projectCount = await db.collection('projects').countDocuments();
    const taskCount = await db.collection('tasks').countDocuments();
    
    console.log(`\n📊 Current data:`);
    console.log(`   Projects: ${projectCount}`);
    console.log(`   Tasks: ${taskCount}`);
    
    if (projectCount === 0 && taskCount === 0) {
      console.log('✨ Database is already clean!');
      return;
    }
    
    console.log('\n🧹 Clearing data...');
    
    // Delete all tasks first (they reference projects)
    const taskResult = await db.collection('tasks').deleteMany({});
    console.log(`✅ Deleted ${taskResult.deletedCount} tasks`);
    
    // Delete all projects
    const projectResult = await db.collection('projects').deleteMany({});
    console.log(`✅ Deleted ${projectResult.deletedCount} projects`);
    
    // Also clear project references from teams (optional - clean up team.projects arrays)
    const teamUpdateResult = await db.collection('teams').updateMany(
      {},
      { $set: { projects: [] } }
    );
    console.log(`✅ Cleared project references from ${teamUpdateResult.modifiedCount} teams`);
    
    console.log('\n🎉 Database cleaned successfully!');
    console.log('   - All projects removed');
    console.log('   - All tasks removed');
    console.log('   - Team project references cleared');
    console.log('   - Users and teams preserved');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

clearProjectsAndTasks();