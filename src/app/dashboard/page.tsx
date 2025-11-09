'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IProject } from '@/models/Project';
import DashboardStats from '@/components/DashboardStats';
import ProjectCard from '@/components/ProjectCard';
import ProjectForm from '@/components/ProjectForm';
import Calendar from '@/components/Calendar';
import ModernNavigation from '@/components/ui/ModernNavigation';
import { ModernCard, StatsCard, ActionButton } from '@/components/ui/ModernCards';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'team_leader' | 'member';
  teamName?: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  projectId: {
    _id: string;
    name: string;
  };
  dueDate?: Date;
  estimatedHours?: number;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'tasks' | 'calendar'>('overview');
  const [projects, setProjects] = useState<IProject[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<IProject | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchProjects();
    fetchMyTasks();
  }, []);

  const checkAuth = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userStr));
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        credentials: 'include' // Include cookies for authentication
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      } else {
        console.error('Failed to fetch projects:', data.error);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTasks = async () => {
    try {
      const response = await fetch('/api/tasks?assignedToMe=true', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMyTasks(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching my tasks:', error);
    }
  };

  const handleSubmit = async (projectData: Partial<IProject>) => {
    try {
      const url = editingProject ? `/api/projects/${editingProject._id}` : '/api/projects';
      const method = editingProject ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        await fetchProjects();
        setShowForm(false);
        setEditingProject(null);
      } else {
        console.error('API Error:', data.error);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        const response = await fetch(`/api/projects/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          await fetchProjects();
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  const handleEdit = (project: IProject) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('user');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'projects',
      label: 'Projects',
      count: projects.length,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2m0 0V9a2 2 0 012-2h14a2 2 0 012 2v2M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2" />
        </svg>
      )
    },
    {
      id: 'tasks',
      label: 'My Tasks',
      count: myTasks.filter(t => t.status !== 'completed').length,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  const getProjectStatusStats = () => {
    const stats = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      planning: stats.planning || 0,
      in_progress: stats.in_progress || 0,
      completed: stats.completed || 0,
      on_hold: stats.on_hold || 0
    };
  };

  const statusStats = getProjectStatusStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <ModernNavigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        userInfo={{
          name: user ? `${user.firstName} ${user.lastName}` : 'User',
          role: user?.role || 'member'
        }}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions & Admin Access */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-stone-600 mt-1">Welcome back! Here's what's happening with your projects today.</p>
          </div>
          <div className="flex space-x-3">
            {user?.role === 'admin' && (
              <ActionButton
                onClick={() => router.push('/admin')}
                variant="secondary"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
                label="Admin Panel"
              />
            )}
            <ActionButton
              onClick={() => {
                setEditingProject(null);
                setShowForm(true);
              }}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
              label="New Project"
            />
          </div>
        </div>

        {activeTab === 'overview' ? (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Projects"
                value={projects.length}
                color="chocolate"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2m0 0V9a2 2 0 012-2h14a2 2 0 012 2v2M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2" />
                  </svg>
                }
              />
              <StatsCard
                title="In Progress"
                value={statusStats.in_progress}
                color="gray"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatsCard
                title="Completed"
                value={statusStats.completed}
                color="emerald"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatsCard
                title="Planning"
                value={statusStats.planning}
                color="black"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                }
              />
            </div>

            {/* Recent Projects */}
            <ModernCard>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-black">Recent Projects</h2>
                <button 
                  onClick={() => setActiveTab('projects')}
                  className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center"
                >
                  View all projects
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {projects.slice(0, 3).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.slice(0, 3).map((project) => (
                    <div key={project._id} onClick={() => router.push(`/projects/${project._id}`)} className="cursor-pointer">
                      <ProjectCard
                        project={project}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2m0 0V9a2 2 0 012-2h14a2 2 0 012 2v2M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-black mb-2">No projects yet</h3>
                  <p className="text-stone-600 mb-6">Create your first project to get started with monitoring!</p>
                  <ActionButton
                    onClick={() => {
                      setEditingProject(null);
                      setShowForm(true);
                    }}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    }
                    label="Create Your First Project"
                  />
                </div>
              )}
            </ModernCard>
          </>
        ) : (
          /* Projects Tab */
          <ModernCard>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black">All Projects</h2>
              <ActionButton
                onClick={() => {
                  setEditingProject(null);
                  setShowForm(true);
                }}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
                label="Add Project"
              />
            </div>
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project._id} onClick={() => router.push(`/projects/${project._id}`)} className="cursor-pointer">
                    <ProjectCard
                      project={project}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2m0 0V9a2 2 0 012-2h14a2 2 0 012 2v2M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">No projects yet</h3>
                <p className="text-gray-600 mb-6">Create your first project to get started with monitoring!</p>
                <ActionButton
                  onClick={() => {
                    setEditingProject(null);
                    setShowForm(true);
                  }}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  }
                  label="Create Your First Project"
                />
              </div>
            )}
          </ModernCard>
        )}

        {/* My Tasks Tab */}
        {activeTab === 'tasks' && (
          <ModernCard>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black">My Tasks</h2>
              <div className="text-sm text-gray-500">
                {myTasks.filter(t => t.status !== 'completed').length} pending
              </div>
            </div>
            
            {myTasks.length > 0 ? (
              <div className="space-y-4">
                {myTasks.map((task) => (
                  <div key={task._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800' :
                            task.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>
                            Project: <strong 
                              onClick={() => router.push(`/projects/${task.projectId._id}`)} 
                              className="text-amber-600 hover:text-amber-800 cursor-pointer"
                            >
                              {task.projectId.name}
                            </strong>
                          </span>
                          {task.dueDate && (
                            <span>
                              Due: <strong>{new Date(task.dueDate).toLocaleDateString()}</strong>
                            </span>
                          )}
                          {task.estimatedHours && (
                            <span>
                              Est: <strong>{task.estimatedHours}h</strong>
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => router.push(`/projects/${task.projectId._id}?tab=tasks`)}
                        className="text-amber-600 hover:text-amber-800 text-sm font-medium ml-4"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <h3 className="text-lg font-semibold text-black mb-2">No tasks assigned</h3>
                <p className="text-gray-600">Tasks assigned to you will appear here</p>
              </div>
            )}
          </ModernCard>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <Calendar />
        )}

        {/* Project Form Modal */}
        {showForm && (
          <ProjectForm
            project={editingProject || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingProject(null);
            }}
          />
        )}
      </main>
    </div>
  );
}