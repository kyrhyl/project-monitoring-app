import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';

// GET - Fetch tasks with optional project filter
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    let query = {};
    if (projectId) {
      query = { projectId };
    }
    
    const tasks = await Task.find(query)
      .populate('projectId', 'name')
      .select('title description status priority assignee dueDate estimatedHours actualHours')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ 
      success: true, 
      data: tasks 
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new task
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const task = await Task.create(body);
    const populatedTask = await Task.findById(task._id)
      .populate('projectId', 'name')
      .lean();
    
    return NextResponse.json(
      { 
        success: true, 
        data: populatedTask 
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}