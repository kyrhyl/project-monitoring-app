// Simple MongoDB update script using the local connection
import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017/project-monitoring'; // Try local MongoDB first

async function updateProjectWithContract() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to local MongoDB');
    
    const db = client.db('project-monitoring');
    const collection = db.collection('projects');
    
    // Get the first project
    const projects = await collection.find({}).limit(1).toArray();
    
    if (projects.length === 0) {
      console.log('No projects found, creating a sample project...');
      
      const sampleProject = {
        name: "B2 - 26NEPRX037",
        description: "Construction of Multi-Purpose Building, 8th Infantry Battalion, Barangay Poblacion, Impasugong, Bukidnon",
        status: "planning",
        priority: "high",
        startDate: new Date('2025-11-10'),
        endDate: new Date('2025-11-14'),
        progress: 0,
        contractId: "26NEPRX037",
        contractName: "Construction of Multi-Purpose Building - 8th Infantry Battalion",
        appropriation: "2025 General Appropriations Act",
        location: "Barangay Poblacion, Impasugong, Bukidnon",
        approvedBudgetContract: 2500000,
        contractDuration: "4 months",
        createdAt: new Date(),
        updatedAt: new Date(),
        geotaggedPhotos: []
      };
      
      const result = await collection.insertOne(sampleProject);
      console.log('Created project with ID:', result.insertedId);
    } else {
      console.log('Found project:', projects[0].name);
      console.log('Updating with contract details...');
      
      const updateResult = await collection.updateOne(
        { _id: projects[0]._id },
        { 
          $set: {
            contractId: "26NEPRX037",
            contractName: "Construction of Multi-Purpose Building - 8th Infantry Battalion",
            appropriation: "2025 General Appropriations Act",
            approvedBudgetContract: 2500000,
            contractDuration: "4 months",
            updatedAt: new Date()
          }
        }
      );
      
      console.log('Update result:', updateResult.modifiedCount);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

updateProjectWithContract();