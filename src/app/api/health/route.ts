import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Test MongoDB connection
    await dbConnect();
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful',
      environment: process.env.NODE_ENV,
      mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
      jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('MongoDB connection error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      environment: process.env.NODE_ENV,
      mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
      jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}