const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb+srv://DailyMonitoring:cherie123@my-ecommerce-db.6gfovmu.mongodb.net/test?appName=my-ecommerce-db';

async function addSampleTasks() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('test');
    const tasksCollection = db.collection('tasks');
    const projectsCollection = db.collection('projects');
    const usersCollection = db.collection('users');
    
    // Get some projects and users for task assignment
    const projects = await projectsCollection.find({}).limit(5).toArray();
    const users = await usersCollection.find({}).limit(3).toArray();
    
    if (projects.length === 0 || users.length === 0) {
      console.log('No projects or users found. Please create some first.');
      return;
    }
    
    const today = new Date();
    
    // Sample tasks with due dates
    const sampleTasks = [
      {
        title: 'Prepare and Estimate Materials',
        description: 'Complete material estimation and procurement planning for construction project',
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        progress: 65,
        projectId: new ObjectId(projects[0]._id),
        assignedTo: new ObjectId(users[0]._id),
        createdBy: new ObjectId(users[0]._id),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Prepare Architectural Plans',
        description: 'Finalize architectural drawings and blueprints for project approval',
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        progress: 40,
        projectId: new ObjectId(projects[1]._id),
        assignedTo: new ObjectId(users[1]._id),
        createdBy: new ObjectId(users[0]._id),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Program of Works Planning',
        description: 'Develop detailed work program and timeline for project execution',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        progress: 0,
        projectId: new ObjectId(projects[2]._id),
        assignedTo: new ObjectId(users[2]._id),
        createdBy: new ObjectId(users[0]._id),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Site Survey and Analysis',
        description: 'Conduct comprehensive site survey and soil analysis',
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        progress: 75,
        projectId: new ObjectId(projects[3]._id),
        assignedTo: new ObjectId(users[0]._id),
        createdBy: new ObjectId(users[1]._id),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Environmental Impact Assessment',
        description: 'Complete environmental compliance and impact assessment documentation',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        progress: 0,
        projectId: new ObjectId(projects[4]._id),
        assignedTo: new ObjectId(users[1]._id),
        createdBy: new ObjectId(users[0]._id),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Check if tasks already exist
    const existingTasks = await tasksCollection.countDocuments();
    if (existingTasks > 0) {
      console.log(`Found ${existingTasks} existing tasks. Clearing them first...`);
      await tasksCollection.deleteMany({});
    }
    
    console.log('Adding sample tasks...');
    const result = await tasksCollection.insertMany(sampleTasks);
    console.log(`Inserted ${result.insertedCount} tasks`);
    
    // Verify the tasks
    const insertedTasks = await tasksCollection.find({})
      .populate('projectId', 'name')
      .populate('assignedTo', 'firstName lastName username')
      .toArray();
    
    console.log('\nSample tasks added:');
    insertedTasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.title}`);
      console.log(`   Status: ${task.status}, Priority: ${task.priority}`);
      console.log(`   Due Date: ${task.dueDate.toDateString()}`);
      console.log(`   Progress: ${task.progress}%`);
      console.log(`   Project: ${task.projectId}`);
      console.log(`   Assigned: ${task.assignedTo}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

addSampleTasks();