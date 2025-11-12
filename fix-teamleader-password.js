// Script to fix teamleader password that was saved as plain text
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function fixTeamLeaderPassword() {
  const uri = 'mongodb+srv://DailyMonitoring:cherie123@my-ecommerce-db.6gfovmu.mongodb.net/test?appName=my-ecommerce-db';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('test');
    
    // Find the team leader
    const teamLeader = await db.collection('users').findOne({ 
      username: 'teamleader',
      role: 'team_leader' 
    });
    
    if (!teamLeader) {
      console.log('❌ Team leader not found');
      return;
    }
    
    console.log('✅ Found team leader:', teamLeader.username);
    console.log('Current password (first 10 chars):', teamLeader.password?.substring(0, 10) + '...');
    
    // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
    const isHashed = teamLeader.password && (teamLeader.password.startsWith('$2a$') || teamLeader.password.startsWith('$2b$'));
    
    if (isHashed) {
      console.log('✅ Password is already hashed');
      return;
    }
    
    console.log('🔧 Password appears to be plain text, fixing...');
    
    // Hash the password (assuming the last password you tried to set)
    // You can modify this to whatever password you want to set
    const newPassword = 'Cherie123@'; // Change this to the desired password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user with the properly hashed password
    const result = await db.collection('users').updateOne(
      { _id: teamLeader._id },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Password successfully hashed and updated');
      console.log('New password:', newPassword);
      console.log('You can now login with the team leader account');
    } else {
      console.log('❌ Failed to update password');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await client.close();
  }
}

console.log('🔧 Fixing Team Leader Password...');
fixTeamLeaderPassword();