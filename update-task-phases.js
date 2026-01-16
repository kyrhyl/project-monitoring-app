const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

async function updateTaskPhases() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const tasksCollection = db.collection('tasks');

    // Find all tasks without a phase field or with null/empty phase
    const tasksWithoutPhase = await tasksCollection.find({
      $or: [
        { phase: { $exists: false } },
        { phase: null },
        { phase: '' }
      ]
    }).toArray();

    console.log(`\n📊 Found ${tasksWithoutPhase.length} tasks without phase field`);

    if (tasksWithoutPhase.length > 0) {
      // Update all tasks without phase to 'other'
      const result = await tasksCollection.updateMany(
        {
          $or: [
            { phase: { $exists: false } },
            { phase: null },
            { phase: '' }
          ]
        },
        {
          $set: { phase: 'other' }
        }
      );

      console.log(`✅ Updated ${result.modifiedCount} tasks with default phase 'other'`);
    } else {
      console.log('✅ All tasks already have a phase field');
    }

    // Show summary
    const allTasks = await tasksCollection.find({}).toArray();
    const phaseCount = {};
    
    for (const task of allTasks) {
      const phase = task.phase || 'undefined';
      phaseCount[phase] = (phaseCount[phase] || 0) + 1;
    }

    console.log('\n📈 Tasks by Phase:');
    Object.entries(phaseCount).forEach(([phase, count]) => {
      console.log(`  ${phase}: ${count}`);
    });

    console.log(`\n✅ Total tasks: ${allTasks.length}`);
    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

updateTaskPhases();
