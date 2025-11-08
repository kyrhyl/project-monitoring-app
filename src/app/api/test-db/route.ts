import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// GET - Test MongoDB Atlas connection
export async function GET() {
  try {
    await dbConnect();
    
    // Test the connection by getting database stats
    const connection = mongoose.connection;
    const dbName = connection.db?.databaseName;
    const readyState = connection.readyState;
    
    // ReadyState meanings: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    if (readyState === 1) {
      // Get some basic database info
      const collections = await connection.db?.listCollections().toArray();
      
      return NextResponse.json({
        success: true,
        message: 'Successfully connected to MongoDB Atlas!',
        data: {
          database: dbName,
          status: states[readyState as keyof typeof states],
          host: connection.host,
          port: connection.port,
          collectionsCount: collections?.length || 0,
          collections: collections?.map(c => c.name) || []
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Database connection not ready',
        data: {
          database: dbName,
          status: states[readyState as keyof typeof states],
        }
      }, { status: 503 });
    }
    
  } catch (error: any) {
    console.error('MongoDB connection test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to connect to MongoDB Atlas',
      error: error.message,
      details: {
        name: error.name,
        code: error.code,
      }
    }, { status: 500 });
  }
}