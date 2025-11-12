const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://kyrhyl:XQVZ5XHZ78QJoJBR@cluster0.7ubyj.mongodb.net/test';

// Project schema (minimal for this operation)
const projectSchema = new mongoose.Schema({
  name: String,
  startDate: Date,
  endDate: Date,
}, { collection: 'projects' });

const Project = mongoose.model('Project', projectSchema);

async function clearProjectDates() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully');

    // Count projects with dates before clearing
    const projectsWithStartDate = await Project.countDocuments({ startDate: { $ne: null } });
    const projectsWithEndDate = await Project.countDocuments({ endDate: { $ne: null } });
    
    console.log(`\nBefore clearing:`);
    console.log(`- Projects with startDate: ${projectsWithStartDate}`);
    console.log(`- Projects with endDate: ${projectsWithEndDate}`);

    // Clear all startDate and endDate fields
    const result = await Project.updateMany(
      {}, // Match all documents
      {
        $unset: {
          startDate: '',
          endDate: ''
        }
      }
    );

    console.log(`\nClearing operation completed:`);
    console.log(`- Documents matched: ${result.matchedCount}`);
    console.log(`- Documents modified: ${result.modifiedCount}`);

    // Verify the clearing
    const remainingStartDates = await Project.countDocuments({ startDate: { $exists: true } });
    const remainingEndDates = await Project.countDocuments({ endDate: { $exists: true } });
    
    console.log(`\nAfter clearing:`);
    console.log(`- Projects with startDate: ${remainingStartDates}`);
    console.log(`- Projects with endDate: ${remainingEndDates}`);

    // Show sample of cleared projects
    const sampleProjects = await Project.find({}, { 
      name: 1, 
      startDate: 1, 
      endDate: 1 
    }).limit(5);
    
    console.log(`\nSample projects after clearing:`);
    sampleProjects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name}`);
      console.log(`   startDate: ${project.startDate || 'undefined'}`);
      console.log(`   endDate: ${project.endDate || 'undefined'}`);
    });

  } catch (error) {
    console.error('Error clearing project dates:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnection closed');
  }
}

// Run the script
clearProjectDates();