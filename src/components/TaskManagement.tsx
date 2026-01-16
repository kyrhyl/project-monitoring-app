'use client';

import { useState, useEffect } from 'react';
import { IProject } from '@/models/Project';
import { ITask } from '@/models/Task';
import FileManager from '@/components/FileManager';
import EnhancedTaskForm from '@/components/EnhancedTaskForm';
import { XMarkIcon, PaperClipIcon } from '@heroicons/react/24/outline';

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface TaskWithPopulatedData extends Omit<ITask, 'assigneeId' | 'createdBy'> {
  assigneeId?: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  createdBy: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

interface TaskManagementProps {
  project: IProject;
  currentUserRole: string;
  onProjectUpdate?: () => void; // Optional callback to refresh project data
}

const TaskManagement = ({ project, currentUserRole, onProjectUpdate }: TaskManagementProps) => {
  const [tasks, setTasks] = useState<TaskWithPopulatedData[]>([]);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithPopulatedData | null>(null);
  const [viewingTask, setViewingTask] = useState<TaskWithPopulatedData | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assigneeId: '',
    dueDate: '',
    estimatedHours: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchProjectMembers();
  }, [project._id]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/projects/${project._id}/tasks`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setTasks(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchProjectMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${project._id}/members`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setProjectMembers(data.data.projectMembers || []);
      }
    } catch (error) {
      console.error('Error fetching project members:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      assigneeId: '',
      dueDate: '',
      estimatedHours: ''
    });
    setEditingTask(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingTask 
        ? `/api/projects/${project._id}/tasks/${editingTask._id}`
        : `/api/projects/${project._id}/tasks`;
      
      const method = editingTask ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        resetForm();
        await fetchTasks();
      } else {
        alert(data.error || 'Failed to save task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task');
    }
  };

  const handleEdit = (task: TaskWithPopulatedData) => {
    setEditingTask(task);
    setShowCreateForm(true);
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;

    try {
      const response = await fetch(`/api/projects/${project._id}/tasks/${taskId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await fetchTasks();
      } else {
        alert(data.error || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/projects/${project._id}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        await fetchTasks();
        // Refresh parent project to update progress
        if (onProjectUpdate) {
          onProjectUpdate();
        }
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'todo': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canCreateTasks = currentUserRole === 'admin' || currentUserRole === 'team_leader';
  const canEditDeleteTasks = currentUserRole === 'admin' || currentUserRole === 'team_leader';

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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Tasks</h3>
            <p className="text-sm text-gray-600">Manage and assign tasks for this project</p>
          </div>
          {canCreateTasks && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-amber-900 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors"
            >
              Create Task
            </button>
          )}
        </div>
      </div>

      {/* Create/Edit Task Form */}
      {showCreateForm && (
        <EnhancedTaskForm
          projectId={project._id as string}
          onClose={() => {
            setShowCreateForm(false);
            setEditingTask(null);
          }}
          onSubmit={() => {
            fetchTasks();
            setShowCreateForm(false);
            setEditingTask(null);
          }}
          editTask={editingTask}
        />
      )}

      {/* Tasks List */}
      <div className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">No tasks created yet</p>
            {canCreateTasks && (
              <p className="text-xs text-gray-500">Create your first task to get started</p>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => (
              <div key={task._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-md font-medium text-gray-900">{task.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      {task.assigneeId && (
                        <span>
                          Assigned to: <strong>{task.assigneeId.firstName} {task.assigneeId.lastName}</strong>
                        </span>
                      )}
                      {task.startDate && (
                        <span>
                          Start: <strong>{new Date(task.startDate).toLocaleDateString()}</strong>
                        </span>
                      )}
                      {task.dueDate && (
                        <span>
                          Due: <strong>{new Date(task.dueDate).toLocaleDateString()}</strong>
                        </span>
                      )}
                      {task.completedAt && task.status === 'completed' && (
                        <span className="text-green-700 font-semibold">
                          ✓ Completed: <strong>{new Date(task.completedAt).toLocaleDateString()}</strong>
                          {task.dueDate && (() => {
                            const completed = new Date(task.completedAt);
                            const due = new Date(task.dueDate);
                            completed.setHours(0, 0, 0, 0);
                            due.setHours(0, 0, 0, 0);
                            const diff = Math.ceil((due.getTime() - completed.getTime()) / (1000 * 60 * 60 * 24));
                            if (diff > 0) return <span className="text-green-600"> ({diff} day{diff !== 1 ? 's' : ''} early)</span>;
                            if (diff < 0) return <span className="text-red-600"> ({Math.abs(diff)} day{diff !== -1 ? 's' : ''} late)</span>;
                            return <span className="text-blue-600"> (on time)</span>;
                          })()}
                        </span>
                      )}
                      {task.estimatedHours && (
                        <span>
                          Estimated: <strong>{task.estimatedHours}h</strong>
                        </span>
                      )}
                      <span>
                        Created by: <strong>{task.createdBy.firstName} {task.createdBy.lastName}</strong>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setViewingTask(task)}
                      className="text-blue-600 hover:text-blue-800 text-xs underline"
                    >
                      View Details
                    </button>
                    {task.status !== 'completed' && (
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusUpdate(task._id!, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    )}
                    
                    {canEditDeleteTasks && (
                      <>
                        <button
                          onClick={() => handleEdit(task)}
                          className="text-amber-600 hover:text-amber-800 text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(task._id!)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {viewingTask && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{viewingTask.title}</h2>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(viewingTask.priority)}`}>
                      {viewingTask.priority} priority
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(viewingTask.status)}`}>
                      {viewingTask.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingTask(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Task Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Task Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Description</label>
                        <p className="text-gray-900 mt-1">{viewingTask.description}</p>
                      </div>
                      
                      {viewingTask.assigneeId && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Assigned To</label>
                          <p className="text-gray-900 mt-1">
                            {viewingTask.assigneeId.firstName} {viewingTask.assigneeId.lastName}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created By</label>
                        <p className="text-gray-900 mt-1">
                          {viewingTask.createdBy.firstName} {viewingTask.createdBy.lastName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline & Hours</h3>
                    <div className="space-y-3">
                      {viewingTask.startDate && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Start Date</label>
                          <p className="text-gray-900 mt-1">
                            {new Date(viewingTask.startDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {viewingTask.dueDate && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Due Date</label>
                          <p className="text-gray-900 mt-1">
                            {new Date(viewingTask.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {viewingTask.completedAt && viewingTask.status === 'completed' && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Completed Date</label>
                          <div className="text-gray-900 mt-1">
                            <p className="font-semibold text-green-700">
                              ✓ {new Date(viewingTask.completedAt).toLocaleDateString()}
                            </p>
                            {viewingTask.dueDate && (() => {
                              const completed = new Date(viewingTask.completedAt);
                              const due = new Date(viewingTask.dueDate);
                              completed.setHours(0, 0, 0, 0);
                              due.setHours(0, 0, 0, 0);
                              const diff = Math.ceil((due.getTime() - completed.getTime()) / (1000 * 60 * 60 * 24));
                              
                              if (diff > 0) {
                                return (
                                  <p className="text-sm text-green-600 mt-1">
                                    🎉 Completed {diff} day{diff !== 1 ? 's' : ''} early!
                                  </p>
                                );
                              } else if (diff < 0) {
                                return (
                                  <p className="text-sm text-red-600 mt-1">
                                    ⚠️ Completed {Math.abs(diff)} day{diff !== -1 ? 's' : ''} late
                                  </p>
                                );
                              } else {
                                return (
                                  <p className="text-sm text-blue-600 mt-1">
                                    ✓ Completed on time
                                  </p>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      )}
                      
                      {viewingTask.estimatedHours && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Estimated Hours</label>
                          <p className="text-gray-900 mt-1">{viewingTask.estimatedHours} hours</p>
                        </div>
                      )}

                      {viewingTask.actualHours && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Actual Hours</label>
                          <p className="text-gray-900 mt-1">{viewingTask.actualHours} hours</p>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium text-gray-500">Created</label>
                        <p className="text-gray-900 mt-1">
                          {new Date(viewingTask.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Attachments */}
                <div>
                  <FileManager 
                    taskId={viewingTask._id}
                    showTitle={true}
                    maxFiles={10}
                    maxFileSize={10}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                {canEditDeleteTasks && (
                  <>
                    <button
                      onClick={() => {
                        setEditingTask(viewingTask);
                        setFormData({
                          title: viewingTask.title,
                          description: viewingTask.description,
                          priority: viewingTask.priority,
                          assigneeId: viewingTask.assigneeId?._id || '',
                          dueDate: viewingTask.dueDate ? new Date(viewingTask.dueDate).toISOString().split('T')[0] : '',
                          estimatedHours: viewingTask.estimatedHours?.toString() || ''
                        });
                        setViewingTask(null);
                        setShowCreateForm(true);
                      }}
                      className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors"
                    >
                      Edit Task
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this task?')) {
                          handleDelete(viewingTask._id!);
                          setViewingTask(null);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete Task
                    </button>
                  </>
                )}
                <button
                  onClick={() => setViewingTask(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;