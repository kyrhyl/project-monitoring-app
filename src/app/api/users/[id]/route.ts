import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Team from '@/models/Team';
import AuthUtils from '@/lib/auth/utils';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// PUT - Update user (admin or self)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;
    
    const currentUser = AuthUtils.getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const canEdit = currentUser.role === 'admin' || 
                   currentUser.userId === id ||
                   AuthUtils.canManageUser(currentUser.role, targetUser.role);

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    const updateData = await request.json();
    
    console.log('Raw update data received:', updateData);
    
    // Clean up data before processing
    // Handle empty teamId - convert empty string to undefined/null
    if (updateData.teamId === '' || updateData.teamId === null) {
      updateData.teamId = undefined;
    }
    
    // Handle empty email - convert empty string to undefined
    if (updateData.email === '' || updateData.email === null) {
      updateData.email = undefined;
    }
    
    // Remove undefined values from updateData
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    console.log('Cleaned update data:', updateData);
    
    // Prevent non-admins from changing roles
    if (currentUser.role !== 'admin' && updateData.role) {
      delete updateData.role;
    }

    // Prevent users from deactivating themselves
    if (currentUser.userId === id && updateData.isActive === false) {
      delete updateData.isActive;
    }

    // Hash password if it's being updated
    if (updateData.password) {
      try {
        const salt = await bcrypt.genSalt(12);
        updateData.password = await bcrypt.hash(updateData.password, salt);
        console.log('Password hashed for update');
      } catch (error) {
        console.error('Password hashing failed:', error);
        return NextResponse.json(
          { success: false, error: 'Password hashing failed' },
          { status: 500 }
        );
      }
    }

    // Get the current user to check for team changes
    const currentUserDoc = await User.findById(id);
    const oldTeamId = currentUserDoc?.teamId;
    const newTeamId = updateData.teamId;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('teamId', 'name').select('-password');

    // Synchronize team members if team assignment changed
    if (oldTeamId?.toString() !== newTeamId?.toString()) {
      console.log('Team assignment changed, synchronizing teams...');
      
      // Remove user from old team
      if (oldTeamId) {
        await Team.findByIdAndUpdate(
          oldTeamId,
          { $pull: { members: id } }
        );
        console.log('Removed user from old team:', oldTeamId);
      }
      
      // Add user to new team
      if (newTeamId) {
        await Team.findByIdAndUpdate(
          newTeamId,
          { $addToSet: { members: id } }
        );
        console.log('Added user to new team:', newTeamId);
      }
    }

    console.log('Updated user result:', updatedUser);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error: any) {
    console.error('Update user error:', error);
    
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

// DELETE - Delete user (admin only)
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
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (currentUser.userId === id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}