const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Team schema with slots
const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  
  // Leader slot - single position
  leaderSlot: {
    currentHolder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    history: [{
      holder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      startDate: { type: Date, required: true },
      endDate: { type: Date },
      reason: { type: String, default: 'Assignment' }
    }]
  },
  
  // Member slots - multiple positions
  memberSlots: [{
    currentHolder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    slotNumber: { type: Number, required: true },
    history: [{
      holder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      startDate: { type: Date, required: true },
      endDate: { type: Date },
      reason: { type: String, default: 'Assignment' }
    }]
  }],
  
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

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

async function debugTeamData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Team = mongoose.model('Team', TeamSchema);
    const User = mongoose.model('User', UserSchema);

    // Find all teams
    console.log('\n=== ALL TEAMS ===');
    const allTeams = await Team.find({}).populate('leaderSlot.currentHolder', 'username email').lean();
    allTeams.forEach(team => {
      console.log(`Team: ${team.name}`);
      console.log(`Leader: ${team.leaderSlot?.currentHolder?.username || 'None'}`);
      console.log(`Member slots: ${team.memberSlots?.length || 0}`);
      console.log(`Active members: ${team.memberSlots?.filter(slot => slot.currentHolder && !slot.endDate).length || 0}`);
      console.log('---');
    });

    // Find all users with team_leader role
    console.log('\n=== TEAM LEADERS ===');
    const teamLeaders = await User.find({ role: 'team_leader' }).lean();
    teamLeaders.forEach(leader => {
      console.log(`Leader: ${leader.username} (${leader.firstName} ${leader.lastName})`);
      console.log(`Email: ${leader.email}`);
      console.log(`ID: ${leader._id}`);
      console.log('---');
    });

    // Check which team each leader leads
    for (const leader of teamLeaders) {
      console.log(`\n=== TEAM FOR LEADER: ${leader.username} ===`);
      const leaderTeam = await Team.findOne({
        'leaderSlot.currentHolder': leader._id,
        isActive: true
      }).populate('leaderSlot.currentHolder', 'username').lean();

      if (leaderTeam) {
        console.log(`Found team: ${leaderTeam.name}`);
        console.log(`Member slots: ${leaderTeam.memberSlots?.length || 0}`);
        
        // Get active members
        const activeMembers = leaderTeam.memberSlots?.filter(slot => 
          slot.currentHolder && slot.endDate === null
        ) || [];
        
        console.log(`Active members: ${activeMembers.length}`);
        
        // Debug: Show all slots
        console.log('\nAll member slots:');
        leaderTeam.memberSlots?.forEach((slot, index) => {
          console.log(`  Slot ${index + 1}:`);
          console.log(`    currentHolder: ${slot.currentHolder}`);
          console.log(`    endDate: ${slot.endDate}`);
          console.log(`    startDate: ${slot.startDate}`);
        });
        
        if (activeMembers.length > 0) {
          console.log('Active member IDs:');
          activeMembers.forEach((slot, index) => {
            console.log(`  ${index + 1}. ${slot.currentHolder}`);
          });

          // Get member details
          const memberIds = activeMembers.map(slot => slot.currentHolder);
          const memberDetails = await User.find({
            _id: { $in: memberIds },
            isActive: true
          }).select('_id username firstName lastName email').lean();

          console.log('Member details:');
          memberDetails.forEach(member => {
            console.log(`  - ${member.username} (${member.firstName} ${member.lastName})`);
          });
        }
      } else {
        console.log('No team found for this leader');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugTeamData();