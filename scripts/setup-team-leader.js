const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define schemas directly here
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

async function setupTeamLeader() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', UserSchema);
    const Team = mongoose.model('Team', TeamSchema);

    // Create a team first
    let team = await Team.findOne({ name: 'Development Team' });
    if (!team) {
      team = await Team.create({
        name: 'Development Team',
        description: 'Main development team for projects'
      });
      console.log('Created Development Team');
    }

    // Create team leader user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('leader123', 10);

    const existingLeader = await User.findOne({ username: 'teamleader' });
    if (existingLeader) {
      console.log('Team leader already exists');
      return;
    }

    const teamLeader = await User.create({
      username: 'teamleader',
      email: 'leader@example.com',
      password: hashedPassword,
      firstName: 'Team',
      lastName: 'Leader',
      role: 'team_leader',
      teamId: team._id
    });

    // Update team with team leader
    await Team.findByIdAndUpdate(team._id, {
      teamLeaderId: teamLeader._id,
      members: [teamLeader._id]
    });

    console.log('Team leader created successfully!');
    console.log('Username: teamleader');
    console.log('Password: leader123');
    console.log('Team:', team.name);

  } catch (error) {
    console.error('Error setting up team leader:', error);
  } finally {
    await mongoose.disconnect();
  }
}

setupTeamLeader();