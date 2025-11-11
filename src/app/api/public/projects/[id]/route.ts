import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import mongoose from 'mongoose';

// Public interface for detailed project data
interface PublicProjectDetail {
  _id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  startDate: Date;
  endDate?: Date;
  progress: number;
  contractId?: string;
  contractName?: string;
  appropriation?: string;
  location?: string;
  approvedBudgetContract?: number;
  contractDuration?: string;
  fundingSource?: string;
  createdAt: Date;
  updatedAt: Date;
  publicPhotos?: any[];
  geotaggedPhotos?: any[];
}

// GET - Fetch specific project details for public view
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }
    
    // Fetch project with only public-safe fields
    const project = await Project.findById(id)
      .select('name description status priority startDate endDate progress contractId contractName appropriation location approvedBudgetContract contractDuration fundingSource geotaggedPhotos createdAt updatedAt')
      .lean();
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Type assertion for the project data
    const projectData = project as any;
    
    // Sanitize and prepare public project data
    const publicProject: PublicProjectDetail = {
      _id: projectData._id.toString(),
      name: projectData.name,
      description: projectData.description,
      status: projectData.status,
      priority: projectData.priority,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      progress: projectData.progress,
      contractId: projectData.contractId,
      contractName: projectData.contractName,
      appropriation: projectData.appropriation,
      location: projectData.location ? projectData.location.split(',')[0] : undefined, // General location only
      approvedBudgetContract: projectData.approvedBudgetContract,
      contractDuration: projectData.contractDuration,
      fundingSource: projectData.fundingSource,
      createdAt: projectData.createdAt,
      updatedAt: projectData.updatedAt,
      // Provide complete geotagged photos with GPS verification for transparency
      geotaggedPhotos: projectData.geotaggedPhotos?.filter((photo: any) => 
        !photo.description?.toLowerCase().includes('internal') &&
        !photo.description?.toLowerCase().includes('private')
      ).map((photo: any) => ({
        _id: photo._id,
        filename: photo.filename,
        originalName: photo.originalName,
        cloudinaryId: photo.cloudinaryId,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        mimetype: photo.mimetype,
        size: photo.size,
        uploadedBy: photo.uploadedBy,
        uploadedAt: photo.uploadedAt,
        description: photo.description,
        // Include GPS data for transparency and verification
        geoData: photo.geoData ? {
          latitude: photo.geoData.latitude,
          longitude: photo.geoData.longitude,
          altitude: photo.geoData.altitude,
          accuracy: photo.geoData.accuracy,
          address: photo.geoData.address,
          city: photo.geoData.city,
          country: photo.geoData.country
        } : undefined,
        exifData: photo.exifData
      })) || [],
      // Legacy photos for backward compatibility
      publicPhotos: projectData.geotaggedPhotos?.filter((photo: any) => 
        !photo.description?.toLowerCase().includes('internal') &&
        !photo.description?.toLowerCase().includes('private')
      ).map((photo: any) => ({
        _id: photo._id,
        filename: photo.filename,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        description: photo.description,
        uploadedAt: photo.uploadedAt,
        generalLocation: photo.geoData?.city || photo.geoData?.address?.split(',')[0]
      })) || []
    };
    
    return NextResponse.json({
      success: true,
      data: publicProject
    });
    
  } catch (error) {
    console.error('Error fetching public project details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project details' },
      { status: 500 }
    );
  }
}