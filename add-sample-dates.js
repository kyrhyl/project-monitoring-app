const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://DailyMonitoring:cherie123@my-ecommerce-db.6gfovmu.mongodb.net/test?appName=my-ecommerce-db';

async function addSampleDates() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('test');
    const collection = db.collection('projects');
    
    // Get some projects to add dates to
    const projects = await collection.find({}).limit(10).toArray();
    
    const today = new Date();
    
    // Update projects with sample dates
    const updates = [
      {
        id: projects[0]._id,
        startDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        endDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        deadline: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000) // 15 days from now
      },
      {
        id: projects[1]._id,
        startDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        endDate: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        deadline: new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000) // 25 days from now
      },
      {
        id: projects[2]._id,
        startDate: today, // Today
        endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        deadline: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
      },
      {
        id: projects[3]._id,
        startDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        deadline: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
      },
      {
        id: projects[4]._id,
        startDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }
    ];
    
    console.log('Adding sample dates to projects...');
    
    for (const update of updates) {
      const result = await collection.updateOne(
        { _id: update.id },
        { 
          $set: {
            startDate: update.startDate,
            endDate: update.endDate,
            deadline: update.deadline
          }
        }
      );
      console.log(`Updated project ${update.id}: ${result.modifiedCount} document(s) modified`);
    }
    
    console.log('\nVerifying updates...');
    const updatedProjects = await collection.find({
      $or: [
        { startDate: { $exists: true, $ne: null } },
        { endDate: { $exists: true, $ne: null } },
        { deadline: { $exists: true, $ne: null } }
      ]
    }).toArray();
    
    console.log(`\nProjects with dates: ${updatedProjects.length}`);
    updatedProjects.forEach(p => {
      console.log(`- ${p.name}:`);
      console.log(`  Start: ${p.startDate ? p.startDate.toDateString() : 'Not set'}`);
      console.log(`  End: ${p.endDate ? p.endDate.toDateString() : 'Not set'}`);
      console.log(`  Deadline: ${p.deadline ? p.deadline.toDateString() : 'Not set'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

addSampleDates();