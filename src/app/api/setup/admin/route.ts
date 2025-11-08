import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// POST - Initialize admin account
export async function POST() {
  try {
    await dbConnect();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin', username: 'admin' });
    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Admin account already exists',
        data: {
          username: existingAdmin.username,
          email: existingAdmin.email,
          role: existingAdmin.role
        }
      });
    }

    // Create default admin account
    const adminData = {
      username: 'admin',
      email: 'admin@projectmonitor.com',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      isActive: true
    };

    const admin = await User.create(adminData);

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        username: admin.username,
        email: admin.email,
        role: admin.role,
        credentials: {
          username: 'admin',
          password: 'admin123'
        }
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Admin setup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to setup admin account' },
      { status: 500 }
    );
  }
}