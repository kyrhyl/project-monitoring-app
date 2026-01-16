import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import { User } from '@/models';
import AuthUtils from '@/lib/auth/utils';
import { updateProjectDatesFromTasks } from '@/lib/updateProjectDates';
import mongoose from 'mongoose';

// GET - Fetch a specific task
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;
    
    const currentUser = AuthUtils.getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const task = await Task.findById(id)
      .populate('projectId', 'name')
      .populate('assigneeId', 'username firstName lastName')
      .populate('createdBy', 'username firstName lastName')
      .lean();

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: task 
    });
  } catch (error: any) {
    console.error('Get task error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update a task
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;
    
    const currentUser = AuthUtils.getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only team leaders and admins can update tasks
    if (currentUser.role === 'member') {
      return NextResponse.json(
        { success: false, error: 'Only team leaders and admins can update tasks' },
        { status: 403 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const task = await Task.findById(id) as any;
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, priority, status, phase, assigneeId, dueDate, startDate, estimatedHours } = body;

    // Validate assignee if provided
    let assigneeName = '';
    if (assigneeId) {
      if (!mongoose.Types.ObjectId.isValid(assigneeId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid assignee ID' },
          { status: 400 }
        );
      }

      const assignee = await User.findOne({
        _id: assigneeId,
        isActive: true
      }).lean() as any;

      if (!assignee) {
        return NextResponse.json(
          { success: false, error: 'Assignee not found or inactive' },
          { status: 400 }
        );
      }

      assigneeName = `${assignee.firstName} ${assignee.lastName}`.trim();
    }

    // Build update object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (phase !== undefined) updateData.phase = phase;
    if (assigneeId !== undefined) {
      updateData.assigneeId = assigneeId || undefined;
      updateData.assigneeName = assigneeName || undefined;
    }
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : undefined;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : undefined;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours || undefined;

    // Use findByIdAndUpdate for atomic update
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('projectId', 'name')
      .populate('assigneeId', 'username firstName lastName')
      .populate('createdBy', 'username firstName lastName')
      .lean();

    // Update project dates based on all tasks
    if (updatedTask) {
      // Extract the _id from the populated projectId
      const projectIdStr = typeof updatedTask.projectId === 'object' 
        ? (updatedTask.projectId as any)._id.toString() 
        : updatedTask.projectId.toString();
      await updateProjectDatesFromTasks(projectIdStr);
    }

    return NextResponse.json({
      success: true,
      data: updatedTask
    });
  } catch (error: any) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a task
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;
    
    const currentUser = AuthUtils.getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only team leaders and admins can delete tasks
    if (currentUser.role === 'member') {
      return NextResponse.json(
        { success: false, error: 'Only team leaders and admins can delete tasks' },
        { status: 403 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const projectId = (task as any).projectId.toString();
    await Task.findByIdAndDelete(id);

    // Update project dates after deletion
    await updateProjectDatesFromTasks(projectId);

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
