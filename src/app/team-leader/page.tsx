'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TeamMemberCard from '@/components/TeamMemberCard';
import MemberProfile from '@/components/MemberProfile';

interface DashboardData {
  teamInfo: {
    name: string;
    memberCount: number;
    leaderName: string;
  };
  teamMembers: Array<{
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
  }>;
  teamProjects: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
    overallProgress: number;
    projects: Array<{
      _id: string;
      name: string;
      description: string;
      status: string;
      analytics: {
        totalTasks: number;
        completedTasks: number;
        progress: number;
      };
      createdAt: string;
      dueDate?: string;
    }>;
  };
  analytics: {
    avgTenure: number;
    completionRate: number;
    teamPerformance: string;
  };
}

export default function TeamLeaderDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [personalTasks, setPersonalTasks] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const router = useRouter();

  // Handle calendar tab redirect
  useEffect(() => {
    if (activeTab === 'calendar') {
      router.push('/calendar');
    }
  }, [activeTab, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch dashboard data
        const dashboardRes = await fetch('/api/team-leader/dashboard');
        if (!dashboardRes.ok) {
          if (dashboardRes.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch dashboard data');
        }
        const dashboardData = await dashboardRes.json();

        // Fetch team members
        const membersRes = await fetch('/api/team-leader/members');
        if (!membersRes.ok) {
          throw new Error('Failed to fetch team members');
        }
        const membersData = await membersRes.json();

        // Fetch team projects
        const projectsRes = await fetch('/api/team-leader/projects');
        if (!projectsRes.ok) {
          throw new Error('Failed to fetch team projects');
        }
        const projectsData = await projectsRes.json();

        // Fetch personal tasks (tasks assigned to ME)
        const tasksRes = await fetch('/api/tasks?assignedToMe=true');
        if (!tasksRes.ok) {
          throw new Error('Failed to fetch personal tasks');
        }
        const tasksData = await tasksRes.json();

        setData({
          teamInfo: {
            name: dashboardData.data?.team?.name || 'Unknown Team',
            memberCount: membersData.data?.members?.length || 0,
            leaderName: dashboardData.data?.team?.leaderSlot?.currentHolder?.username || 'Unknown'
          },
          teamMembers: membersData.data?.members || [],
          teamProjects: projectsData,
          analytics: {
            avgTenure: dashboardData.data?.analytics?.members?.avgTenure || 0,
            completionRate: dashboardData.data?.analytics?.tasks?.total > 0 
              ? Math.round((dashboardData.data.analytics.tasks.completed / dashboardData.data.analytics.tasks.total) * 100)
              : 0,
            teamPerformance: dashboardData.data?.performance?.overall || 'Good'
          }
        });
        
        setPersonalTasks(tasksData.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Handle error appropriately
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this dashboard.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Main Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Leader Dashboard</h1>
              <p className="text-gray-600">Managing {data?.teamInfo?.name || 'Loading...'}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Main Dashboard
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Admin Panel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'members', name: 'Team Members' },
              { id: 'projects', name: 'Projects' },
              { id: 'tasks', name: 'My Tasks' },
              { id: 'calendar', name: 'Calendar' },
              { id: 'analytics', name: 'Analytics' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Team Stats Cards */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Team Members</h3>
                <p className="text-3xl font-bold text-blue-600">{data?.teamInfo?.memberCount || 0}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Active Projects</h3>
                <p className="text-3xl font-bold text-green-600">{data?.teamProjects?.activeProjects || 0}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">My Personal Tasks</h3>
                <p className="text-3xl font-bold text-purple-600">{personalTasks.filter(t => t.status !== 'completed').length}</p>
                <p className="text-xs text-gray-500 mt-1">Tasks assigned to you</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Team Tasks</h3>
                <p className="text-3xl font-bold text-orange-600">{(data?.teamProjects?.totalTasks || 0) - (data?.teamProjects?.completedTasks || 0)}</p>
                <p className="text-xs text-gray-500 mt-1">Active team tasks</p>
              </div>
            </div>

            {/* Quick Summary */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Role Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">👤 As an Individual</h4>
                  <p className="text-sm text-gray-600 mb-2">You have <strong>{personalTasks.filter(t => t.status !== 'completed').length}</strong> personal tasks assigned to you</p>
                  <p className="text-xs text-gray-500">These appear in your main dashboard and "My Tasks" tab</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">👥 As Team Leader</h4>
                  <p className="text-sm text-gray-600 mb-2">Your team has <strong>{(data?.teamProjects?.totalTasks || 0) - (data?.teamProjects?.completedTasks || 0)}</strong> active tasks across all projects</p>
                  <p className="text-xs text-gray-500">These are for team oversight and management</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
                <p className="text-sm text-gray-500 mt-1">Click on a member card to view their detailed profile, projects, and task history</p>
              </div>
              <div className="text-sm text-gray-500">
                {(data?.teamMembers || []).length} members
              </div>
            </div>

            {(data?.teamMembers || []).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.12M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.196-2.12M7 20v-2m5 0v2m0-2v-2a3 3 0 00-3-3m3 3a3 3 0 00-3-3m0 0a3 3 0 013-3m3 3h6m-6 0l6 0m-6 0v.01M9 7a3 3 0 106 0 3 3 0 00-6 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No team members found</p>
                <p className="text-gray-400 text-sm mt-2">Members will appear here when they are assigned to your team</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(data?.teamMembers || []).map((member) => (
                  <TeamMemberCard
                    key={member._id}
                    member={{
                      _id: member._id,
                      username: member.username,
                      email: member.email,
                      firstName: member.firstName,
                      lastName: member.lastName,
                      currentTenure: member.currentTenure || 0,
                      totalAssignments: member.totalAssignments || 0,
                      lastAssigned: member.lastAssigned || new Date().toISOString(),
                      currentProjects: member.currentProjects || 0,
                      activeTasks: member.activeTasks || 0,
                      completedTasks: member.completedTasks || 0
                    }}
                    onClick={(memberId) => setSelectedMemberId(memberId)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Project Summary */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Project Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{data?.teamProjects?.totalProjects || 0}</p>
                  <p className="text-sm text-gray-500">Total Projects</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{data?.teamProjects?.completedTasks || 0}</p>
                  <p className="text-sm text-gray-500">Completed Tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{data?.teamProjects?.overallProgress || 0}%</p>
                  <p className="text-sm text-gray-500">Overall Progress</p>
                </div>
              </div>
            </div>

            {/* Projects List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Team Projects</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {(data?.teamProjects?.projects || []).map((project) => (
                  <div key={project._id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">{project.name}</h4>
                        <p className="text-gray-600 mt-1">{project.description}</p>
                        <div className="mt-2 flex items-center space-x-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            project.status === 'completed' ? 'bg-green-100 text-green-800' :
                            project.status === 'active' || project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {project.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            Created {formatDate(project.createdAt)}
                          </span>
                          {project.dueDate && (
                            <span className="text-sm text-gray-500">
                              Due {formatDate(project.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-6 text-right">
                        <div className="text-2xl font-bold text-gray-900">{project.analytics.progress}%</div>
                        <div className="text-sm text-gray-500">
                          {project.analytics.completedTasks}/{project.analytics.totalTasks} tasks
                        </div>
                        <div className="mt-2 w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${project.analytics.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">My Personal Tasks</h3>
              <p className="text-sm text-gray-500 mt-1">Tasks assigned to you personally (separate from team management)</p>
            </div>
            <div className="divide-y divide-gray-200">
              {personalTasks.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No personal tasks assigned to you</p>
                  <p className="text-xs text-gray-400 mt-1">This section shows tasks assigned TO you, not team tasks you manage</p>
                </div>
              ) : (
                personalTasks.map((task) => (
                  <div key={task._id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">{task.title}</h4>
                        <p className="text-gray-600 mt-1">{task.description}</p>
                        <div className="mt-2 flex items-center space-x-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.priority} priority
                          </span>
                          {task.projectId?.name && (
                            <span className="text-sm text-gray-500">
                              Project: {task.projectId.name}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-sm text-gray-500">
                              Due: {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <div className="flex flex-col items-center space-y-4">
                <svg className="w-16 h-16 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Loading Calendar...</h3>
                <p className="text-gray-600">You'll be redirected to the project calendar shortly.</p>
                <button
                  onClick={() => router.push('/calendar')}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Go to Calendar Now
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Team Performance</h3>
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-600 mb-2">{data?.analytics?.teamPerformance || 'Good'}</p>
                  <p className="text-gray-600">Overall Rating</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Tenure:</span>
                    <span className="font-medium">{formatTenure(data?.analytics?.avgTenure || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion Rate:</span>
                    <span className="font-medium">{data?.analytics?.completionRate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Projects:</span>
                    <span className="font-medium">{data?.teamProjects?.activeProjects || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Team Size:</span>
                    <span className="font-medium">{data?.teamInfo?.memberCount || 0} members</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Member Profile Modal */}
      {selectedMemberId && (
        <MemberProfile 
          memberId={selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
    </div>
  );
}