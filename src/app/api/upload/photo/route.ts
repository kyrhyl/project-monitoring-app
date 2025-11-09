import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import connectToDatabase from '@/lib/mongodb';
import Project from '@/models/Project';
import AuthUtils from '@/lib/auth/utils';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface GeotaggedPhoto {
  _id?: string;
  filename: string;
  originalName: string;
  cloudinaryId: string;
  url: string;
  thumbnailUrl: string;
  mimetype: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
  geoData?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
    address?: string;
    city?: string;
    country?: string;
  };
  exifData?: {
    make?: string;
    model?: string;
    dateTime?: string;
    orientation?: number;
    flash?: boolean;
  };
}

// POST - Upload geotagged photo
export async function POST(request: NextRequest) {
  try {
    const currentUser = AuthUtils.getUserFromRequest(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const geoDataString = formData.get('geoData') as string;
    const exifDataString = formData.get('exifData') as string;
    const description = formData.get('description') as string;

    if (!file || !projectId) {
      return NextResponse.json(
        { message: 'File and project ID are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (25MB limit for high-quality photos)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: 'File size must be less than 25MB' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user has access to this project
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    const hasAccess = 
      currentUser.role === 'admin' ||
      project.createdBy.toString() === currentUser.userId ||
      project.teamMembers?.some((member: any) => member.toString() === currentUser.userId) ||
      (currentUser.role === 'team_leader' && project.teamId?.toString() === currentUser.teamId);

    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `geotagged_${projectId}_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Upload original image to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: filename,
          folder: 'project_photos',
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    }) as any;

    // Generate thumbnail
    const thumbnailUrl = cloudinary.url(uploadResult.public_id, {
      width: 300,
      height: 300,
      crop: 'fill',
      quality: 'auto',
      format: 'auto'
    });

    // Parse geo and EXIF data
    let geoData = null;
    let exifData = null;

    try {
      if (geoDataString) {
        geoData = JSON.parse(geoDataString);
      }
    } catch (e) {
      console.warn('Failed to parse geo data:', e);
    }

    try {
      if (exifDataString) {
        exifData = JSON.parse(exifDataString);
      }
    } catch (e) {
      console.warn('Failed to parse EXIF data:', e);
    }

    // Create photo object
    const newPhoto: GeotaggedPhoto = {
      filename: filename,
      originalName: file.name,
      cloudinaryId: uploadResult.public_id,
      url: uploadResult.secure_url,
      thumbnailUrl: thumbnailUrl,
      mimetype: file.type,
      size: file.size,
      uploadedBy: currentUser.userId,
      uploadedAt: new Date(),
      description: description || '',
      geoData: geoData,
      exifData: exifData
    };

    // Add photo to project
    await Project.findByIdAndUpdate(
      projectId,
      { 
        $push: { 
          geotaggedPhotos: newPhoto 
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Photo uploaded successfully',
      photo: newPhoto
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete geotagged photo
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = AuthUtils.getUserFromRequest(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const photoId = url.searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json(
        { message: 'Photo ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find project containing this photo
    const project = await Project.findOne({
      'geotaggedPhotos._id': photoId
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Photo not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const photo = project.geotaggedPhotos.find((p: any) => p._id.toString() === photoId);
    
    const canDelete = 
      currentUser.role === 'admin' ||
      project.createdBy.toString() === currentUser.userId ||
      photo.uploadedBy === currentUser.userId ||
      (currentUser.role === 'team_leader' && project.teamId?.toString() === currentUser.teamId);

    if (!canDelete) {
      return NextResponse.json(
        { message: 'Permission denied' },
        { status: 403 }
      );
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(photo.cloudinaryId);
    } catch (cloudinaryError) {
      console.warn('Failed to delete from Cloudinary:', cloudinaryError);
      // Continue with database deletion even if Cloudinary fails
    }

    // Remove from project
    await Project.findByIdAndUpdate(
      project._id,
      {
        $pull: {
          geotaggedPhotos: { _id: photoId }
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully'
    });

  } catch (error) {
    console.error('Photo delete error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}