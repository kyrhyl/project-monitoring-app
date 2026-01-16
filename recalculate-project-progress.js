const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

const TaskSchema = new mongoose.Schema({
  projectId: mongoose.Schema.Types.ObjectId,
  status: String
}, { timestamps: true });

const ProjectSchema = new mongoose.Schema({
  name: String,
  progress: Number
}, { timestamps: true });

async function recalculateAllProgress() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
    const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

    const projects = await Project.find({}).lean();
    
    console.log(`📊 Found ${projects.length} projects to recalculate\n`);

    let updated = 0;
    
    for (const project of projects) {
      const tasks = await Task.find({ projectId: project._id }).lean();
      
      let newProgress = 0;
      if (tasks.length > 0) {
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        newProgress = Math.round((completedTasks / tasks.length) * 100);
      }

      const oldProgress = project.progress || 0;

      if (oldProgress !== newProgress) {
        await Project.findByIdAndUpdate(project._id, { progress: newProgress });
        console.log(`✓ ${project.name}: ${oldProgress}% → ${newProgress}% (${tasks.filter(t => t.status === 'completed').length}/${tasks.length} tasks)`);
        updated++;
      } else {
        console.log(`- ${project.name}: ${newProgress}% (no change)`);
      }
    }

    console.log(`\n✅ Recalculation complete!`);
    console.log(`   Total projects: ${projects.length}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Unchanged: ${projects.length - updated}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

recalculateAllProgress();
