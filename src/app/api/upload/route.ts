import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import AuthUtils from '@/lib/auth/utils';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import Task from '@/models/Task';

// File type validation
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const currentUser = AuthUtils.getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string; // 'project' or 'task'
    const entityId = formData.get('entityId') as string;
    const description = formData.get('description') as string;

    if (!file || !entityType || !entityId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Verify entity exists and user has access
    if (entityType === 'project') {
      const project = await Project.findById(entityId);
      if (!project) {
        return NextResponse.json(
          { success: false, error: 'Project not found' },
          { status: 404 }
        );
      }

      // Check permissions based on user role
      if (currentUser.role === 'member') {
        const isTeamMember = project.teamMembers?.includes(currentUser.userId) ||
                            project.teamId?.toString() === currentUser.teamId;
        if (!isTeamMember) {
          return NextResponse.json(
            { success: false, error: 'Access denied' },
            { status: 403 }
          );
        }
      }
    } else if (entityType === 'task') {
      const task = await Task.findById(entityId).populate('projectId');
      if (!task) {
        return NextResponse.json(
          { success: false, error: 'Task not found' },
          { status: 404 }
        );
      }

      // Check if user can access this task's project
      const project = task.projectId as any;
      if (currentUser.role === 'member') {
        const isTeamMember = project.teamMembers?.includes(currentUser.userId) ||
                            project.teamId?.toString() === currentUser.teamId;
        const isAssignee = task.assigneeId?.toString() === currentUser.userId;
        
        if (!isTeamMember && !isAssignee) {
          return NextResponse.json(
            { success: false, error: 'Access denied' },
            { status: 403 }
          );
        }
      }
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(
      fileBuffer,
      file.name,
      `${entityType}s/${entityId}`
    );

    // Create file attachment object
    const attachment = {
      filename: uploadResult.original_filename,
      originalName: file.name,
      cloudinaryId: uploadResult.public_id,
      url: uploadResult.secure_url,
      mimetype: file.type,
      size: uploadResult.bytes,
      uploadedBy: currentUser.userId,
      uploadedAt: new Date(),
      description: description || '',
    };

    // Add attachment to entity
    if (entityType === 'project') {
      await Project.findByIdAndUpdate(
        entityId,
        { $push: { attachments: attachment } },
        { new: true }
      );
    } else if (entityType === 'task') {
      await Task.findByIdAndUpdate(
        entityId,
        { $push: { attachments: attachment } },
        { new: true }
      );
    }

    return NextResponse.json({
      success: true,
      data: attachment,
    });

  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const currentUser = AuthUtils.getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const attachmentId = searchParams.get('attachmentId');

    if (!entityType || !entityId || !attachmentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get the entity and find the attachment
    let entity;
    if (entityType === 'project') {
      entity = await Project.findById(entityId);
    } else if (entityType === 'task') {
      entity = await Task.findById(entityId);
    }

    if (!entity) {
      return NextResponse.json(
        { success: false, error: 'Entity not found' },
        { status: 404 }
      );
    }

    // Find the attachment
    const attachment = entity.attachments?.find(
      (att: any) => att._id.toString() === attachmentId
    );

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Check permissions - only uploader or admin/team leader can delete
    if (currentUser.role === 'member' && 
        attachment.uploadedBy.toString() !== currentUser.userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete from Cloudinary
    try {
      const { deleteFromCloudinary } = await import('@/lib/cloudinary');
      await deleteFromCloudinary(attachment.cloudinaryId);
    } catch (cloudinaryError) {
      console.error('Cloudinary delete error:', cloudinaryError);
      // Continue even if Cloudinary delete fails
    }

    // Remove attachment from entity
    if (entityType === 'project') {
      await Project.findByIdAndUpdate(
        entityId,
        { $pull: { attachments: { _id: attachmentId } } }
      );
    } else if (entityType === 'task') {
      await Task.findByIdAndUpdate(
        entityId,
        { $pull: { attachments: { _id: attachmentId } } }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Attachment deleted successfully',
    });

  } catch (error: any) {
    console.error('File delete error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Delete failed' },
      { status: 500 }
    );
  }
}