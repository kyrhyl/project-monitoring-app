'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface MemberProfileData {
  member: {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    createdAt: string;
  };
  currentProjects: Array<{
    _id: string;
    name: string;
    description: string;
    status: string;
    progress: number;
    dueDate?: string;
  }>;
  currentTasks: Array<{
    _id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    projectId: {
      _id: string;
      name: string;
    };
    dueDate?: string;
    estimatedHours?: number;
  }>;
  taskHistory: Array<{
    _id: string;
    title: string;
    status: string;
    completedAt?: string;
    projectName: string;
    estimatedHours?: number;
    actualHours?: number;
  }>;
  analytics: {
    totalTasks: number;
    completedTasks: number;
    averageCompletionTime: number;
    currentWorkload: number;
    completionRate: number;
    tenure: number;
  };
}

interface MemberProfileProps {
  memberId: string;
  onClose: () => void;
}

export default function MemberProfile({ memberId, onClose }: MemberProfileProps) {
  const [data, setData] = useState<MemberProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    fetchMemberData();
  }, [memberId]);

  const fetchMemberData = async () => {
    try {
      setLoading(true);
      
      // Fetch member details
      const memberRes = await fetch(`/api/team-leader/members/${memberId}`);
      if (!memberRes.ok) throw new Error('Failed to fetch member data');
      const memberData = await memberRes.json();

      setData({
        member: memberData.data.member,
        currentProjects: memberData.data.member.currentProjects || [],
        currentTasks: memberData.data.member.currentTasks || [],
        taskHistory: memberData.data.member.taskHistory || [],
        analytics: memberData.data.member.analytics || {
          totalTasks: 0,
          completedTasks: 0,
          averageCompletionTime: 0,
          currentWorkload: 0,
          completionRate: 0,
          tenure: 0
        }
      });
    } catch (error) {
      console.error('Error fetching member data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'todo':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading member profile...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">Failed to load member profile.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {getInitials(data.member.firstName, data.member.lastName, data.member.username)}
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold">
                  {data.member.firstName && data.member.lastName 
                    ? `${data.member.firstName} ${data.member.lastName}` 
                    : data.member.username}
                </h2>
                <p className="opacity-90">@{data.member.username}</p>
                <p className="opacity-75 text-sm">{data.member.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white bg-opacity-30 rounded-lg p-3 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{data.analytics.currentWorkload}</div>
              <div className="text-sm text-white opacity-90">Active Tasks</div>
            </div>
            <div className="bg-white bg-opacity-30 rounded-lg p-3 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{data.currentProjects.length}</div>
              <div className="text-sm text-white opacity-90">Projects</div>
            </div>
            <div className="bg-white bg-opacity-30 rounded-lg p-3 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{data.analytics.completedTasks}</div>
              <div className="text-sm text-white opacity-90">Completed</div>
            </div>
            <div className="bg-white bg-opacity-30 rounded-lg p-3 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{Math.round(data.analytics.completionRate)}%</div>
              <div className="text-sm text-white opacity-90">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex px-6">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'projects', name: 'Projects', icon: '📁' },
              { id: 'tasks', name: 'Current Tasks', icon: '✅' },
              { id: 'history', name: 'Task History', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Member Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Member Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Role:</span>
                    <span className="ml-2 font-medium capitalize">{data.member.role}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tenure:</span>
                    <span className="ml-2 font-medium">{formatTenure(data.analytics.tenure)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Joined:</span>
                    <span className="ml-2 font-medium">{formatDate(data.member.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Avg. Completion Time:</span>
                    <span className="ml-2 font-medium">{data.analytics.averageCompletionTime} days</span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Workload Distribution</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Tasks:</span>
                      <span className="font-semibold text-blue-600">{data.analytics.currentWorkload}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Projects:</span>
                      <span className="font-semibold text-green-600">{data.currentProjects.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Completed:</span>
                      <span className="font-semibold text-purple-600">{data.analytics.completedTasks}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Performance Score</h4>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {Math.round(data.analytics.completionRate)}%
                    </div>
                    <div className="text-sm text-gray-600 mb-3">Task Completion Rate</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${data.analytics.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Current Projects</h3>
              {data.currentProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📂</div>
                  <p>No active projects assigned</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {data.currentProjects.map((project) => (
                    <div key={project._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{project.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Progress: {project.progress}%
                        </div>
                        {project.dueDate && (
                          <div className="text-sm text-gray-500">
                            Due: {formatDate(project.dueDate)}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Current Tasks</h3>
              {data.currentTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">✅</div>
                  <p>No active tasks assigned</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.currentTasks.map((task) => (
                    <div key={task._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Project: {task.projectId?.name}</span>
                        <div className="flex space-x-4">
                          {task.estimatedHours && (
                            <span>Est: {task.estimatedHours}h</span>
                          )}
                          {task.dueDate && (
                            <span>Due: {formatDate(task.dueDate)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Task History</h3>
              {data.taskHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📈</div>
                  <p>No completed tasks yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.taskHistory.map((task) => (
                    <div key={task._id} className="border rounded-lg p-4 bg-green-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Project: {task.projectName}</span>
                        <div className="flex space-x-4">
                          {task.estimatedHours && task.actualHours && (
                            <span>Time: {task.actualHours}h / {task.estimatedHours}h</span>
                          )}
                          {task.completedAt && (
                            <span>Completed: {formatDate(task.completedAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}