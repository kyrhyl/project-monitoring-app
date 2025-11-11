import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Project, Team, User } from '@/models';
import AuthUtils from '@/lib/auth/utils';
import mongoose from 'mongoose';

// GET - Fetch single project
export async function GET(
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
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }
    
    const project = await Project.findById(id)
      .populate('teamId', 'name')
      .populate('createdBy', 'username firstName lastName')
      .lean();
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (currentUser.role === 'member' && (project as any).teamId?.toString() !== currentUser.teamId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: project 
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update project
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
    
    // Only admin and team_leader can update projects
    if (currentUser.role === 'member') {
      return NextResponse.json(
        { success: false, error: 'Permission denied. Only admins and team leaders can update projects.' },
        { status: 403 }
      );
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }
    
    const updateData = await request.json();
    
    // Debug logging
    console.log('Update data received:', updateData);
    console.log('Start date:', updateData.startDate, 'End date:', updateData.endDate);
    
    // Validate required fields
    if (!updateData.name || !updateData.description || !updateData.startDate) {
      return NextResponse.json(
        { success: false, error: 'Name, description, and start date are required' },
        { status: 400 }
      );
    }
    
    // Validate date logic - only if both dates are provided and valid
    if (updateData.endDate && updateData.endDate !== null && updateData.endDate.trim() !== '') {
      const startDate = new Date(updateData.startDate);
      const endDate = new Date(updateData.endDate);
      
      console.log('Validating dates - Start:', updateData.startDate, 'End:', updateData.endDate);
      console.log('Parsed start date:', startDate, 'Parsed end date:', endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid date format' },
          { status: 400 }
        );
      }
      
      // Create date objects with just the date part (no time)
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      console.log('Date comparison - Start:', startDateOnly, 'End:', endDateOnly);
      console.log('End date after start?', endDateOnly > startDateOnly);
      
      if (endDateOnly <= startDateOnly) {
        console.log('VALIDATION FAILED: End date not after start date');
        return NextResponse.json(
          { success: false, error: 'End date must be after start date' },
          { status: 400 }
        );
      }
      
      console.log('Date validation passed');
    }
    
    // Validate progress
    if (updateData.progress !== undefined && (updateData.progress < 0 || updateData.progress > 100)) {
      return NextResponse.json(
        { success: false, error: 'Progress must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate approved budget
    if (updateData.approvedBudgetContract !== undefined && updateData.approvedBudgetContract < 0) {
      return NextResponse.json(
        { success: false, error: 'Approved budget cannot be negative' },
        { status: 400 }
      );
    }
    
    const project = await Project.findByIdAndUpdate(
      id,
      {
        $set: {
          name: updateData.name.trim(),
          description: updateData.description.trim(),
          status: updateData.status,
          priority: updateData.priority,
          startDate: new Date(updateData.startDate),
          endDate: updateData.endDate ? new Date(updateData.endDate) : null,
          progress: updateData.progress,
          contractId: updateData.contractId?.trim() || null,
          contractName: updateData.contractName?.trim() || null,
          appropriation: updateData.appropriation?.trim() || null,
          location: updateData.location?.trim() || null,
          approvedBudgetContract: updateData.approvedBudgetContract || null,
          contractDuration: updateData.contractDuration?.trim() || null,
          fundingSource: updateData.fundingSource?.trim() || null,
          updatedAt: new Date()
        }
      },
      { 
        new: true,
        runValidators: true
      }
    )
      .populate('teamId', 'name')
      .populate('createdBy', 'username firstName lastName')
      .lean();
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: project,
      message: 'Project updated successfully' 
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete project
export async function DELETE(
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
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }
    
    const project = await Project.findByIdAndDelete(id);
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Project deleted successfully' 
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}