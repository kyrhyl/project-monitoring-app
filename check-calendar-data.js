const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://DailyMonitoring:cherie123@my-ecommerce-db.6gfovmu.mongodb.net/test?appName=my-ecommerce-db';

async function checkCalendarData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('test');
    const projects = await db.collection('projects').find({}).toArray();
    
    console.log(`\nTotal projects: ${projects.length}`);
    
    if (projects.length > 0) {
      console.log('\nProject data sample:');
      projects.forEach((project, index) => {
        console.log(`${index + 1}. ${project.name}`);
        console.log(`   Status: ${project.status}`);
        console.log(`   Start Date: ${project.startDate || 'Not set'}`);
        console.log(`   End Date: ${project.endDate || 'Not set'}`);
        console.log(`   Deadline: ${project.deadline || 'Not set'}`);
        console.log(`   Created: ${project.createdAt || 'Not set'}`);
        console.log('');
      });
      
      // Check for projects with dates
      const projectsWithDates = projects.filter(p => p.startDate || p.endDate || p.deadline);
      console.log(`\nProjects with dates: ${projectsWithDates.length}`);
      
      if (projectsWithDates.length > 0) {
        console.log('Projects that should show on calendar:');
        projectsWithDates.forEach(p => {
          console.log(`- ${p.name}: startDate=${p.startDate}, endDate=${p.endDate}, deadline=${p.deadline}`);
        });
      }
    } else {
      console.log('No projects found in database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkCalendarData();