// Migration script to convert existing teams to slot-based structure
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function migrateTeamsToSlots() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('🚀 Starting team migration to slot-based structure...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db();
    const teamsCollection = db.collection('teams');
    const usersCollection = db.collection('users');
    
    console.log(`📊 Database: ${db.databaseName}`);
    
    // Get all teams that need migration
    const teams = await teamsCollection.find({
      isActive: true,
      $or: [
        { leaderSlot: { $exists: false } },
        { memberSlots: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`\n🔍 Found ${teams.length} teams to migrate`);
    
    if (teams.length === 0) {
      console.log('✅ No teams need migration');
      return;
    }
    
    const results = {
      successful: [],
      failed: []
    };
    
    for (const team of teams) {
      try {
        console.log(`\n🔄 Processing team: ${team.name}`);
        
        const updates = {
          $set: {}
        };
        
        // Migrate leader slot
        if (team.teamLeaderId && !team.leaderSlot) {
          console.log(`  📋 Migrating leader: ${team.teamLeaderId}`);
          
          updates.$set.leaderSlot = {
            currentHolder: new ObjectId(team.teamLeaderId),
            history: [{
              userId: new ObjectId(team.teamLeaderId),
              assignedAt: team.createdAt || new Date(),
              assignedBy: team.createdBy || new ObjectId()
            }]
          };
        } else if (!team.leaderSlot) {
          // Create empty leader slot
          updates.$set.leaderSlot = {
            history: []
          };
        }
        
        // Migrate member slots
        if (team.members && team.members.length > 0 && !team.memberSlots) {
          console.log(`  👥 Migrating ${team.members.length} members`);
          
          const memberSlots = team.members.map((memberId, index) => ({
            slotId: new ObjectId(),
            currentHolder: new ObjectId(memberId),
            history: [{
              userId: new ObjectId(memberId),
              assignedAt: team.createdAt || new Date(),
              assignedBy: team.createdBy || new ObjectId()
            }]
          }));
          
          updates.$set.memberSlots = memberSlots;
        } else if (!team.memberSlots) {
          // Create empty member slots array
          updates.$set.memberSlots = [];
        }
        
        // Apply updates
        if (Object.keys(updates.$set).length > 0) {
          await teamsCollection.updateOne(
            { _id: team._id },
            updates
          );
          
          console.log(`  ✅ Successfully migrated team: ${team.name}`);
          results.successful.push({
            id: team._id,
            name: team.name,
            leaderMigrated: !!team.teamLeaderId,
            membersMigrated: team.members?.length || 0
          });
        } else {
          console.log(`  ⏭️  Team already migrated: ${team.name}`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error migrating team ${team.name}:`, error.message);
        results.failed.push({
          id: team._id,
          name: team.name,
          error: error.message
        });
      }
    }
    
    // Display final results
    console.log('\n🎉 MIGRATION COMPLETED!');
    console.log('=====================');
    console.log(`📈 Total Teams: ${teams.length}`);
    console.log(`✅ Successfully Migrated: ${results.successful.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    
    if (results.successful.length > 0) {
      console.log('\n✅ SUCCESSFUL MIGRATIONS:');
      results.successful.forEach((result, index) => {
        console.log(`${index + 1}. ${result.name}`);
        console.log(`   - Leader: ${result.leaderMigrated ? 'Yes' : 'No'}`);
        console.log(`   - Members: ${result.membersMigrated}`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ FAILED MIGRATIONS:');
      results.failed.forEach((result, index) => {
        console.log(`${index + 1}. ${result.name} - ${result.error}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  migrateTeamsToSlots().catch(console.error);
}

module.exports = { migrateTeamsToSlots };