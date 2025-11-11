// Enhanced team deletion with proper cleanup
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Team, User, Project } from '@/models';
import AuthUtils from '@/lib/auth/utils';
import mongoose from 'mongoose';

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
      const projectsUsingTeam = await Project.countDocuments({ teamId: id }).session(session);
      const usersInTeam = await User.countDocuments({ teamId: id }).session(session);

      // 3. Handle projects assigned to this team
      if (projectsUsingTeam > 0) {
        // Option A: Prevent deletion if projects exist
        await session.abortTransaction();
        return NextResponse.json({
          success: false,
          error: `Cannot delete team. ${projectsUsingTeam} project(s) are assigned to this team.`,
          details: {
            projectCount: projectsUsingTeam,
            userCount: usersInTeam,
            suggestion: "Reassign projects to other teams before deleting."
          }
        }, { status: 400 });

        // Option B: Automatically reassign projects (uncomment if preferred)
        /*
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
        */
      }

      // 4. Remove team references from users
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

      // 5. Soft delete the team (recommended) or hard delete
      const deletionResult = await Team.findByIdAndUpdate(
        id,
        { 
          isActive: false,
          deletedAt: new Date(),
          deletedBy: currentUser._id,
          updatedAt: new Date()
        },
        { new: true }
      ).session(session);

      // 6. Create audit log (optional)
      // await AuditLog.create({
      //   action: 'team_deleted',
      //   resourceId: id,
      //   userId: currentUser._id,
      //   metadata: {
      //     teamName: team.name,
      //     affectedUsers: userUpdateResult.modifiedCount,
      //     affectedProjects: projectsUsingTeam
      //   }
      // }).session(session);

      await session.commitTransaction();

      return NextResponse.json({
        success: true,
        message: 'Team deleted successfully',
        details: {
          teamName: team.name,
          usersAffected: userUpdateResult.modifiedCount,
          projectsChecked: projectsUsingTeam
        }
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