const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔗 Testing MongoDB Atlas Connection...');
console.log('URI:', MONGODB_URI ? `${MONGODB_URI.substring(0, 20)}...` : 'NOT FOUND');

async function testConnection() {
  try {
    console.log('\n⏳ Attempting to connect...');
    
    // Connect with timeout
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });

    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test basic operations
    const connection = mongoose.connection;
    const dbName = connection.db?.databaseName;
    
    console.log(`📊 Database: ${dbName}`);
    console.log(`🌐 Host: ${connection.host}:${connection.port}`);
    console.log(`📈 Ready State: ${connection.readyState} (1 = connected)`);
    
    // List collections
    const collections = await connection.db?.listCollections().toArray();
    console.log(`📁 Collections found: ${collections?.length || 0}`);
    
    if (collections && collections.length > 0) {
      console.log('   Collections:', collections.map(c => c.name).join(', '));
    }
    
    // Test a simple operation (count documents in any collection)
    if (collections && collections.length > 0) {
      for (const col of collections.slice(0, 3)) { // Check first 3 collections
        try {
          const count = await connection.db?.collection(col.name).countDocuments();
          console.log(`   📄 ${col.name}: ${count} documents`);
        } catch (err) {
          console.log(`   ⚠️  ${col.name}: Could not count documents`);
        }
      }
    }

    console.log('\n🎉 Connection test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('\n🔍 Possible causes:');
      console.error('   - Network connectivity issues');
      console.error('   - Firewall blocking connection');
      console.error('   - IP address not whitelisted in MongoDB Atlas');
      console.error('   - Incorrect connection string');
      console.error('   - Database cluster is paused/unavailable');
    } else if (error.name === 'MongoParseError') {
      console.error('\n🔍 Connection string format issue');
      console.error('   - Check username, password, and cluster URL');
    }
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

testConnection();