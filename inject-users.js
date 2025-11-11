// Direct MongoDB Atlas injection script
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Your user data
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

async function injectUsersDirectly() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('🚀 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db(); // Uses the database from the URI
    const usersCollection = db.collection('users');
    const teamsCollection = db.collection('teams');
    
    console.log(`📊 Database: ${db.databaseName}`);
    
    // 1. Create or find Building Team
    console.log('🏗️ Setting up Building Team...');
    let team = await teamsCollection.findOne({ name: 'Building Team' });
    
    if (!team) {
      const teamDoc = {
        _id: new ObjectId(),
        name: 'Building Team',
        description: 'Team for building and construction projects',
        isActive: true,
        members: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await teamsCollection.insertOne(teamDoc);
      team = teamDoc;
      console.log('✅ Created "Building Team"');
    } else {
      console.log('✅ Found existing "Building Team"');
    }
    
    console.log(`📁 Team ID: ${team._id}`);
    
    // 2. Process each user
    console.log('👥 Processing users...\n');
    
    const results = {
      successful: [],
      failed: [],
      skipped: []
    };
    
    for (const userData of users) {
      try {
        console.log(`🔄 Processing: ${userData.firstName} ${userData.lastName} (${userData.username})`);
        
        // Check if user already exists
        const existingUser = await usersCollection.findOne({ username: userData.username });
        if (existingUser) {
          console.log(`⚠️  User ${userData.username} already exists - skipping`);
          results.skipped.push({
            username: userData.username,
            reason: 'User already exists'
          });
          continue;
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        // Create user document
        const userDoc = {
          _id: new ObjectId(),
          username: userData.username,
          password: hashedPassword,
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          teamId: team._id,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
          // Note: Not including email field to avoid null constraint issues
        };
        
        // Insert user
        const insertResult = await usersCollection.insertOne(userDoc);
        
        if (insertResult.acknowledged) {
          console.log(`✅ Created user: ${userData.firstName} ${userData.lastName}`);
          results.successful.push({
            username: userData.username,
            id: insertResult.insertedId,
            name: `${userData.firstName} ${userData.lastName}`
          });
        }
        
      } catch (error) {
        console.log(`❌ Failed to create ${userData.username}: ${error.message}`);
        results.failed.push({
          username: userData.username,
          error: error.message
        });
      }
    }
    
    // 3. Update team with member IDs
    if (results.successful.length > 0) {
      console.log(`\n🔄 Updating team membership...`);
      
      const userIds = results.successful.map(user => user.id);
      await teamsCollection.updateOne(
        { _id: team._id },
        { 
          $addToSet: { members: { $each: userIds } },
          $set: { updatedAt: new Date() }
        }
      );
      
      console.log(`✅ Added ${results.successful.length} users to Building Team`);
    }
    
    // 4. Display final results
    console.log('\n🎉 DIRECT INJECTION COMPLETED!');
    console.log('================================');
    console.log(`📈 Total Users: ${users.length}`);
    console.log(`✅ Successfully Created: ${results.successful.length}`);
    console.log(`⚠️  Skipped (Already Exist): ${results.skipped.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    
    if (results.successful.length > 0) {
      console.log('\n✅ SUCCESSFULLY CREATED:');
      results.successful.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.username})`);
      });
    }
    
    if (results.skipped.length > 0) {
      console.log('\n⚠️  SKIPPED USERS:');
      results.skipped.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} - ${user.reason}`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ FAILED USERS:');
      results.failed.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} - ${user.error}`);
      });
    }
    
    console.log('\n🌐 Visit http://localhost:3000/admin to view the users');
    console.log('🔑 Users can log in with their specified passwords');
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB Atlas');
  }
}

// Run the injection
injectUsersDirectly().catch(console.error);