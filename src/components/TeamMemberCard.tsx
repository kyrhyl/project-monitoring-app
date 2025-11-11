'use client';

import { useState } from 'react';

interface TeamMemberCardProps {
  member: {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    currentTenure: number;
    totalAssignments: number;
    lastAssigned: string;
    currentProjects?: number;
    activeTasks?: number;
    completedTasks?: number;
  };
  onClick: (memberId: string) => void;
}

export default function TeamMemberCard({ member, onClick }: TeamMemberCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const formatTenure = (days: number) => {
    if (days < 30) {
      return `${days} days`;
    } else if (days < 365) {
      return `${Math.floor(days / 30)} months`;
    } else {
      return `${Math.floor(days / 365)} years`;
    }
  };

  const getInitials = (firstName?: string, lastName?: string, username?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return 'TM';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group"
      onClick={() => onClick(member._id)}
    >
      {/* Header with Avatar */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {getInitials(member.firstName, member.lastName, member.username)}
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {member.firstName && member.lastName 
                ? `${member.firstName} ${member.lastName}` 
                : member.username}
            </h3>
            <p className="text-sm text-gray-500">@{member.username}</p>
          </div>
        </div>
        <div className="flex items-center text-gray-400 group-hover:text-blue-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600">{member.activeTasks || 0}</div>
          <div className="text-xs text-blue-600 font-medium">Active Tasks</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600">{member.currentProjects || 0}</div>
          <div className="text-xs text-green-600 font-medium">Projects</div>
        </div>
      </div>

      {/* Member Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Tenure:</span>
          <span className="font-medium text-gray-900">{formatTenure(member.currentTenure)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Total Assignments:</span>
          <span className="font-medium text-gray-900">{member.totalAssignments}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Completed Tasks:</span>
          <span className="font-medium text-gray-900">{member.completedTasks || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Last Assigned:</span>
          <span className="font-medium text-gray-900">{formatDate(member.lastAssigned)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Task Completion</span>
          <span>{member.completedTasks || 0}/{(member.completedTasks || 0) + (member.activeTasks || 0)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${((member.completedTasks || 0) / Math.max((member.completedTasks || 0) + (member.activeTasks || 0), 1)) * 100}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {member.email}
        </div>
      </div>
    </div>
  );
}