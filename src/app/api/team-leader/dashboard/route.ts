// API endpoint for team leader dashboard data
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';
import User from '@/models/User';
import Project from '@/models/Project';
import Task from '@/models/Task';
import AuthUtils from '@/lib/auth/utils';
import TeamSlotManager from '@/lib/teamSlotManager';
import mongoose from 'mongoose';

// GET - Fetch team leader dashboard data
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

    // Get team members using slot manager
    const currentMembers = TeamSlotManager.getCurrentMembers(userTeam);
    
    // Get detailed team member information
    const teamMembers = await User.find({
      _id: { $in: currentMembers },
      isActive: true
    }).select('_id username firstName lastName email role createdAt').lean();

    // Get team projects
    const teamProjects = await Project.find({
      teamId: userTeam._id,
      isActive: true
    }).populate('createdBy', 'username firstName lastName').lean();

    // Get team tasks
    const teamTasks = await Task.find({
      projectId: { $in: teamProjects.map(p => p._id) }
    }).populate('assignedTo', 'username firstName lastName').lean();

    // Calculate analytics
    const analytics = {
      team: {
        id: userTeam._id,
        name: userTeam.name,
        description: userTeam.description,
        memberCount: teamMembers.length,
        createdAt: userTeam.createdAt
      },
      projects: {
        total: teamProjects.length,
        active: teamProjects.filter(p => p.status === 'active' || p.status === 'in_progress').length,
        completed: teamProjects.filter(p => p.status === 'completed').length,
        pending: teamProjects.filter(p => p.status === 'pending' || !p.status).length
      },
      tasks: {
        total: teamTasks.length,
        completed: teamTasks.filter(t => t.status === 'completed').length,
        inProgress: teamTasks.filter(t => t.status === 'in_progress').length,
        pending: teamTasks.filter(t => t.status === 'pending' || !t.status).length,
        overdue: teamTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length
      },
      members: {
        total: teamMembers.length,
        active: teamMembers.filter(m => m.isActive).length,
        withTasks: [...new Set(teamTasks.map(t => t.assignedTo?._id?.toString()))].length
      }
    };

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentProjects = teamProjects.filter(p => 
      new Date(p.createdAt) >= thirtyDaysAgo || 
      (p.updatedAt && new Date(p.updatedAt) >= thirtyDaysAgo)
    );

    const recentTasks = teamTasks.filter(t => 
      new Date(t.createdAt) >= thirtyDaysAgo ||
      (t.updatedAt && new Date(t.updatedAt) >= thirtyDaysAgo)
    );

    // Calculate team performance metrics
    const completedTasksLastMonth = teamTasks.filter(t => 
      t.status === 'completed' && 
      t.updatedAt && 
      new Date(t.updatedAt) >= thirtyDaysAgo
    );

    const performance = {
      productivity: {
        tasksCompletedLastMonth: completedTasksLastMonth.length,
        projectsActiveLastMonth: recentProjects.length,
        averageTaskCompletionTime: calculateAverageCompletionTime(completedTasksLastMonth)
      },
      workload: teamMembers.map(member => {
        const memberTasks = teamTasks.filter(t => t.assignedTo?._id?.toString() === member._id.toString());
        return {
          member: {
            id: member._id,
            name: `${member.firstName} ${member.lastName}`,
            username: member.username
          },
          tasks: {
            total: memberTasks.length,
            completed: memberTasks.filter(t => t.status === 'completed').length,
            inProgress: memberTasks.filter(t => t.status === 'in_progress').length,
            pending: memberTasks.filter(t => t.status === 'pending' || !t.status).length
          }
        };
      })
    };

    // Get upcoming deadlines (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingDeadlines = teamTasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) <= nextWeek && 
      new Date(t.dueDate) >= new Date() &&
      t.status !== 'completed'
    ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return NextResponse.json({
      success: true,
      data: {
        team: userTeam,
        members: teamMembers,
        projects: teamProjects.slice(0, 5), // Latest 5 projects for dashboard
        tasks: teamTasks.slice(0, 10), // Latest 10 tasks for dashboard
        analytics,
        performance,
        upcomingDeadlines: upcomingDeadlines.slice(0, 5) // Next 5 deadlines
      }
    });

  } catch (error: any) {
    console.error('Team leader dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate average task completion time
function calculateAverageCompletionTime(tasks: any[]): number {
  if (tasks.length === 0) return 0;
  
  const completionTimes = tasks.map(task => {
    const created = new Date(task.createdAt);
    const completed = new Date(task.updatedAt);
    return (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // Days
  });
  
  const average = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
  return Math.round(average * 10) / 10; // Round to 1 decimal place
}