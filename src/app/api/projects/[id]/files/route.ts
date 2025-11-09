import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Project from '@/models/Project';
import { IProject } from '@/models/Project';
import AuthUtils from '@/lib/auth/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const currentUser = AuthUtils.getUserFromRequest(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const project = await Project.findById(projectId)
      .populate('attachments.uploadedBy', 'name email')
      .lean() as unknown as IProject;

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this project
    const hasAccess = 
      currentUser.role === 'admin' ||
      project.createdBy.toString() === currentUser.userId ||
      project.teamMembers?.some((member: any) => member.toString() === currentUser.userId) ||
      (currentUser.role === 'team_leader' && project.teamId?.toString() === currentUser.teamId);

    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      files: project.attachments || []
    });

  } catch (error) {
    console.error('Error fetching project files:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}