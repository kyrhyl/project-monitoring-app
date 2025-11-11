const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://appdev:appdev123@cluster0.krhqb.mongodb.net/project-monitoring?retryWrites=true&w=majority';

async function addContractDetails() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('project-monitoring');
    const collection = db.collection('projects');
    
    // First, let's see what projects exist
    const projects = await collection.find({}).limit(5).toArray();
    console.log(`Found ${projects.length} projects`);
    
    if (projects.length === 0) {
      // Create a sample project with contract details
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
      console.log('Created sample project:', result.insertedId);
    } else {
      // Update the first project with contract details
      const projectToUpdate = projects[0];
      console.log(`Updating project: ${projectToUpdate.name}`);
      
      const updateData = {
        contractId: "26NEPRX037",
        contractName: "Construction of Multi-Purpose Building - 8th Infantry Battalion",
        appropriation: "2025 General Appropriations Act",
        location: "Barangay Poblacion, Impasugong, Bukidnon",
        approvedBudgetContract: 2500000,
        contractDuration: "4 months",
        updatedAt: new Date()
      };
      
      const result = await collection.updateOne(
        { _id: projectToUpdate._id },
        { $set: updateData }
      );
      
      console.log('Updated project:', result.modifiedCount);
    }
    
    // Show updated project data
    const updatedProjects = await collection.find({}).limit(1).toArray();
    console.log('Project with contract details:', JSON.stringify(updatedProjects[0], null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

addContractDetails();