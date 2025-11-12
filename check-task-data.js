const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://DailyMonitoring:cherie123@my-ecommerce-db.6gfovmu.mongodb.net/test?appName=my-ecommerce-db';

async function checkTaskData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('test');
    
    // Check task counts
    const totalTasks = await db.collection('tasks').countDocuments();
    const tasksWithDueDates = await db.collection('tasks').countDocuments({ 
      dueDate: { $exists: true, $ne: null } 
    });
    const ongoingTasks = await db.collection('tasks').countDocuments({ 
      status: { $in: ['todo', 'in-progress'] } 
    });
    
    console.log(`Total tasks: ${totalTasks}`);
    console.log(`Tasks with due dates: ${tasksWithDueDates}`);
    console.log(`Ongoing tasks: ${ongoingTasks}`);
    
    // Sample tasks
    if (totalTasks > 0) {
      const sampleTasks = await db.collection('tasks').find({}).limit(3).toArray();
      console.log('\nSample tasks:');
      sampleTasks.forEach((task, i) => {
        console.log(`${i+1}. ${task.title || 'No title'}`);
        console.log(`   Status: ${task.status || 'No status'}`);
        console.log(`   Due Date: ${task.dueDate ? task.dueDate.toDateString() : 'No due date'}`);
        console.log(`   Project ID: ${task.projectId || 'No project'}`);
        console.log(`   Assignee: ${task.assigneeId || task.assigneeName || 'No assignee'}`);
        console.log('');
      });
    } else {
      console.log('\nNo tasks found in database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkTaskData();