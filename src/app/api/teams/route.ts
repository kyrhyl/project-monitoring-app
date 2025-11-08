import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';
import User from '@/models/User';
import AuthUtils from '@/lib/auth/utils';

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
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: teams
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
      teamLeaderId: teamLeaderId || undefined,
      members: memberIds || [],
      createdBy: currentUser.userId
    };

    const team = await Team.create(teamData);
    
    // Update team members' teamId
    if (memberIds && memberIds.length > 0) {
      await User.updateMany(
        { _id: { $in: memberIds } },
        { teamId: team._id }
      );
    }

    // Update team leader's teamId and role if needed
    if (teamLeaderId) {
      await User.findByIdAndUpdate(teamLeaderId, {
        teamId: team._id,
        role: 'team_leader'
      });
    }

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