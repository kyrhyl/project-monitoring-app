const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

// Add database name to the connection string if not present
let uri = process.env.MONGODB_URI;
if (uri && !uri.includes('/?')) {
  uri = uri.replace('/?', '/project-monitoring?');
} else if (uri && !uri.includes('/project-monitoring')) {
  uri = uri.replace('.mongodb.net/', '.mongodb.net/project-monitoring');
}

// Mapping from old status values to new ones
const statusMapping = {
  'planning': 'not-yet-started',
  'active': 'on-going', 
  'completed': 'approved',
  'on-hold': 'not-yet-started',
  'in_progress': 'on-going'
};

async function migrateStatusValues() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('test'); // Use the test database where projects are actually stored
    console.log(`Using database: test`);
    
    const collection = db.collection('projects');
    
    // Find all projects with old status values
    const projectsToUpdate = await collection.find({
      status: { $in: Object.keys(statusMapping) }
    }).toArray();
    
    console.log(`Found ${projectsToUpdate.length} projects to update`);
    
    let updatedCount = 0;
    
    for (const project of projectsToUpdate) {
      const oldStatus = project.status;
      const newStatus = statusMapping[oldStatus];
      
      if (newStatus) {
        console.log(`Updating project "${project.name}" status from "${oldStatus}" to "${newStatus}"`);
        
        await collection.updateOne(
          { _id: project._id },
          { $set: { status: newStatus } }
        );
        
        updatedCount++;
      }
    }
    
    console.log(`\n✅ Migration completed successfully!`);
    console.log(`📊 Updated ${updatedCount} projects`);
    
    // Verify the migration
    const remainingOldProjects = await collection.find({
      status: { $in: Object.keys(statusMapping) }
    }).toArray();
    
    if (remainingOldProjects.length === 0) {
      console.log('✅ All projects now have valid status values');
    } else {
      console.log(`⚠️  Warning: ${remainingOldProjects.length} projects still have old status values`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
    console.log('📡 Disconnected from MongoDB');
  }
}

migrateStatusValues();