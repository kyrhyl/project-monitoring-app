import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import { Project, User } from '@/models';
import AuthUtils from '@/lib/auth/utils';
import { updateProjectDatesFromTasks } from '@/lib/updateProjectDates';
import mongoose from 'mongoose';

// GET - Fetch tasks for a specific project
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
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const project = await Project.findById(id).lean() as any;
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check permissions - members can only see tasks from their team's projects
    if (currentUser.role === 'member' && project.teamId?.toString() !== currentUser.teamId) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    } else if (currentUser.role === 'team_leader' && project.teamId?.toString() !== currentUser.teamId) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const tasks = await Task.find({ projectId: id })
      .populate('assigneeId', 'username firstName lastName')
      .populate('createdBy', 'username firstName lastName')
      .sort({ startDate: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: tasks
    });
  } catch (error: any) {
    console.error('Get project tasks error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new task for a project
export async function POST(
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

    // Only team leaders and admins can create tasks
    if (currentUser.role === 'member') {
      return NextResponse.json(
        { success: false, error: 'Only team leaders and admins can create tasks' },
        { status: 403 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const project = await Project.findById(id).lean() as any;
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check permissions - team leaders can only create tasks for their team's projects
    if (currentUser.role === 'team_leader' && project.teamId?.toString() !== currentUser.teamId) {
      return NextResponse.json(
        { success: false, error: 'You can only create tasks for your team\'s projects' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, priority, assigneeId, dueDate, estimatedHours } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    let assigneeName = '';
    if (assigneeId) {
      // Validate assignee is part of the project team
      if (!mongoose.Types.ObjectId.isValid(assigneeId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid assignee ID' },
          { status: 400 }
        );
      }

      const assignee = await User.findOne({
        _id: assigneeId,
        $or: [
          { _id: { $in: (project.teamMembers || []).map((id: any) => id.toString()) } }, // Assigned to project
          { teamId: project.teamId } // Or from the same team
        ],
        isActive: true
      }).lean() as any;

      if (!assignee) {
        return NextResponse.json(
          { success: false, error: 'Assignee must be a member of the project team' },
          { status: 400 }
        );
      }

      assigneeName = `${assignee.firstName} ${assignee.lastName}`.trim();
    }

    const taskData = {
      title,
      description,
      priority: priority || 'medium',
      phase: body.phase || 'other',
      status: body.status || 'todo',
      projectId: id,
      assigneeId: assigneeId || undefined,
      assigneeName: assigneeName || undefined,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      completedAt: (body.status === 'completed') ? new Date() : undefined,
      estimatedHours: estimatedHours || undefined,
      createdBy: new mongoose.Types.ObjectId(currentUser.userId)
    };

    const task = await Task.create(taskData);
    
    // Update project dates based on tasks
    await updateProjectDatesFromTasks(id);
    
    // Populate the response
    const populatedTask = await Task.findById(task._id)
      .populate('assigneeId', 'username firstName lastName')
      .populate('createdBy', 'username firstName lastName')
      .lean();

    return NextResponse.json({
      success: true,
      data: populatedTask
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}