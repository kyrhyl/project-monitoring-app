import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Task from '@/models/Task';
import { ITask } from '@/models/Task';
import AuthUtils from '@/lib/auth/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const currentUser = AuthUtils.getUserFromRequest(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const task = await Task.findById(taskId)
      .populate('attachments.uploadedBy', 'name email')
      .populate('projectId', 'name teamId teamMembers createdBy')
      .lean() as unknown as ITask & { projectId: any };

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this task
    const hasAccess = 
      currentUser.role === 'admin' ||
      task.createdBy.toString() === currentUser.userId ||
      task.assigneeId?.toString() === currentUser.userId ||
      task.projectId.createdBy.toString() === currentUser.userId ||
      task.projectId.teamMembers?.some((member: any) => member.toString() === currentUser.userId) ||
      (currentUser.role === 'team_leader' && task.projectId.teamId?.toString() === currentUser.teamId);

    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      files: task.attachments || []
    });

  } catch (error) {
    console.error('Error fetching task files:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}