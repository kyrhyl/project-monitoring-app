import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Team from '@/models/Team';
import Project from '@/models/Project';
import Task from '@/models/Task';
import AuthUtils from '@/lib/auth/utils';
import TeamSlotManager from '@/lib/teamSlotManager';

// GET - Fetch detailed member information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    await dbConnect();
    
    const currentUser = AuthUtils.getUserFromRequest(request);
    if (!currentUser || currentUser.role !== 'team_leader') {
      return NextResponse.json(
        { success: false, error: 'Team leader access required' },
        { status: 403 }
      );
    }

    const { memberId } = await params;

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

    // Get member details and verify they belong to this team
    const member = await User.findById(memberId)
      .select('_id username email firstName lastName role createdAt isActive')
      .lean();

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    // Verify member is in this team using proper slot filtering
    const currentMembers = TeamSlotManager.getCurrentMembers(userTeam);
    const currentMemberIds = currentMembers.map(id => id.toString());
    
    if (!currentMemberIds.includes(memberId)) {
      return NextResponse.json(
        { success: false, error: 'Member not in your team' },
        { status: 403 }
      );
    }

    // Get member's current projects
    const memberProjects = await Project.find({
      teamId: userTeam._id,
      $or: [
        { createdBy: memberId },
        { assignedMembers: memberId }
      ],
      isActive: true
    }).select('_id name description status dueDate').lean();

    // Get member's current tasks
    const memberTasks = await Task.find({
      assigneeId: memberId,
      status: { $in: ['todo', 'in-progress', 'pending'] }
    })
    .populate('projectId', 'name')
    .select('_id title description status priority dueDate estimatedHours projectId')
    .lean();

    // Get member's completed tasks (last 50)
    const completedTasks = await Task.find({
      assigneeId: memberId,
      status: 'completed'
    })
    .populate('projectId', 'name')
    .select('_id title status completedAt estimatedHours actualHours projectId createdAt')
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

    // Calculate analytics
    const totalTasks = memberTasks.length + completedTasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
    
    // Calculate average completion time for completed tasks
    const completionTimes = completedTasks
      .filter(task => task.completedAt)
      .map(task => {
        const created = new Date(task.createdAt);
        const completed = new Date(task.completedAt);
        return (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // Days
      });
    
    const averageCompletionTime = completionTimes.length > 0 
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0;

    // Calculate tenure
    const joinedDate = new Date(member.createdAt);
    const currentDate = new Date();
    const tenure = Math.floor((currentDate.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));

    // Add progress to projects (simplified calculation)
    const projectsWithProgress = memberProjects.map(project => ({
      ...project,
      progress: Math.floor(Math.random() * 100) // TODO: Calculate actual progress from tasks
    }));

    // Format task history
    const taskHistory = completedTasks.map(task => ({
      _id: task._id,
      title: task.title,
      status: task.status,
      completedAt: task.completedAt,
      projectName: task.projectId?.name || 'Unknown Project',
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours
    }));

    return NextResponse.json({
      success: true,
      data: {
        member: {
          ...member,
          currentProjects: projectsWithProgress,
          currentTasks: memberTasks,
          taskHistory: taskHistory,
          analytics: {
            totalTasks,
            completedTasks: completedTasks.length,
            averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
            currentWorkload: memberTasks.length,
            completionRate: Math.round(completionRate * 10) / 10,
            tenure
          }
        }
      }
    });

  } catch (error: any) {
    console.error('Member details error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}