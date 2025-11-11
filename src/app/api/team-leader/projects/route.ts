// API endpoint for team leader to manage team projects
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';
import Project from '@/models/Project';
import Task from '@/models/Task';
import AuthUtils from '@/lib/auth/utils';
import mongoose from 'mongoose';

// GET - Fetch team projects for team leader
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const currentUser = AuthUtils.getUserFromRequest(request);
    if (!currentUser || currentUser.role !== 'team_leader') {
      return NextResponse.json(
        { success: false, error: 'Team leader access required' },
        { status: 403 }
      );
    }

    // Find the team where current user is the leader
    const userTeam = await Team.findOne({
      'leaderSlot.currentHolder': currentUser.userId,
      isActive: true
    });

    if (!userTeam) {
      return NextResponse.json(
        { success: false, error: 'No team found for this team leader' },
        { status: 404 }
      );
    }

    // Get team projects with additional details
    const teamProjects = await Project.find({
      teamId: userTeam._id,
      isActive: true
    })
    .populate('createdBy', 'username firstName lastName')
    .populate('teamMembers', 'username firstName lastName')
    .sort({ createdAt: -1 })
    .lean();

    // Get tasks for each project
    const projectsWithTasks = await Promise.all(
      teamProjects.map(async (project) => {
        const tasks = await Task.find({ projectId: project._id })
          .populate('assignedTo', 'username firstName lastName')
          .lean();

        // Calculate project analytics
        const analytics = {
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
          pendingTasks: tasks.filter(t => t.status === 'pending' || !t.status).length,
          overdueTasks: tasks.filter(t => 
            t.dueDate && 
            new Date(t.dueDate) < new Date() && 
            t.status !== 'completed'
          ).length,
          progress: tasks.length > 0 ? 
            Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0
        };

        return {
          ...project,
          tasks: tasks,
          analytics
        };
      })
    );

    // Calculate team project summary
    const summary = {
      totalProjects: projectsWithTasks.length,
      activeProjects: projectsWithTasks.filter((p: any) => p.status === 'active' || p.status === 'in_progress').length,
      completedProjects: projectsWithTasks.filter((p: any) => p.status === 'completed').length,
      totalTasks: projectsWithTasks.reduce((sum, p) => sum + p.analytics.totalTasks, 0),
      completedTasks: projectsWithTasks.reduce((sum, p) => sum + p.analytics.completedTasks, 0),
      overallProgress: projectsWithTasks.length > 0 ? 
        Math.round(projectsWithTasks.reduce((sum, p) => sum + p.analytics.progress, 0) / projectsWithTasks.length) : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        team: {
          id: userTeam._id,
          name: userTeam.name
        },
        projects: projectsWithTasks,
        summary
      }
    });

  } catch (error: any) {
    console.error('Get team projects error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new project (team leader only)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const currentUser = AuthUtils.getUserFromRequest(request);
    if (!currentUser || currentUser.role !== 'team_leader') {
      return NextResponse.json(
        { success: false, error: 'Team leader access required' },
        { status: 403 }
      );
    }

    // Find the team where current user is the leader
    const userTeam = await Team.findOne({
      'leaderSlot.currentHolder': currentUser.userId,
      isActive: true
    });

    if (!userTeam) {
      return NextResponse.json(
        { success: false, error: 'No team found for this team leader' },
        { status: 404 }
      );
    }

    const { title, description, deadline, priority, teamMembers } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Create new project for the team
    const projectData = {
      title: title.trim(),
      description: description.trim(),
      deadline: deadline ? new Date(deadline) : undefined,
      priority: priority || 'medium',
      status: 'pending',
      teamId: userTeam._id,
      teamMembers: teamMembers || [],
      createdBy: new mongoose.Types.ObjectId(currentUser.userId),
      isActive: true
    };

    const newProject = await Project.create(projectData);

    // Populate the created project
    const populatedProject = await Project.findById(newProject._id)
      .populate('createdBy', 'username firstName lastName')
      .populate('teamMembers', 'username firstName lastName')
      .lean();

    return NextResponse.json({
      success: true,
      message: 'Project created successfully',
      data: populatedProject
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}