import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Project, User, Team } from '@/models';
import AuthUtils from '@/lib/auth/utils';
import mongoose from 'mongoose';

// GET - Fetch project team members
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

    // Get project members - all users can view, but only team leaders and admins can modify
    const memberIds = project.teamMembers || [];
    const members = await User.find({ 
      _id: { $in: memberIds },
      isActive: true 
    }).select('_id username firstName lastName role').lean();

    // Only team leaders and admins can see available members for assignment
    let availableMembers: any[] = [];
    if (currentUser.role === 'admin' || 
        (currentUser.role === 'team_leader' && project.teamId?.toString() === currentUser.teamId)) {
      availableMembers = await User.find({
        teamId: project.teamId,
        _id: { $nin: memberIds },
        isActive: true
      }).select('_id username firstName lastName role').lean();
    }

    return NextResponse.json({
      success: true,
      data: {
        projectMembers: members,
        availableMembers: availableMembers
      }
    });
  } catch (error: any) {
    console.error('Get project members error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Add team member to project
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;
    const { memberIds } = await request.json();
    
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

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Member IDs array is required' },
        { status: 400 }
      );
    }

    // Validate member IDs
    const invalidIds = memberIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid member ID(s)' },
        { status: 400 }
      );
    }

    const project = await Project.findById(id) as any;
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (currentUser.role === 'member' || 
        (currentUser.role === 'team_leader' && project.teamId?.toString() !== currentUser.teamId)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Verify that all users are from the same team
    const users = await User.find({ 
      _id: { $in: memberIds },
      teamId: project.teamId,
      isActive: true 
    });

    if (users.length !== memberIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more users are not from the project team or inactive' },
        { status: 400 }
      );
    }

    // Add members to project (avoid duplicates)
    const currentMembers = project.teamMembers || [];
    const newMemberIds = memberIds.filter((id: string) => 
      !currentMembers.some((existing: any) => existing.toString() === id)
    );

    if (newMemberIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'All specified members are already assigned to this project' },
        { status: 400 }
      );
    }

    await Project.findByIdAndUpdate(id, {
      $addToSet: { teamMembers: { $each: newMemberIds } }
    });

    return NextResponse.json({
      success: true,
      message: `Added ${newMemberIds.length} member(s) to project`
    });
  } catch (error: any) {
    console.error('Add project member error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove team member from project
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    
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

    if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
      return NextResponse.json(
        { success: false, error: 'Valid member ID is required' },
        { status: 400 }
      );
    }

    const project = await Project.findById(id) as any;
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (currentUser.role === 'member' || 
        (currentUser.role === 'team_leader' && project.teamId?.toString() !== currentUser.teamId)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Remove member from project
    await Project.findByIdAndUpdate(id, {
      $pull: { teamMembers: memberId }
    });

    // Also unassign any tasks assigned to this member in this project
    await mongoose.models.Task?.updateMany(
      { projectId: id, assigneeId: memberId },
      { $unset: { assigneeId: "", assigneeName: "" } }
    );

    return NextResponse.json({
      success: true,
      message: 'Member removed from project and unassigned from all tasks'
    });
  } catch (error: any) {
    console.error('Remove project member error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}