'use client';

import { IProject } from '@/models/Project';
import { ActionButton } from './ui/ModernCards';

interface ProjectCardProps {
  project: IProject;
  onEdit?: (project: IProject) => void;
}

const ProjectCard = ({ project, onEdit }: ProjectCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in_progress': return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'on_hold': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'low': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressPercentage = () => {
    if (!project.startDate || !project.endDate) return 0;
    const now = new Date();
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const progress = getProgressPercentage();

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 p-6 group relative overflow-hidden">
      {/* Chocolate brown background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 rounded-full transform translate-x-16 -translate-y-16"></div>
      
      <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-red-600 transition-colors duration-200">
              {project.name}
            </h3>
            <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="flex gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(project.status)}`}>
            {project.status.replace('_', ' ').toUpperCase()}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(project.priority)}`}>
            {project.priority.toUpperCase()} PRIORITY
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-600">Progress</span>
            <span className="text-xs font-semibold text-gray-700">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-amber-900 to-yellow-900 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Dates */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">Start Date</div>
            <div className="text-sm font-medium text-black">
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">End Date</div>
            <div className="text-sm font-medium text-black">
              {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
            </div>
          </div>
        </div>

        {/* Team Info */}
        {project.teamId && (
          <div className="mb-6 p-3 bg-red-50/50 rounded-xl border border-red-100">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm font-medium text-red-700">
                Team Project
              </span>
            </div>
          </div>
        )}        {/* Action Buttons */}
        <div className="flex gap-2">
          {onEdit && (
            <ActionButton
              onClick={() => onEdit(project)}
              variant="secondary"
              size="sm"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
              label="Edit"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;