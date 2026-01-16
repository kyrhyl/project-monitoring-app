const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'team_leader', 'member'], default: 'member' },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  teamLeaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

async function checkTeamLeaderCredentials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', UserSchema);
    const Team = mongoose.model('Team', TeamSchema);

    // Find all team leaders
    const teamLeaders = await User.find({ role: 'team_leader' }).populate('teamId');
    
    if (teamLeaders.length === 0) {
      console.log('❌ No team leaders found in the database.');
      console.log('\n💡 You can create a team leader by running: node setup-team-leader.js');
    } else {
      console.log(`📋 Found ${teamLeaders.length} team leader(s):\n`);
      
      teamLeaders.forEach((leader, index) => {
        console.log(`--- Team Leader #${index + 1} ---`);
        console.log(`Username: ${leader.username}`);
        console.log(`Email: ${leader.email}`);
        console.log(`Name: ${leader.firstName} ${leader.lastName}`);
        console.log(`Team: ${leader.teamId ? leader.teamId.name : 'Not assigned'}`);
        console.log(`Active: ${leader.isActive ? 'Yes' : 'No'}`);
        console.log(`Created: ${leader.createdAt}`);
        console.log('');
      });

      console.log('⚠️  Note: Passwords are hashed and cannot be displayed.');
      console.log('   Default password from setup script is: leader123');
      console.log('   If changed, check the setup script or reset the password.\n');
    }

  } catch (error) {
    console.error('❌ Error checking credentials:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkTeamLeaderCredentials();
