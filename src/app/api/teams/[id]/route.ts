import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';
import User from '@/models/User';
import AuthUtils from '@/lib/auth/utils';
import TeamSlotManager from '@/lib/teamSlotManager';
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
      .populate('leaderSlot.currentHolder', 'username firstName lastName')
      .populate('memberSlots.currentHolder', 'username firstName lastName role')
      .lean();
    
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Enhance with slot manager information
    const enhancedTeam = {
      ...team,
      currentLeader: TeamSlotManager.getCurrentLeader(team as any),
      currentMembers: TeamSlotManager.getCurrentMembers(team as any),
      leaderHistory: TeamSlotManager.getLeaderHistory(team as any),
      memberCount: TeamSlotManager.getCurrentMembers(team as any).length
    };
    
    return NextResponse.json({ 
      success: true, 
      data: enhancedTeam 
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

// DELETE - Enhanced team deletion with safety checks
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

    // Start transaction for data consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Find the team to delete
      const team = await Team.findById(id).session(session);
      if (!team) {
        await session.abortTransaction();
        return NextResponse.json(
          { success: false, error: 'Team not found' },
          { status: 404 }
        );
      }

      // 2. Check for dependent data
      const usersInTeam = await User.countDocuments({ teamId: id }).session(session);
      
      // Import Project model dynamically to avoid circular dependencies
      let projectsUsingTeam = 0;
      try {
        const { Project } = await import('@/models');
        projectsUsingTeam = await Project.countDocuments({ teamId: id }).session(session);
      } catch (error) {
        console.log('Project model not available, skipping project check');
      }

      // 3. Get query parameter for force delete
      const url = new URL(request.url);
      const forceDelete = url.searchParams.get('force') === 'true';

      // 4. Check for dependencies and warn user
      if (!forceDelete && (projectsUsingTeam > 0 || usersInTeam > 0)) {
        await session.abortTransaction();
        return NextResponse.json({
          success: false,
          error: 'Team has dependencies that must be handled first',
          details: {
            teamName: team.name,
            projectCount: projectsUsingTeam,
            userCount: usersInTeam,
            canForceDelete: true,
            warning: 'Force deletion will remove team references from all projects and users'
          },
          actions: {
            forceDelete: `/api/teams/${id}?force=true`,
            reassignUsers: `/api/teams/${id}/reassign`,
            viewProjects: `/api/projects?teamId=${id}`
          }
        }, { status: 409 }); // Conflict status
      }

      // 5. Handle projects assigned to this team (if force delete)
      if (projectsUsingTeam > 0) {
        try {
          const { Project } = await import('@/models');
          await Project.updateMany(
            { teamId: id },
            { 
              $unset: { teamId: 1 },
              $set: { 
                status: 'on-hold', // Mark as on-hold until reassigned
                updatedAt: new Date()
              }
            }
          ).session(session);
          console.log(`Updated ${projectsUsingTeam} projects to remove team reference`);
        } catch (error) {
          console.log('Could not update projects:', error);
        }
      }

      // 6. Remove team references from users
      const userUpdateResult = await User.updateMany(
        { teamId: id },
        { 
          $unset: { teamId: 1 },
          $set: { 
            role: 'member', // Reset team leaders to members
            updatedAt: new Date()
          }
        }
      ).session(session);

      // 7. Soft delete the team (preserves historical data)
      const deletionResult = await Team.findByIdAndUpdate(
        id,
        { 
          isActive: false,
          deletedAt: new Date(),
          deletedBy: currentUser.username || 'admin',
          updatedAt: new Date(),
          // Keep original name for reference but mark as deleted
          originalName: team.name,
          name: `${team.name} [DELETED]`
        },
        { new: true }
      ).session(session);

      await session.commitTransaction();

      return NextResponse.json({
        success: true,
        message: 'Team deleted successfully',
        details: {
          teamName: team.name,
          usersAffected: userUpdateResult.modifiedCount,
          projectsAffected: projectsUsingTeam,
          deletionType: 'soft',
          canRestore: true
        },
        warning: projectsUsingTeam > 0 ? 
          `${projectsUsingTeam} project(s) were set to 'on-hold' and need reassignment` : null
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error: any) {
    console.error('Team deletion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete team',
        details: error.message 
      },
      { status: 500 }
    );
  }
}