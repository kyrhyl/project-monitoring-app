import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models';
import dbConnect from '@/lib/mongodb';

interface BulkResult {
  successful: Array<{
    userData: any;
    createdUser: {
      _id: any;
      firstName: string;
      lastName: string;
      username: string;
      role: string;
      email?: string;
      teamId?: string;
    };
  }>;
  failed: Array<{
    userData: any;
    error: string;
  }>;
}

export async function POST(request: NextRequest) {
  console.log('🚀 Bulk import API called');
  
  try {
    await dbConnect();
    console.log('✅ Database connected');

    const body = await request.json();
    console.log('📦 Request body:', body);
    
    const { users } = body;

    if (!users || !Array.isArray(users)) {
      console.log('❌ Invalid users array:', users);
      return NextResponse.json(
        { error: 'Users array is required' },
        { status: 400 }
      );
    }

    console.log(`👥 Processing ${users.length} users`);

    const results: BulkResult = {
      successful: [],
      failed: []
    };

    // Process each user
    for (const userData of users) {
      console.log(`🔄 Processing user:`, userData);
      
      try {
        const { firstName, lastName, username, role, email, teamId, teamName, password } = userData;

        console.log(`👤 User data: ${firstName} ${lastName} (${username}) - ${role}`);

        // Validate required fields
        if (!firstName || !lastName || !username || !role) {
          console.log(`❌ Validation failed for ${username}: missing required fields`);
          results.failed.push({
            userData,
            error: 'First name, last name, username, and role are required'
          });
          continue;
        }

        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          results.failed.push({
            userData,
            error: `Username '${username}' already exists`
          });
          continue;
        }

        // Create user object
        const userObj: any = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: username.trim().toLowerCase(),
          role,
          password: password || username.trim().toLowerCase(), // Use provided password or default to username
        };

        // Only add email if it's provided and not empty
        if (email && email.trim() !== '') {
          userObj.email = email.trim();
        }

        // Handle team assignment - either by teamId or teamName
        if (teamId && teamId.trim() !== '') {
          userObj.teamId = teamId.trim();
        } else if (teamName && teamName.trim() !== '') {
          // Look up team by name
          const { Team } = await import('@/models');
          const team = await Team.findOne({ name: teamName.trim() });
          if (team) {
            userObj.teamId = team._id;
          } else {
            // Create team if it doesn't exist
            const newTeam = new Team({
              name: teamName.trim(),
              description: `Auto-created team for ${teamName.trim()}`,
              isActive: true
            });
            const savedTeam = await newTeam.save();
            userObj.teamId = savedTeam._id;
          }
        }

        // Create the user
        const newUser = new User(userObj);
        const savedUser = await newUser.save();

        results.successful.push({
          userData,
          createdUser: {
            _id: savedUser._id,
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            username: savedUser.username,
            role: savedUser.role,
            email: savedUser.email,
            teamId: savedUser.teamId ? savedUser.teamId.toString() : undefined
          }
        });

      } catch (error: any) {
        results.failed.push({
          userData,
          error: error.message || 'Unknown error occurred'
        });
      }
    }

    return NextResponse.json({
      message: 'Bulk user creation completed',
      results,
      summary: {
        total: users.length,
        successful: results.successful.length,
        failed: results.failed.length
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Bulk user creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}