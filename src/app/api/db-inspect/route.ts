import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import User from '@/models/User';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Team from '@/models/Team';

export async function GET() {
  try {
    await dbConnect();
    
    const connection = mongoose.connection;
    const dbName = connection.db?.databaseName;
    
    // Get all collections
    const collections = await connection.db?.listCollections().toArray();
    
    // Count documents in each model
    const userCount = await User.countDocuments();
    const projectCount = await Project.countDocuments();
    const taskCount = await Task.countDocuments();
    const teamCount = await Team.countDocuments();
    
    // Get sample data from each collection (first 5 documents)
    const sampleUsers = await User.find({}).limit(5).select('-password');
    const sampleProjects = await Project.find({}).limit(5);
    const sampleTasks = await Task.find({}).limit(5);
    const sampleTeams = await Team.find({}).limit(5);
    
    // Get database statistics
    const stats = await connection.db?.stats();
    
    return NextResponse.json({
      success: true,
      database: {
        name: dbName,
        status: 'connected',
        collections: collections?.map(c => ({
          name: c.name,
          type: c.type
        })) || [],
        statistics: {
          storageSize: stats?.storageSize,
          dataSize: stats?.dataSize,
          indexSize: stats?.indexSize,
          collections: stats?.collections,
          objects: stats?.objects
        }
      },
      models: {
        users: {
          count: userCount,
          sample: sampleUsers
        },
        projects: {
          count: projectCount,
          sample: sampleProjects
        },
        tasks: {
          count: taskCount,
          sample: sampleTasks
        },
        teams: {
          count: teamCount,
          sample: sampleTeams
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Database inspection error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}