'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IProject } from '@/models/Project';
import TeamMemberManagement from '@/components/TeamMemberManagement';
import TaskManagement from '@/components/TaskManagement';
import ProjectCalendar from '@/components/ProjectCalendar';
import FileManager from '@/components/FileManager';
import GeoPhotoGallery from '@/components/GeoPhotoGallery';
import EditProject from '@/components/EditProject';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'team_leader' | 'member';
  teamName?: string;
}

interface ProjectDetailsProps {
  projectId: string;
}

const ProjectDetailsPage = ({ projectId }: ProjectDetailsProps) => {
  const [project, setProject] = useState<IProject | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    fetchCurrentUser();
    fetchProject();
  }, [projectId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/user');
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Auth endpoint not found, user may need to log in again');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          alert('Project not found');
          router.push('/dashboard');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProject(data.data);
      } else {
        alert(data.error || 'Project not found');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      alert('Failed to load project');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on-hold': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canManageTeam = currentUser?.role === 'admin' || currentUser?.role === 'team_leader';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900"></div>
      </div>
    );
  }

  if (!project || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Project not found</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-2 text-amber-600 hover:text-amber-800"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                  <p className="text-gray-600">{project.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(project.priority)}`}>
                  {project.priority} priority
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-amber-900 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-amber-900 text-amber-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            {canManageTeam && (
              <button
                onClick={() => setActiveTab('team')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'team'
                    ? 'border-amber-900 text-amber-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Team Management
              </button>
            )}
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-amber-900 text-amber-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'calendar'
                  ? 'border-amber-900 text-amber-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'files'
                  ? 'border-amber-900 text-amber-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Files
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'photos'
                  ? 'border-amber-900 text-amber-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Photos
            </button>
            {canManageTeam && (
              <button
                onClick={() => setActiveTab('edit')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'edit'
                    ? 'border-amber-900 text-amber-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Edit Project
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Project Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Project Timeline</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Start Date</label>
                    <p className="text-gray-900">
                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">End Date</label>
                    <p className="text-gray-900">
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Project Status</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Status</label>
                    <p className="text-gray-900 capitalize">{project.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Priority</label>
                    <p className="text-gray-900 capitalize">{project.priority}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {canManageTeam && (
                    <>
                      <button 
                        onClick={() => setActiveTab('edit')}
                        className="w-full text-left px-3 py-2 text-sm text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        Edit Project
                      </button>
                      <button 
                        onClick={() => setActiveTab('team')}
                        className="w-full text-left px-3 py-2 text-sm text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        Manage Team
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => setActiveTab('tasks')}
                    className="w-full text-left px-3 py-2 text-sm text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    View Tasks
                  </button>
                </div>
              </div>
            </div>

            {/* Project Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Project Description</h3>
              <p className="text-gray-600 leading-relaxed">{project.description}</p>
            </div>

            {/* Contract Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contract Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Contract ID</label>
                  <p className="text-gray-900 font-medium">{project.contractId || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Appropriation</label>
                  <p className="text-gray-900 font-medium">{project.appropriation || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Contract Duration</label>
                  <p className="text-gray-900 font-medium">{project.contractDuration || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Project Location</label>
                  <p className="text-gray-900 font-medium">{project.location || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Approved Budget (ABC)</label>
                  <p className="text-gray-900 font-medium">
                    {project.approvedBudgetContract 
                      ? `$${Number(project.approvedBudgetContract).toLocaleString()}` 
                      : 'Not specified'}
                  </p>
                </div>
              </div>
              {project.contractName && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="text-sm font-medium text-gray-500">Contract Name</label>
                  <p className="text-gray-900 font-medium">{project.contractName}</p>
                </div>
              )}
            </div>

            {/* Project Photo Gallery */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Project Photos</h3>
              <p className="text-gray-600 mb-6">Visual documentation and geotagged photos from project sites</p>
              <GeoPhotoGallery 
                projectId={projectId}
                maxPhotos={50}
                maxFileSize={25}
                compact={true}
                onViewAllPhotos={() => setActiveTab('photos')}
              />
            </div>
          </div>
        )}

        {activeTab === 'team' && canManageTeam && (
          <TeamMemberManagement 
            project={project} 
            onUpdate={fetchProject}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskManagement 
            project={project} 
            currentUserRole={currentUser.role}
          />
        )}

        {activeTab === 'calendar' && (
          <ProjectCalendar projectId={projectId} />
        )}

        {activeTab === 'files' && (
          <div className="space-y-6">
            <FileManager 
              projectId={projectId}
              showTitle={true}
              maxFiles={20}
              maxFileSize={10}
            />
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="space-y-6">
            <GeoPhotoGallery 
              projectId={projectId}
              maxPhotos={100}
              maxFileSize={25}
            />
          </div>
        )}

        {activeTab === 'edit' && canManageTeam && (
          <EditProject
            project={project}
            onUpdate={(updatedProject) => {
              setProject(updatedProject);
              setActiveTab('overview');
            }}
            onCancel={() => setActiveTab('overview')}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsPage;