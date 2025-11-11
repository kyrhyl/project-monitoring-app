const mongoose = require('mongoose');
const path = require('path');

async function listAllDatabases() {
  try {
    require('dotenv').config({ path: path.join(__dirname, '.env.local') });
    
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.log('❌ MONGODB_URI not found');
      return;
    }

    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected successfully!');

    // Get admin database to list all databases
    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.listDatabases();
    
    console.log('\n📊 Available Databases on this Atlas Cluster:');
    console.log('=' .repeat(50));
    
    for (const db of result.databases) {
      console.log(`\n📂 Database: ${db.name}`);
      console.log(`   Size: ${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Empty: ${db.empty ? 'Yes' : 'No'}`);
      
      if (!db.empty) {
        // Connect to this database and list collections
        const tempConnection = await mongoose.createConnection(MONGODB_URI.replace('/project-monitoring?', `/${db.name}?`));
        const collections = await tempConnection.db.listCollections().toArray();
        console.log(`   Collections (${collections.length}):`);
        
        for (const col of collections) {
          const count = await tempConnection.db.collection(col.name).countDocuments();
          console.log(`     - ${col.name}: ${count} documents`);
        }
        
        await tempConnection.close();
      }
    }
    
    console.log('\n✨ Database listing complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

listAllDatabases();