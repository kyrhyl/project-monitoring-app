// API endpoint for comprehensive user history and analytics
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';
import User from '@/models/User';
import AuthUtils from '@/lib/auth/utils';
import mongoose from 'mongoose';

// GET - Fetch comprehensive user history
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;
    
    const currentUser = AuthUtils.getUserFromRequest(request);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Get user basic information
    const user = await User.findById(id).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Find all teams where this user appears in history
    const teamsWithHistory = await Team.find({
      $or: [
        // User appears in leader slot history
        { 'leaderSlot.history.userId': id },
        // User appears in member slot history
        { 'memberSlots.history.userId': id },
        // Legacy: User appears in current members
        { 'members': id },
        // Legacy: User is current team leader
        { 'teamLeaderId': id }
      ]
    })
    .populate('leaderSlot.history.assignedBy', 'username firstName lastName')
    .populate('memberSlots.history.assignedBy', 'username firstName lastName')
    .populate('createdBy', 'username firstName lastName')
    .sort({ createdAt: 1 });

    // Build comprehensive history timeline
    const timeline = [];
    const teamAnalytics = {
      totalTeams: 0,
      currentTeam: null as null | { id: any; name: any; role: string },
      currentRole: user.role,
      leadershipPositions: 0,
      memberPositions: 0,
      totalTenure: 0,
      averageStayDuration: 0
    };

    for (const team of teamsWithHistory) {
      // Check leader slot history
      if (team.leaderSlot?.history) {
        const userLeaderEntries = team.leaderSlot.history.filter(
          (entry: any) => entry.userId.toString() === id
        );

        for (const entry of userLeaderEntries) {
          const startDate = new Date(entry.assignedAt);
          const endDate = entry.unassignedAt ? new Date(entry.unassignedAt) : null;
          const duration = endDate ? endDate.getTime() - startDate.getTime() : Date.now() - startDate.getTime();
          const durationDays = Math.floor(duration / (1000 * 60 * 60 * 24));

          timeline.push({
            type: 'leader_assignment',
            teamId: team._id,
            teamName: team.name,
            startDate: entry.assignedAt,
            endDate: entry.unassignedAt,
            duration: durationDays,
            assignedBy: entry.assignedBy,
            isCurrent: !entry.unassignedAt,
            role: 'team_leader'
          });

          teamAnalytics.leadershipPositions++;
          if (!entry.unassignedAt) {
            teamAnalytics.currentTeam = {
              id: team._id,
              name: team.name,
              role: 'team_leader'
            };
          }
        }
      }

      // Check member slot history
      if (team.memberSlots) {
        for (const slot of team.memberSlots) {
          const userMemberEntries = slot.history.filter(
            (entry: any) => entry.userId.toString() === id
          );

          for (const entry of userMemberEntries) {
            const startDate = new Date(entry.assignedAt);
            const endDate = entry.unassignedAt ? new Date(entry.unassignedAt) : null;
            const duration = endDate ? endDate.getTime() - startDate.getTime() : Date.now() - startDate.getTime();
            const durationDays = Math.floor(duration / (1000 * 60 * 60 * 24));

            timeline.push({
              type: 'member_assignment',
              teamId: team._id,
              teamName: team.name,
              slotId: slot.slotId,
              startDate: entry.assignedAt,
              endDate: entry.unassignedAt,
              duration: durationDays,
              assignedBy: entry.assignedBy,
              isCurrent: !entry.unassignedAt,
              role: 'member'
            });

            teamAnalytics.memberPositions++;
            if (!entry.unassignedAt) {
              teamAnalytics.currentTeam = {
                id: team._id,
                name: team.name,
                role: 'member'
              };
            }
          }
        }
      }
    }

    // Sort timeline by date
    timeline.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    // Calculate analytics
    teamAnalytics.totalTeams = new Set(timeline.map(entry => entry.teamId.toString())).size;
    
    // Calculate total tenure (sum of all completed assignments)
    const completedAssignments = timeline.filter(entry => entry.endDate);
    teamAnalytics.totalTenure = completedAssignments.reduce((sum, entry) => sum + entry.duration, 0);
    
    // Calculate average stay duration
    if (completedAssignments.length > 0) {
      teamAnalytics.averageStayDuration = Math.round(teamAnalytics.totalTenure / completedAssignments.length);
    }

    // Get current assignment details
    const currentAssignment = timeline.find(entry => entry.isCurrent);
    
    // Calculate days since user creation
    const userCreatedDate = new Date(user.createdAt);
    const daysSinceCreated = Math.floor((Date.now() - userCreatedDate.getTime()) / (1000 * 60 * 60 * 24));

    // Build comprehensive response
    const userHistory = {
      user: {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        daysSinceCreated
      },
      currentAssignment,
      timeline,
      analytics: teamAnalytics,
      summary: {
        totalAssignments: timeline.length,
        uniqueTeams: teamAnalytics.totalTeams,
        currentStatus: currentAssignment ? 'Active' : 'Unassigned',
        longestAssignment: timeline.length > 0 ? Math.max(...timeline.map(entry => entry.duration)) : 0,
        shortestAssignment: timeline.length > 0 ? Math.min(...timeline.filter(entry => entry.endDate).map(entry => entry.duration)) : 0
      }
    };

    return NextResponse.json({
      success: true,
      data: userHistory
    });

  } catch (error: any) {
    console.error('Get user history error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}