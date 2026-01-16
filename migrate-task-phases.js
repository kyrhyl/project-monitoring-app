// Migration script to add phase and startDate to existing tasks
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'your_mongodb_connection_string';

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: String,
  priority: String,
  phase: String,
  projectId: mongoose.Schema.Types.ObjectId,
  assigneeId: mongoose.Schema.Types.ObjectId,
  assigneeName: String,
  startDate: Date,
  dueDate: Date,
  estimatedHours: Number,
  actualHours: Number,
  createdBy: mongoose.Schema.Types.ObjectId,
}, {
  timestamps: true
});

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

async function migrateTaskPhases() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    // Find all tasks without a phase field
    const tasksWithoutPhase = await Task.find({
      $or: [
        { phase: { $exists: false } },
        { phase: null }
      ]
    });

    console.log(`Found ${tasksWithoutPhase.length} tasks without phase field`);

    let updated = 0;
    
    for (const task of tasksWithoutPhase) {
      let phase = 'other'; // default phase
      
      // Try to infer phase from title (case-insensitive)
      const title = task.title.toLowerCase();
      
      if (title.includes('architectural') || title.includes('design') || title.includes('concept')) {
        phase = 'architectural';
      } else if (title.includes('structural') || title.includes('electrical') || title.includes('mechanical') || title.includes('hvac') || title.includes('plumbing')) {
        phase = 'structural';
      } else if (title.includes('final plan') || title.includes('as-built') || title.includes('drawing')) {
        phase = 'final-plan';
      } else if (title.includes('estimate') || title.includes('cost') || title.includes('budget') || title.includes('boq')) {
        phase = 'final-estimate';
      } else if (title.includes('check') || title.includes('review') || title.includes('inspection') || title.includes('quality')) {
        phase = 'checking';
      }
      
      // Set startDate to 7 days before dueDate if dueDate exists and startDate doesn't
      let startDate = task.startDate;
      if (!startDate && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        startDate = new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days before
      }
      
      await Task.updateOne(
        { _id: task._id },
        { 
          $set: { 
            phase,
            ...(startDate && { startDate })
          } 
        }
      );
      
      updated++;
      console.log(`Updated task ${task._id}: "${task.title}" -> phase: ${phase}`);
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Total tasks updated: ${updated}`);
    console.log(`   - architectural: ${await Task.countDocuments({ phase: 'architectural' })}`);
    console.log(`   - structural: ${await Task.countDocuments({ phase: 'structural' })}`);
    console.log(`   - final-plan: ${await Task.countDocuments({ phase: 'final-plan' })}`);
    console.log(`   - final-estimate: ${await Task.countDocuments({ phase: 'final-estimate' })}`);
    console.log(`   - checking: ${await Task.countDocuments({ phase: 'checking' })}`);
    console.log(`   - other: ${await Task.countDocuments({ phase: 'other' })}`);

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the migration
migrateTaskPhases();
