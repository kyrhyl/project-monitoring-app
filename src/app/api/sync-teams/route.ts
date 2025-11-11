import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Team from '@/models/Team';
import AuthUtils from '@/lib/auth/utils';

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

    console.log('Starting team member synchronization...');

    // Clear all team members arrays first
    await Team.updateMany({}, { $set: { members: [] } });
    console.log('Cleared all team members arrays');

    // Get all active users with team assignments
    const usersWithTeams = await User.find({ 
      teamId: { $exists: true, $ne: null },
      isActive: true 
    }).select('_id teamId username firstName lastName');

    console.log(`Found ${usersWithTeams.length} users with team assignments`);

    // Group users by team
    const teamGroups = new Map<string, Array<{ userId: any; username: string; name: string }>>();
    
    for (const user of usersWithTeams) {
      if (!user.teamId) continue; // Skip users without teamId
      
      const teamId = user.teamId.toString();
      if (!teamGroups.has(teamId)) {
        teamGroups.set(teamId, []);
      }
      teamGroups.get(teamId)!.push({
        userId: user._id,
        username: user.username,
        name: `${user.firstName} ${user.lastName}`
      });
    }

    const syncResults = [];

    // Update each team with its members
    for (const [teamId, members] of teamGroups) {
      const memberIds = members.map((m: { userId: any; username: string; name: string }) => m.userId);
      
      const result = await Team.findByIdAndUpdate(
        teamId,
        { $set: { members: memberIds } },
        { new: true }
      ).populate('members', 'username firstName lastName');

      syncResults.push({
        teamId,
        teamName: result?.name || 'Unknown Team',
        membersCount: memberIds.length,
        members: members.map((m: { userId: any; username: string; name: string }) => ({ username: m.username, name: m.name }))
      });

      console.log(`Updated team ${result?.name || teamId} with ${memberIds.length} members:`, 
        members.map((m: { userId: any; username: string; name: string }) => m.name).join(', '));
    }

    console.log('Team synchronization completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Team members synchronized successfully',
      data: {
        usersProcessed: usersWithTeams.length,
        teamsUpdated: syncResults.length,
        syncResults
      }
    });

  } catch (error: any) {
    console.error('Team sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}