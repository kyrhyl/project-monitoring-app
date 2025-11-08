import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';
import User from '@/models/User';
import AuthUtils from '@/lib/auth/utils';
import mongoose from 'mongoose';

// GET - Fetch single team
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
      .populate('teamLeaderId', 'username firstName lastName')
      .populate('members', 'username firstName lastName role')
      .lean();
    
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: team 
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update team
export async function PUT(
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
    
    const body = await request.json();
    const { name, description, teamLeaderId, memberIds } = body;
    
    const team = await Team.findByIdAndUpdate(
      id,
      {
        name: name?.trim(),
        description: description?.trim(),
        teamLeaderId: teamLeaderId || undefined,
        members: memberIds || []
      },
      { new: true, runValidators: true }
    ).populate('teamLeaderId', 'username firstName lastName')
     .populate('members', 'username firstName lastName role');
    
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Update team members' teamId
    await User.updateMany(
      { teamId: id },
      { $unset: { teamId: "" } }
    );
    
    if (memberIds && memberIds.length > 0) {
      await User.updateMany(
        { _id: { $in: memberIds } },
        { teamId: id }
      );
    }

    // Update team leader's teamId and role
    if (teamLeaderId) {
      await User.findByIdAndUpdate(teamLeaderId, {
        teamId: id,
        role: 'team_leader'
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: team 
    });
  } catch (error: any) {
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

// DELETE - Delete team
export async function DELETE(
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
    
    // Remove team references from users
    await User.updateMany(
      { teamId: id },
      { 
        $unset: { teamId: "" },
        $set: { role: 'member' } // Reset team leaders to members
      }
    );
    
    // Soft delete the team
    const team = await Team.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Team deleted successfully' 
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}