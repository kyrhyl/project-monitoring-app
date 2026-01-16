// API endpoint for team leader to manage team members
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';
import User from '@/models/User';
import Project from '@/models/Project';
import Task from '@/models/Task';
import AuthUtils from '@/lib/auth/utils';
import TeamSlotManager from '@/lib/teamSlotManager';

// GET - Fetch team members for team leader
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
    
    // Get detailed team member information with their assignment history
    const teamMembers = await User.find({
      _id: { $in: currentMembers.map((id: any) => id.toString()) },
      isActive: true
    }).select('_id username firstName lastName email role createdAt teamId').lean();

    // Get member assignment history from team slots and calculate statistics
    const membersWithHistory = await Promise.all(teamMembers.map(async (member) => {
      // Find the member's slot history
      const memberSlot = userTeam.memberSlots.find((slot: any) => 
        slot.currentHolder && slot.currentHolder.equals(member._id)
      );

      const assignmentHistory = memberSlot ? memberSlot.history.map((entry: any) => ({
        assignedAt: entry.assignedAt,
        unassignedAt: entry.unassignedAt,
        assignedBy: entry.assignedBy,
        isCurrent: !entry.unassignedAt
      })) : [];

      // Calculate tenure
      const currentAssignment = assignmentHistory.find((h: any) => h.isCurrent);
      const joinDate = currentAssignment?.assignedAt || member.createdAt;
      const tenure = Math.floor((Date.now() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24));

      // Get member's current projects - include projects where they have tasks OR are assigned
      const memberProjectIds = await Task.find({
        assigneeId: member._id,
        status: { $in: ['todo', 'in-progress', 'pending'] }
      }).distinct('projectId');

      const memberProjects = await Project.find({
        $and: [
          { teamId: userTeam._id },
          {
            $or: [
              { createdBy: member._id },
              { assignedMembers: member._id },
              { _id: { $in: memberProjectIds.map((id: any) => id.toString()) } } // Include projects where user has active tasks
            ]
          },
          { 
            $or: [
              { isActive: true },
              { isActive: { $exists: false } } // Include projects where isActive is not set (legacy)
            ]
          }
        ]
      }).countDocuments();

      // Get member's active tasks
      const activeTasks = await Task.find({
        assigneeId: member._id,
        status: { $in: ['todo', 'in-progress', 'pending'] }
      }).countDocuments();

      // Get member's completed tasks
      const completedTasks = await Task.find({
        assigneeId: member._id,
        status: 'completed'
      }).countDocuments();

      return {
        ...member,
        assignmentHistory,
        tenure: tenure,
        joinDate: joinDate,
        slotId: memberSlot?.slotId,
        currentTenure: tenure,
        totalAssignments: assignmentHistory.length,
        lastAssigned: joinDate.toISOString(),
        currentProjects: memberProjects,
        activeTasks: activeTasks,
        completedTasks: completedTasks
      };
    }));

    return NextResponse.json({
      success: true,
      data: {
        team: {
          id: userTeam._id,
          name: userTeam.name,
          memberCount: teamMembers.length
        },
        members: membersWithHistory
      }
    });

  } catch (error: any) {
    console.error('Get team members error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}