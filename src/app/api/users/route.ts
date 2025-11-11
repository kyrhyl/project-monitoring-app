import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import AuthUtils from '@/lib/auth/utils';

// GET - Fetch all users (admin only)
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

    const users = await User.find({ isActive: true })
      .populate('teamId', 'name')
      .populate('createdBy', 'username')
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: users
    });

  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new user (admin only)
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

    const { username, email, password, firstName, lastName, role, teamId } = await request.json();
    
    console.log('Received data:', { username, email, password: '***', firstName, lastName, role, teamId });

    // Validate required fields
    if (!username || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'Username, password, first name, and last name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUserQuery: any = { username: username.toLowerCase() };
    if (email && email.trim()) {
      existingUserQuery.$or = [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ];
    }

    const existingUser = await User.findOne(existingUserQuery);

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' + (email ? ' or email already exists' : '') },
        { status: 400 }
      );
    }

    const userData: any = {
      username: username.toLowerCase(),
      password,
      firstName,
      lastName,
      role: role || 'member',
      teamId: teamId || undefined,
      createdBy: currentUser.userId
    };

    // Only add email if provided and not empty
    if (email && email.trim() && email.trim().length > 0) {
      userData.email = email.toLowerCase();
    }
    // Don't include email field at all if not provided to avoid null constraint issues

    console.log('User data to save:', { ...userData, password: '***' });

    const user = await User.create(userData);
    const populatedUser = await User.findById(user._id)
      .populate('teamId', 'name')
      .select('-password')
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        data: populatedUser
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Create user error:', error);
    
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