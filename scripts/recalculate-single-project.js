require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Define schemas
const taskSchema = new mongoose.Schema({}, { strict: false });
const projectSchema = new mongoose.Schema({}, { strict: false });

const Task = mongoose.model('Task', taskSchema);
const Project = mongoose.model('Project', projectSchema);

async function recalculateProjectDates(projectId) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get project
    const project = await Project.findById(projectId);
    if (!project) {
      console.log('Project not found');
      return;
    }
    
    console.log('\nProject:', project.name);
    console.log('Current dates:', {
      startDate: project.startDate,
      endDate: project.endDate
    });

    // Get all tasks with dates
    const tasks = await Task.find({
      projectId,
      $or: [
        { startDate: { $exists: true, $ne: null } },
        { dueDate: { $exists: true, $ne: null } }
      ]
    });

    console.log('\nTasks with dates:', tasks.length);
    tasks.forEach(t => {
      console.log(`  - ${t.title}: start=${t.startDate}, due=${t.dueDate}`);
    });

    if (tasks.length === 0) {
      console.log('\nNo tasks with dates found. Clearing project dates...');
      await Project.findByIdAndUpdate(projectId, {
        $unset: { startDate: "", endDate: "" }
      });
      console.log('Project dates cleared');
      await mongoose.connection.close();
      return;
    }

    let earliestStart = null;
    let latestEnd = null;

    tasks.forEach(task => {
      if (task.startDate) {
        const startDate = new Date(task.startDate);
        if (!earliestStart || startDate < earliestStart) {
          earliestStart = startDate;
        }
      }

      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (!latestEnd || dueDate > latestEnd) {
          latestEnd = dueDate;
        }
      }
    });

    console.log('\nCalculated dates:');
    console.log('  Start:', earliestStart);
    console.log('  End:', latestEnd);

    // Update project
    const updateData = {};
    if (earliestStart) updateData.startDate = earliestStart;
    if (latestEnd) updateData.endDate = latestEnd;

    if (Object.keys(updateData).length > 0) {
      await Project.findByIdAndUpdate(projectId, updateData);
      console.log('\n✓ Project dates updated successfully');
      
      // Verify update
      const updated = await Project.findById(projectId);
      console.log('\nVerified dates in DB:');
      console.log('  Start:', updated.startDate);
      console.log('  End:', updated.endDate);
    }

    await mongoose.connection.close();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
  }
}

// Project ID from the screenshot: B06 - MPB, Mapulo (Completion)
const projectId = '6913d9309a131ecd4f3d9c3f';
recalculateProjectDates(projectId);
