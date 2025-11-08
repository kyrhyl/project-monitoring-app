import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Project, Team, User } from '@/models';
import AuthUtils from '@/lib/auth/utils';

// GET - Fetch all projects
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const currentUser = AuthUtils.getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    let filter = {};
    
    // Filter projects based on user role
    if (currentUser.role === 'member') {
      // Members can only see projects from their team
      filter = { teamId: currentUser.teamId };
    } else if (currentUser.role === 'team_leader') {
      // Team leaders can see projects from their team
      filter = { teamId: currentUser.teamId };
    }
    // Admins can see all projects (no filter)

    const projects = await Project.find(filter)
      .select('name description status priority startDate endDate progress teamId createdBy')
      .sort({ createdAt: -1 })
      .lean();

    // Populate manually if needed (to avoid schema registration issues)
    const populatedProjects = projects.map(project => ({
      ...project,
      teamId: project.teamId ? { _id: project.teamId } : null,
      createdBy: project.createdBy ? { _id: project.createdBy } : null
    }));

    return NextResponse.json({ 
      success: true, 
      data: populatedProjects 
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new project
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const currentUser = AuthUtils.getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only team leaders and admins can create projects
    if (currentUser.role === 'member') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Only team leaders and admins can create projects.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Add required fields
    const projectData = {
      ...body,
      createdBy: currentUser.userId,
      teamId: currentUser.teamId // Assign project to user's team
    };

    const project = await Project.create(projectData);
    
    return NextResponse.json(
      { 
        success: true, 
        data: project 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Project creation error:', error);
    
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