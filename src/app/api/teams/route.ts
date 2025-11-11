import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';
import User from '@/models/User';
import AuthUtils from '@/lib/auth/utils';
import TeamSlotManager from '@/lib/teamSlotManager';
import mongoose from 'mongoose';

// GET - Fetch all teams
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const currentUser = AuthUtils.getUserFromRequest(request);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const teams = await Team.find({ isActive: true })
      .populate('teamLeaderId', 'username firstName lastName')
      .populate('members', 'username firstName lastName role')
      .populate('leaderSlot.currentHolder', 'username firstName lastName')
      .populate('memberSlots.currentHolder', 'username firstName lastName role')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    // Enhance teams with slot manager information for backwards compatibility
    const enhancedTeams = teams.map(team => {
      const currentMembers = TeamSlotManager.getCurrentMembers(team);
      const currentLeader = TeamSlotManager.getCurrentLeader(team);
      
      // Get populated member data from slots
      const populatedMembers = team.memberSlots ? 
        team.memberSlots
          .filter((slot: any) => slot.currentHolder)
          .map((slot: any) => slot.currentHolder) : 
        team.members;
      
      return {
        ...team.toObject(),
        // New slot-based fields
        currentLeader,
        currentMembers,
        memberCount: currentMembers.length,
        // Backwards compatibility: populate members with slot data
        members: populatedMembers,
        // Backwards compatibility: populate teamLeaderId with slot data  
        teamLeaderId: team.leaderSlot?.currentHolder || team.teamLeaderId
      };
    });

    return NextResponse.json({
      success: true,
      data: enhancedTeams
    });

  } catch (error: any) {
    console.error('Get teams error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new team (admin only)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const currentUser = AuthUtils.getUserFromRequest(request);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { name, description, teamLeaderId, memberIds } = await request.json();

    if (!name || !description) {
      return NextResponse.json(
        { success: false, error: 'Name and description are required' },
        { status: 400 }
      );
    }

    // Check if team name already exists
    const existingTeam = await Team.findOne({ name: name.trim(), isActive: true });
    if (existingTeam) {
      return NextResponse.json(
        { success: false, error: 'Team name already exists' },
        { status: 400 }
      );
    }

    // Validate team leader if provided
    if (teamLeaderId) {
      const teamLeader = await User.findById(teamLeaderId);
      if (!teamLeader || !teamLeader.isActive) {
        return NextResponse.json(
          { success: false, error: 'Invalid team leader' },
          { status: 400 }
        );
      }
    }

    const teamData = {
      name: name.trim(),
      description: description.trim(),
      createdBy: currentUser.userId,
      // Initialize with empty slot structure
      leaderSlot: { history: [] },
      memberSlots: [],
      // Keep legacy fields for backwards compatibility
      teamLeaderId: undefined,
      members: []
    };

    const team = await Team.create(teamData);
    
    // Use slot manager to assign leader if provided
    if (teamLeaderId) {
      TeamSlotManager.assignLeader(team, {
        newLeaderId: new mongoose.Types.ObjectId(teamLeaderId),
        assignedBy: new mongoose.Types.ObjectId(currentUser.userId)
      });
      
      await User.findByIdAndUpdate(teamLeaderId, {
        teamId: team._id,
        role: 'team_leader'
      });
    }
    
    // Use slot manager to add members if provided
    if (memberIds && memberIds.length > 0) {
      for (const memberId of memberIds) {
        TeamSlotManager.addMember(team, {
          userId: new mongoose.Types.ObjectId(memberId),
          assignedBy: new mongoose.Types.ObjectId(currentUser.userId)
        });
      }
      
      // Update users' teamId
      await User.updateMany(
        { _id: { $in: memberIds } },
        { teamId: team._id }
      );
    }
    
    // Save the team with slot assignments
    await team.save();

    const populatedTeam = await Team.findById(team._id)
      .populate('teamLeaderId', 'username firstName lastName')
      .populate('members', 'username firstName lastName role')
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: 'Team created successfully',
        data: populatedTeam
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Create team error:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}