import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';

// Public interface for sanitized project data
interface PublicProject {
  _id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  startDate: Date;
  endDate?: Date;
  progress: number;
  contractId?: string;
  appropriation?: string;
  location?: string;
  approvedBudgetContract?: number;
  contractDuration?: string;
  remarks?: string;
  teamMembers?: Array<{
    _id: string;
    firstName?: string;
    lastName?: string;
    username: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// GET - Fetch public projects with filtering
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const location = searchParams.get('location');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    
    // Build query for public projects
    let query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { contractId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build sort object
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    let sortObject: any = {};
    sortObject[sortBy] = sortDirection;
    
    // Fetch projects with sanitized fields only
    const projects = await Project.find(query)
      .select('name description status priority startDate endDate progress contractId appropriation location approvedBudgetContract contractDuration remarks teamMembers createdAt updatedAt')
      .populate('teamMembers', 'firstName lastName username')
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const total = await Project.countDocuments(query);
    
    // Sanitize data for public consumption
    const publicProjects: PublicProject[] = projects.map((project: any) => ({
      _id: project._id.toString(),
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      endDate: project.endDate,
      progress: project.progress,
      contractId: project.contractId,
      appropriation: project.appropriation,
      location: project.location ? project.location.split(',')[0] : undefined, // Only show general location
      approvedBudgetContract: project.approvedBudgetContract,
      contractDuration: project.contractDuration,
      remarks: project.remarks,
      teamMembers: project.teamMembers,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }));
    
    return NextResponse.json({
      success: true,
      data: publicProjects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching public projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch public projects' },
      { status: 500 }
    );
  }
}