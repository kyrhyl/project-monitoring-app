import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import AuthUtils from '@/lib/auth/utils';

// GET - Get current user info
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const user = AuthUtils.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get updated user data from database
    const userData = await User.findById(user.userId)
      .populate('teamId', 'name')
      .select('-password');

    if (!userData || !userData.isActive) {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData._id,
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        teamId: userData.teamId?._id,
        teamName: (userData.teamId as any)?.name,
        lastLogin: userData.lastLogin
      }
    });

  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}