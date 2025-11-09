'use client';

import { useState, useEffect } from 'react';
import { IProject } from '@/models/Project';

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface TeamMemberManagementProps {
  project: IProject;
  onUpdate: () => void;
}

const TeamMemberManagement = ({ project, onUpdate }: TeamMemberManagementProps) => {
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const [availableMembers, setAvailableMembers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [project._id]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${project._id}/members`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setProjectMembers(data.data.projectMembers || []);
        setAvailableMembers(data.data.availableMembers || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/projects/${project._id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: selectedMembers })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSelectedMembers([]);
        await fetchMembers();
        onUpdate();
      } else {
        alert(data.error || 'Failed to add members');
      }
    } catch (error) {
      console.error('Error adding members:', error);
      alert('Failed to add members');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member from the project? They will be unassigned from all tasks.')) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/projects/${project._id}/members?memberId=${memberId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        await fetchMembers();
        onUpdate();
      } else {
        alert(data.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Team Members</h3>
        <p className="text-sm text-gray-600">Manage team members assigned to this project</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Current Project Members */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Assigned Members ({projectMembers.length})</h4>
          {projectMembers.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 3a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">No team members assigned yet</p>
              <p className="text-xs text-gray-500">Add members below to get started</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {projectMembers.map((member) => (
                <div key={member._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-amber-800">
                        {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-gray-500">@{member.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member._id)}
                    disabled={actionLoading}
                    className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Members */}
        {availableMembers.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Add Team Members</h4>
            <div className="space-y-3">
              {availableMembers.map((member) => (
                <div key={member._id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    id={`member-${member._id}`}
                    checked={selectedMembers.includes(member._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers(prev => [...prev, member._id]);
                      } else {
                        setSelectedMembers(prev => prev.filter(id => id !== member._id));
                      }
                    }}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                    </span>
                  </div>
                  <label htmlFor={`member-${member._id}`} className="flex-1 cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-gray-500">@{member.username} • {member.role}</p>
                    </div>
                  </label>
                </div>
              ))}

              {selectedMembers.length > 0 && (
                <button
                  onClick={handleAddMembers}
                  disabled={actionLoading}
                  className="w-full bg-amber-900 text-white py-2 px-4 rounded-lg hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading ? 'Adding...' : `Add ${selectedMembers.length} Member${selectedMembers.length !== 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </div>
        )}

        {availableMembers.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">All team members are already assigned to this project</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamMemberManagement;