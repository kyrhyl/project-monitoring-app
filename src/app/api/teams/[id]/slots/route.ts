// API endpoint for team slot management operations
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';
import User from '@/models/User';
import AuthUtils from '@/lib/auth/utils';
import TeamSlotManager from '@/lib/teamSlotManager';
import mongoose from 'mongoose';

// POST - Perform slot management operations
export async function POST(
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
        { success: false, error: 'Invalid team ID' },
        { status: 400 }
      );
    }

    const { operation, userId, slotId } = await request.json();

    if (!operation) {
      return NextResponse.json(
        { success: false, error: 'Operation is required' },
        { status: 400 }
      );
    }

    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    const adminId = new mongoose.Types.ObjectId(currentUser.userId);

    switch (operation) {
      case 'assign_leader':
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'User ID is required for leader assignment' },
            { status: 400 }
          );
        }

        // Validate user exists and is active
        const newLeader = await User.findById(userId);
        if (!newLeader || !newLeader.isActive) {
          return NextResponse.json(
            { success: false, error: 'Invalid user for leader assignment' },
            { status: 400 }
          );
        }

        // Assign new leader using slot manager
        TeamSlotManager.assignLeader(team, {
          newLeaderId: new mongoose.Types.ObjectId(userId),
          assignedBy: adminId
        });

        // Update user role and team
        await User.findByIdAndUpdate(userId, {
          teamId: team._id,
          role: 'team_leader'
        });

        await team.save();

        return NextResponse.json({
          success: true,
          message: 'Leader assigned successfully',
          data: {
            teamId: team._id,
            newLeaderId: userId,
            operation: 'assign_leader'
          }
        });

      case 'remove_leader':
        // Remove current leader using slot manager
        TeamSlotManager.removeLeader(team, adminId);

        // Update user role (if there was a leader)
        const currentLeader = TeamSlotManager.getCurrentLeader(team);
        if (currentLeader) {
          await User.findByIdAndUpdate(currentLeader, {
            role: 'member'
          });
        }

        await team.save();

        return NextResponse.json({
          success: true,
          message: 'Leader removed successfully',
          data: {
            teamId: team._id,
            operation: 'remove_leader'
          }
        });

      case 'add_member':
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'User ID is required for member addition' },
            { status: 400 }
          );
        }

        // Validate user exists and is active
        const newMember = await User.findById(userId);
        if (!newMember || !newMember.isActive) {
          return NextResponse.json(
            { success: false, error: 'Invalid user for member addition' },
            { status: 400 }
          );
        }

        // Check if user is already a member
        if (TeamSlotManager.belongsToTeam(team, new mongoose.Types.ObjectId(userId))) {
          return NextResponse.json(
            { success: false, error: 'User is already a team member' },
            { status: 400 }
          );
        }

        // Add member using slot manager
        const newSlotId = TeamSlotManager.addMember(team, {
          userId: new mongoose.Types.ObjectId(userId),
          assignedBy: adminId
        });

        // Update user team
        await User.findByIdAndUpdate(userId, {
          teamId: team._id
        });

        await team.save();

        return NextResponse.json({
          success: true,
          message: 'Member added successfully',
          data: {
            teamId: team._id,
            newMemberId: userId,
            slotId: newSlotId,
            operation: 'add_member'
          }
        });

      case 'remove_member':
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'User ID is required for member removal' },
            { status: 400 }
          );
        }

        // Check if user is a member
        if (!TeamSlotManager.belongsToTeam(team, new mongoose.Types.ObjectId(userId))) {
          return NextResponse.json(
            { success: false, error: 'User is not a team member' },
            { status: 400 }
          );
        }

        // Remove member using slot manager
        TeamSlotManager.removeMember(team, new mongoose.Types.ObjectId(userId), adminId);

        // Update user team
        await User.findByIdAndUpdate(userId, {
          $unset: { teamId: '' }
        });

        await team.save();

        return NextResponse.json({
          success: true,
          message: 'Member removed successfully',
          data: {
            teamId: team._id,
            removedMemberId: userId,
            operation: 'remove_member'
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid operation' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Team slot operation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get team slot history
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
        { success: false, error: 'Invalid team ID' },
        { status: 400 }
      );
    }

    const team = await Team.findById(id)
      .populate('leaderSlot.history.userId', 'username firstName lastName')
      .populate('leaderSlot.history.assignedBy', 'username firstName lastName')
      .populate('memberSlots.history.userId', 'username firstName lastName')
      .populate('memberSlots.history.assignedBy', 'username firstName lastName');

    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Get comprehensive team history using slot manager
    const history = TeamSlotManager.getTeamHistory(team);

    return NextResponse.json({
      success: true,
      data: {
        teamId: team._id,
        teamName: team.name,
        history: history
      }
    });

  } catch (error: any) {
    console.error('Get team slot history error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}