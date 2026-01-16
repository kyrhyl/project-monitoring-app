import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import AuthUtils from '@/lib/auth/utils';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const currentUser = AuthUtils.getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const teamId = searchParams.get('teamId');
    const userId = searchParams.get('userId');

    // Build query filter
    const filter: any = {
      status: 'completed',
      completedAt: { $exists: true, $ne: null },
      dueDate: { $exists: true, $ne: null }
    };

    if (projectId) {
      filter.projectId = projectId;
    }

    if (userId) {
      filter.assigneeId = userId;
    }

    // If teamId is specified, need to filter by projects belonging to that team
    if (teamId) {
      const Project = (await import('@/models')).Project;
      const teamProjects = await Project.find({ teamId }).select('_id').lean();
      const projectIds = teamProjects.map((p: any) => p._id);
      filter.projectId = { $in: projectIds };
    }

    // Fetch completed tasks with dates
    const tasks = await Task.find(filter)
      .select('completedAt dueDate')
      .lean();

    if (tasks.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalCompleted: 0,
          completedEarly: 0,
          completedOnTime: 0,
          completedLate: 0,
          averageDaysEarly: 0,
          averageDaysLate: 0,
          onTimePercentage: 0
        }
      });
    }

    let completedEarly = 0;
    let completedOnTime = 0;
    let completedLate = 0;
    let totalEarlyDays = 0;
    let totalLateDays = 0;
    let earlyCount = 0;
    let lateCount = 0;

    tasks.forEach((task: any) => {
      const completed = new Date(task.completedAt);
      const due = new Date(task.dueDate);
      
      // Set to midnight for fair comparison
      completed.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      
      const diffDays = Math.ceil((due.getTime() - completed.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        completedEarly++;
        totalEarlyDays += diffDays;
        earlyCount++;
      } else if (diffDays === 0) {
        completedOnTime++;
      } else {
        completedLate++;
        totalLateDays += Math.abs(diffDays);
        lateCount++;
      }
    });

    const stats = {
      totalCompleted: tasks.length,
      completedEarly,
      completedOnTime,
      completedLate,
      averageDaysEarly: earlyCount > 0 ? totalEarlyDays / earlyCount : 0,
      averageDaysLate: lateCount > 0 ? totalLateDays / lateCount : 0,
      onTimePercentage: ((completedEarly + completedOnTime) / tasks.length) * 100
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Get performance stats error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
