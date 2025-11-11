import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Team } from '@/models';
import AuthUtils from '@/lib/auth/utils';
import mongoose from 'mongoose';

// POST - Restore a soft-deleted team
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

    // Find the deleted team
    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    if (team.isActive) {
      return NextResponse.json(
        { success: false, error: 'Team is not deleted' },
        { status: 400 }
      );
    }

    // Restore the team
    const restoredTeam = await Team.findByIdAndUpdate(
      id,
      { 
        isActive: true,
        $unset: { 
          deletedAt: 1, 
          deletedBy: 1 
        },
        // Restore original name if it was marked as deleted
        name: team.originalName || team.name.replace(' [DELETED]', ''),
        updatedAt: new Date()
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Team restored successfully',
      data: restoredTeam
    });

  } catch (error: any) {
    console.error('Team restoration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to restore team',
        details: error.message 
      },
      { status: 500 }
    );
  }
}