import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import { Project, User } from '@/models';
import AuthUtils from '@/lib/auth/utils';
import mongoose from 'mongoose';

// GET - Fetch single task
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    await dbConnect();
    const { id, taskId } = await context.params;
    
    const currentUser = AuthUtils.getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const task = await Task.findOne({ _id: taskId, projectId: id })
      .populate('assigneeId', 'username firstName lastName')
      .populate('createdBy', 'username firstName lastName')
      .lean();

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const project = await Project.findById(id).lean() as any;
    if (currentUser.role === 'member' && project.teamId?.toString() !== currentUser.teamId) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
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

// PUT - Update task
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    await dbConnect();
    const { id, taskId } = await context.params;
    
    const currentUser = AuthUtils.getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const task = await Task.findOne({ _id: taskId, projectId: id }) as any;
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const project = await Project.findById(id).lean() as any;
    
    // Permission check: Team leaders can update any task in their projects, 
    // members can only update their own assigned tasks
    const canUpdate = currentUser.role === 'admin' ||
                      (currentUser.role === 'team_leader' && project.teamId?.toString() === currentUser.teamId) ||
                      (currentUser.role === 'member' && task.assigneeId?.toString() === currentUser.userId);

    if (!canUpdate) {
      return NextResponse.json(
        { success: false, error: 'You can only update your own assigned tasks' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, status, priority, assigneeId, dueDate, estimatedHours, actualHours } = body;

    let updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours;
    if (actualHours !== undefined) updateData.actualHours = actualHours;

    // Handle assignee update (only team leaders and admins can reassign tasks)
    if (assigneeId !== undefined && (currentUser.role === 'team_leader' || currentUser.role === 'admin')) {
      if (assigneeId === null || assigneeId === '') {
        // Unassign task
        updateData.assigneeId = null;
        updateData.assigneeName = null;
      } else {
        // Validate new assignee
        if (!mongoose.Types.ObjectId.isValid(assigneeId)) {
          return NextResponse.json(
            { success: false, error: 'Invalid assignee ID' },
            { status: 400 }
          );
        }

        const assignee = await User.findOne({
          _id: assigneeId,
          $or: [
            { _id: { $in: project.teamMembers || [] } },
            { teamId: project.teamId }
          ],
          isActive: true
        }).lean() as any;

        if (!assignee) {
          return NextResponse.json(
            { success: false, error: 'Assignee must be a member of the project team' },
            { status: 400 }
          );
        }

        updateData.assigneeId = assigneeId;
        updateData.assigneeName = `${assignee.firstName} ${assignee.lastName}`.trim();
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true, runValidators: true }
    ).populate('assigneeId', 'username firstName lastName')
     .populate('createdBy', 'username firstName lastName');

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

// DELETE - Delete task
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    await dbConnect();
    const { id, taskId } = await context.params;
    
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

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const task = await Task.findOne({ _id: taskId, projectId: id });
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const project = await Project.findById(id).lean() as any;
    
    // Team leaders can only delete tasks from their team's projects
    if (currentUser.role === 'team_leader' && project.teamId?.toString() !== currentUser.teamId) {
      return NextResponse.json(
        { success: false, error: 'You can only delete tasks from your team\'s projects' },
        { status: 403 }
      );
    }

    await Task.findByIdAndDelete(taskId);

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