require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function debugTaskProjectRelation() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db('test'); // Using the test database where data is
    
    // Check tasks that exist
    console.log('\n=== TASKS ===');
    const tasks = await db.collection('tasks').find({}).toArray();
    console.log(`Total tasks: ${tasks.length}`);
    
    if (tasks.length > 0) {
      console.log('\nTask details:');
      tasks.forEach(task => {
        console.log(`- ${task.title}`);
        console.log(`  Status: ${task.status}`);
        console.log(`  Assignee: ${task.assigneeId}`);
        console.log(`  Project: ${task.projectId}`);
        console.log(`  Created: ${task.createdAt}`);
        console.log('---');
      });
    }
    
    // Check projects that exist
    console.log('\n=== PROJECTS ===');
    const projects = await db.collection('projects').find({}).toArray();
    console.log(`Total projects: ${projects.length}`);
    
    if (projects.length > 0) {
      console.log('\nProject details:');
      projects.forEach(project => {
        console.log(`- ${project.name}`);
        console.log(`  ID: ${project._id}`);
        console.log(`  Team: ${project.teamId}`);
        console.log(`  Created by: ${project.createdBy}`);
        console.log(`  Assigned members: ${project.assignedMembers || 'None'}`);
        console.log(`  Status: ${project.status}`);
        console.log(`  Active: ${project.isActive}`);
        console.log('---');
      });
    }
    
    // Check teams and their members
    console.log('\n=== TEAMS ===');
    const teams = await db.collection('teams').find({ isActive: true }).toArray();
    teams.forEach(team => {
      console.log(`Team: ${team.name}`);
      console.log(`  ID: ${team._id}`);
      console.log(`  Member slots: ${team.memberSlots?.length || 0}`);
      console.log('---');
    });
    
    // Check relationship between tasks and projects
    if (tasks.length > 0 && projects.length > 0) {
      console.log('\n=== TASK-PROJECT RELATIONSHIPS ===');
      tasks.forEach(task => {
        const relatedProject = projects.find(p => p._id.toString() === task.projectId?.toString());
        console.log(`Task "${task.title}":`);
        console.log(`  References project ID: ${task.projectId}`);
        console.log(`  Related project: ${relatedProject ? relatedProject.name : 'NOT FOUND'}`);
        if (relatedProject) {
          console.log(`  Project team: ${relatedProject.teamId}`);
          console.log(`  Project active: ${relatedProject.isActive}`);
          console.log(`  Assignee ${task.assigneeId} in assigned members: ${relatedProject.assignedMembers?.includes(task.assigneeId) ? 'YES' : 'NO'}`);
        }
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugTaskProjectRelation();