// Fix database email constraint issues
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function fixEmailConstraint() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('🚀 Connecting to MongoDB Atlas...');
    await client.connect();
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    console.log(`📊 Database: ${db.databaseName}`);
    
    // 1. Check existing users
    const existingUsers = await usersCollection.find({}).toArray();
    console.log(`👥 Found ${existingUsers.length} existing users`);
    
    if (existingUsers.length > 0) {
      console.log('Sample user structure:');
      console.log(JSON.stringify(existingUsers[0], null, 2));
    }
    
    // 2. Check for users with null/undefined email
    const nullEmailUsers = await usersCollection.find({ 
      $or: [
        { email: null }, 
        { email: undefined },
        { email: { $exists: false } }
      ] 
    }).toArray();
    console.log(`📧 Users with null/missing email: ${nullEmailUsers.length}`);
    
    // 3. Check indexes
    const indexes = await usersCollection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. Name: ${index.name}, Keys: ${JSON.stringify(index.key)}`);
    });
    
    // 4. Try to drop the email index if it exists
    const emailIndex = indexes.find(idx => idx.name === 'email_1');
    if (emailIndex) {
      try {
        console.log('\n🔧 Dropping email_1 index...');
        await usersCollection.dropIndex('email_1');
        console.log('✅ Successfully dropped email_1 index');
      } catch (error) {
        console.log(`❌ Could not drop email_1 index: ${error.message}`);
      }
    } else {
      console.log('\n⚠️  No email_1 index found');
    }
    
    // 5. Remove email field from ALL existing users to clean up
    console.log('\n🔧 Removing email field from all existing users...');
    const updateResult = await usersCollection.updateMany(
      {},
      { $unset: { email: 1 } }
    );
    console.log(`✅ Removed email field from ${updateResult.modifiedCount} users`);
    
    // 6. Verify cleanup
    const afterCleanup = await usersCollection.find({ email: { $exists: true } }).count();
    console.log(`📧 Users with email field after cleanup: ${afterCleanup}`);
    
    console.log('\n✅ Database cleanup completed!');
    console.log('🎯 You can now run inject-users.js successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB Atlas');
  }
}

fixEmailConstraint().catch(console.error);