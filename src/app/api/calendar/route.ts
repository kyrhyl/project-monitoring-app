import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import Task from '@/models/Task';
import User from '@/models/User';
import AuthUtils from '@/lib/auth/utils';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const currentUser = AuthUtils.getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user role for filtering
    const user = await User.findById(currentUser.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let projectQuery = {};
    let taskQuery = {};

    // Filter based on user role
    if (user.role === 'admin') {
      // Admin can see all projects and tasks
    } else if (user.role === 'team_leader') {
      // Team Leader can see projects from their team and tasks assigned to them
      projectQuery = { teamId: currentUser.teamId };
      
      // Get projects from their team to filter tasks
      const teamProjects = await Project.find({ teamId: currentUser.teamId }).select('_id');
      const projectIds = teamProjects.map(p => p._id);
      
      taskQuery = {
        $or: [
          { projectId: { $in: projectIds } },
          { assigneeId: currentUser.userId }
        ]
      };
    } else {
      // Team Member can see projects they're assigned to and their own tasks
      projectQuery = { 
        $or: [
          { teamId: currentUser.teamId },
          { teamMembers: currentUser.userId }
        ]
      };
      taskQuery = { assigneeId: currentUser.userId };
    }

    // Fetch projects with date fields
    const projects = await Project.find(projectQuery)
      .select('name description startDate endDate status priority teamId createdBy')
      .populate('createdBy', 'name firstName lastName')
      .lean();

    // Fetch tasks with due dates
    const tasks = await Task.find({
      ...taskQuery,
      dueDate: { $exists: true, $ne: null }
    })
      .select('title description dueDate status priority projectId assigneeId assigneeName')
      .populate('projectId', 'name')
      .lean();

    // Format the response data
    const calendarData = {
      projects: projects.map(project => ({
        _id: project._id,
        name: project.name,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status || 'planning',
        priority: project.priority || 'medium',
        teamLeader: project.createdBy?.name || project.createdBy?.firstName || 'Unassigned'
      })),
      tasks: tasks.map(task => ({
        _id: task._id,
        title: task.title,
        dueDate: task.dueDate,
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        projectId: task.projectId?._id,
        projectName: task.projectId?.name || 'Unknown Project',
        assigneeName: task.assigneeName || 'Unassigned'
      }))
    };

    return NextResponse.json(calendarData);
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}