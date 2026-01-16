'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GeoPhotoGallery, { GeotaggedPhoto } from '@/components/GeoPhotoGallery';
import ProjectTimeline from '@/components/ProjectTimeline';

interface PublicProjectDetail {
  _id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  startDate: string;
  endDate?: string;
  progress: number;
  contractId?: string;
  contractName?: string;
  appropriation?: string;
  location?: string;
  approvedBudgetContract?: number;
  contractDuration?: string;
  fundingSource?: string;
  createdAt: string;
  updatedAt: string;
  publicPhotos?: Array<{
    _id: string;
    filename: string;
    url: string;
    thumbnailUrl: string;
    description?: string;
    uploadedAt: string;
    generalLocation?: string;
  }>;
  geotaggedPhotos?: GeotaggedPhoto[];
}

export default function PublicProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [project, setProject] = useState<PublicProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setProjectId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/projects/${projectId}`);
      const data = await response.json();

      if (data.success) {
        setProject(data.data);
      } else {
        setError(data.error || 'Project not found');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'planning': 'bg-blue-100 text-blue-800 border-blue-200',
      'active': 'bg-green-100 text-green-800 border-green-200',
      'completed': 'bg-gray-100 text-gray-800 border-gray-200',
      'on-hold': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'high': 'bg-red-100 text-red-800 border-red-200',
      'medium': 'bg-amber-100 text-amber-800 border-amber-200',
      'low': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Not Found</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/public-projects')}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/public-projects')}
              className="text-amber-600 hover:text-amber-800 font-medium flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Projects
            </button>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(project.priority)}`}>
                {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)} Priority
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Compact Project Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h1>
                <p className="text-gray-600 text-sm leading-relaxed">{project.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getPriorityColor(project.priority)}`}>
                  {project.priority} priority
                </span>
              </div>
            </div>
            
            {/* Compact Info Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="text-xs font-medium text-gray-500">Start Date</label>
                <p className="text-sm text-gray-900 font-medium">
                  {new Date(project.startDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">End Date</label>
                <p className="text-sm text-gray-900 font-medium">
                  {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Progress</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{project.progress}%</span>
                </div>
              </div>
              {project.location && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Location</label>
                  <p className="text-sm text-gray-900 font-medium truncate" title={project.location}>
                    📍 {project.location}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Compact Contract Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Contract Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <label className="text-xs font-medium text-gray-500 block mb-1">Contract ID</label>
                <p className="text-sm text-gray-900 font-semibold font-mono">
                  {project.contractId || "26NEPRX037"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <label className="text-xs font-medium text-gray-500 block mb-1">Appropriation</label>
                <p className="text-sm text-gray-900 font-medium truncate" title={project.appropriation || "2025 GAA"}>
                  {project.appropriation || "2025 GAA"}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                <label className="text-xs font-medium text-purple-600 block mb-1">Funding Source</label>
                <p className="text-sm text-purple-900 font-medium truncate" title={project.fundingSource || "National Budget"}>
                  {project.fundingSource || "National Budget"}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                <label className="text-xs font-medium text-green-600 block mb-1">Approved Budget</label>
                <p className="text-lg text-green-900 font-bold">
                  ${(project.approvedBudgetContract || 2500000).toLocaleString()}
                </p>
              </div>
              {project.contractDuration && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <label className="text-xs font-medium text-blue-600 block mb-1">Duration</label>
                  <p className="text-sm text-blue-900 font-medium">{project.contractDuration}</p>
                </div>
              )}
            </div>
            {project.contractName && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="text-xs font-medium text-gray-500 block mb-1">Contract Name</label>
                <p className="text-sm text-gray-900 font-medium">
                  {project.contractName || "Construction of Multi-Purpose Building - 8th Infantry Battalion"}
                </p>
              </div>
            )}
          </div>

          {/* Project Timeline Visualization */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Project Timeline & Tasks
            </h3>
            <div className="mt-4">
              <ProjectTimeline projectId={project._id} compact={true} isPublic={true} />
            </div>
          </div>          {/* Geotagged Photos with GPS Verification */}
          {project.geotaggedPhotos && project.geotaggedPhotos.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900">Verified Project Photos</h3>
                <div className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  GPS Verified
                </div>
              </div>
              <GeoPhotoGallery
                projectId={project._id}
                compact={true}
                maxPhotos={20}
              />
            </div>
          )}

          {/* Public Photos (Fallback for legacy photos) */}
          {project.publicPhotos && project.publicPhotos.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <svg className="w-6 h-6 text-amber-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900">Project Photos</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.publicPhotos.map((photo) => (
                  <div key={photo._id} className="group relative">
                    <div className="aspect-w-16 aspect-h-12 overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={photo.thumbnailUrl}
                        alt={photo.description || 'Project photo'}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {photo.description && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent text-white p-3 rounded-b-lg">
                        <p className="text-sm font-medium">{photo.description}</p>
                        {photo.generalLocation && (
                          <div className="flex items-center text-xs opacity-90 mt-1">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {photo.generalLocation}
                          </div>
                        )}
                        <div className="flex items-center text-xs opacity-75 mt-1">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(photo.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div>
                <span>Project created: {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span>Information last updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}