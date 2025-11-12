import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Task, User, Project } from '@/models'; // Import from models index

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const status = searchParams.get('status');
    
    // Build query filter
    const filter: any = {};
    
    // Only show ongoing tasks (not completed)
    if (status) {
      filter.status = status;
    } else {
      // Default to showing ongoing tasks
      filter.status = { $in: ['todo', 'in-progress'] };
    }
    
    // Only include tasks with due dates for calendar display
    filter.dueDate = { $exists: true, $ne: null };
    
    const tasks = await Task.find(filter)
      .populate('assigneeId', 'firstName lastName username')
      .populate('projectId', 'name status description')
      .sort({ dueDate: 1 })
      .limit(limit)
      .lean();
    
    // Sanitize task data for public consumption
    const publicTasks = tasks.map(task => ({
      _id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      progress: task.progress || 0,
      assignedTo: task.assigneeId ? {
        firstName: task.assigneeId.firstName,
        lastName: task.assigneeId.lastName,
        username: task.assigneeId.username
      } : null,
      project: task.projectId ? {
        _id: task.projectId._id,
        name: task.projectId.name,
        status: task.projectId.status,
        description: task.projectId.description
      } : null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }));
    
    return NextResponse.json({
      success: true,
      data: publicTasks,
      total: publicTasks.length
    });
    
  } catch (error) {
    console.error('Public tasks API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}