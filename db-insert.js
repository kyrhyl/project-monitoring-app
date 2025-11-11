// Direct MongoDB insertion script
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Import models
const User = require('./src/models/User');
const Team = require('./src/models/Team');

const users = [
  {
    firstName: "Danielle",
    lastName: "Macabata", 
    username: "danielle_macabata",
    password: "member123",
    role: "member",
    teamName: "Building Team"
  },
  {
    firstName: "Aldwin",
    lastName: "Villafranca",
    username: "aldwin_villafranca", 
    password: "member124",
    role: "member",
    teamName: "Building Team"
  },
  {
    firstName: "Eriksonn",
    lastName: "Dagawasan",
    username: "eriksonn_dagawasan",
    password: "member125", 
    role: "member",
    teamName: "Building Team"
  },
  {
    firstName: "Jessylin",
    lastName: "Tandugon",
    username: "jessylin_tandugon",
    password: "member126",
    role: "member", 
    teamName: "Building Team"
  },
  {
    firstName: "Joema Carlo",
    lastName: "Luzares",
    username: "joema_lusares",
    password: "member127",
    role: "member",
    teamName: "Building Team"
  },
  {
    firstName: "Nicole", 
    lastName: "Magsongsong",
    username: "nicole_masongsong",
    password: "member128",
    role: "member",
    teamName: "Building Team"
  },
  {
    firstName: "Mari Lynette",
    lastName: "Maiza", 
    username: "maria_maiza",
    password: "member129",
    role: "member",
    teamName: "Building Team"
  },
  {
    firstName: "Dane Dover",
    lastName: "Cortez",
    username: "dane_cortez",
    password: "member130",
    role: "member",
    teamName: "Building Team"
  },
  {
    firstName: "Frankline",
    lastName: "Madale",
    username: "franklin_madale", 
    password: "member131",
    role: "member",
    teamName: "Building Team"
  },
  {
    firstName: "Ian",
    lastName: "Tagaan",
    username: "ian_tagaan",
    password: "member132",
    role: "member",
    teamName: "Building Team"
  },
  {
    firstName: "Kassandra Fiona",
    lastName: "Manga",
    username: "kassandra_manga",
    password: "member133", 
    role: "member",
    teamName: "Building Team"
  }
];

async function insertUsersDirectly() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find or create Building Team
    console.log('🏗️ Setting up Building Team...');
    let team = await Team.findOne({ name: 'Building Team' });
    
    if (!team) {
      team = new Team({
        name: 'Building Team',
        description: 'Team for building and construction projects',
        isActive: true
      });
      await team.save();
      console.log('✅ Created "Building Team"');
    } else {
      console.log('✅ Found existing "Building Team"');
    }
    
    console.log('👥 Inserting users...\n');
    
    const results = {
      successful: [],
      failed: []
    };
    
    for (const userData of users) {
      try {
        // Check if user exists
        const existingUser = await User.findOne({ username: userData.username });
        if (existingUser) {
          results.failed.push({
            userData,
            error: `Username '${userData.username}' already exists`
          });
          continue;
        }
        
        // Create user
        const user = new User({
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: userData.username,
          password: userData.password,
          role: userData.role,
          teamId: team._id,
          isActive: true
        });
        
        await user.save();
        results.successful.push({
          userData,
          createdUser: user
        });
        
        console.log(`✅ Created: ${userData.firstName} ${userData.lastName} (${userData.username})`);
        
      } catch (error) {
        results.failed.push({
          userData,
          error: error.message
        });
        console.log(`❌ Failed: ${userData.username} - ${error.message}`);
      }
    }
    
    // Update team members
    if (results.successful.length > 0) {
      const userIds = results.successful.map(r => r.createdUser._id);
      await Team.findByIdAndUpdate(team._id, {
        $addToSet: { members: { $each: userIds } }
      });
      console.log(`\n✅ Added ${results.successful.length} users to Building Team`);
    }
    
    console.log('\n🎉 BULK IMPORT COMPLETED!');
    console.log('==========================');
    console.log(`📈 Total Users: ${users.length}`);
    console.log(`✅ Successful: ${results.successful.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    
    if (results.failed.length > 0) {
      console.log('\n❌ FAILED IMPORTS:');
      results.failed.forEach((fail, index) => {
        console.log(`${index + 1}. ${fail.userData.username}: ${fail.error}`);
      });
    }
    
    console.log('\n🌐 Visit http://localhost:3000/admin to view the users');
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

insertUsersDirectly();