import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';
import AuthUtils from '@/lib/auth/utils';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const currentUser = AuthUtils.getUserFromRequest(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch full user data from database
    const user = await User.findById(currentUser.userId)
      .populate('teamId', 'name')
      .select('-password')
      .lean() as any;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        teamId: user.teamId?._id || null,
        teamName: user.teamId?.name || null
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}