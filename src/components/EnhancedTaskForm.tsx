'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, User, Clock } from 'lucide-react';

interface TaskFormData {
  title: string;
  description: string;
  phase: 'architectural' | 'structural' | 'electrical' | 'mechanical' | 'site-development' | 'final-plan' | 'final-estimate' | 'checking' | 'other';
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  startDate: string;
  dueDate: string;
  estimatedHours: string;
  assigneeId?: string;
}

interface EnhancedTaskFormProps {
  projectId: string;
  onClose: () => void;
  onSubmit: () => void;
  editTask?: any;
}

// Predefined task templates based on phase
const TASK_TEMPLATES = {
  architectural: [
    'Architectural Design',
    'Site Analysis',
    'Conceptual Design',
    'Design Development',
    'Building Permit Application',
  ],
  structural: [
    'Structural Analysis',
    'Foundation Design',
    'Structural Frame Design',
    'Load Calculations',
  ],
  electrical: [
    'Electrical System Design',
    'Power Distribution',
    'Lighting Design',
    'Generator Specifications',
    'Wiring Layout',
  ],
  mechanical: [
    'Mechanical System Design',
    'Plumbing Design',
    'HVAC Design',
    'Fire Protection System',
    'Sanitary System',
  ],
  'site-development': [
    'Site Grading',
    'Excavation Work',
    'Foundation Preparation',
    'Utilities Installation',
    'Road and Pathway Construction',
  ],
  'final-plan': [
    'Final Architectural Plans',
    'Final Structural Plans',
    'Final MEP Plans',
    'As-Built Drawings',
  ],
  'final-estimate': [
    'Cost Estimation',
    'Bill of Quantities',
    'Material Specifications',
    'Budget Approval',
  ],
  checking: [
    'Plan Review',
    'Quality Assurance',
    'Compliance Check',
    'Final Inspection',
  ],
  other: [
    'Custom Task',
  ],
};

const PHASE_COLORS = {
  architectural: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  structural: 'bg-teal-100 border-teal-400 text-teal-800',
  electrical: 'bg-orange-100 border-orange-400 text-orange-800',
  mechanical: 'bg-purple-100 border-purple-400 text-purple-800',
  'site-development': 'bg-green-100 border-green-400 text-green-800',
  'final-plan': 'bg-yellow-100 border-yellow-500 text-yellow-800',
  'final-estimate': 'bg-blue-100 border-blue-400 text-blue-800',
  checking: 'bg-pink-100 border-pink-400 text-pink-800',
  other: 'bg-gray-100 border-gray-400 text-gray-800',
};

export default function EnhancedTaskForm({ projectId, onClose, onSubmit, editTask }: EnhancedTaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    phase: 'other',
    status: 'todo',
    priority: 'medium',
    startDate: '',
    dueDate: '',
    estimatedHours: '',
    assigneeId: '',
  });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
    if (editTask) {
      setFormData({
        title: editTask.title || '',
        description: editTask.description || '',
        phase: editTask.phase || 'other',
        status: editTask.status || 'todo',
        priority: editTask.priority || 'medium',
        startDate: editTask.startDate ? new Date(editTask.startDate).toISOString().split('T')[0] : '',
        dueDate: editTask.dueDate ? new Date(editTask.dueDate).toISOString().split('T')[0] : '',
        estimatedHours: editTask.estimatedHours?.toString() || '',
        assigneeId: editTask.assigneeId?._id || editTask.assigneeId || '',
      });
      setShowTemplates(false);
    }
  }, [editTask]);

  const fetchTeamMembers = async () => {
    try {
      // Fetch only project members (not all team members)
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Expected JSON response but got:', contentType);
          setTeamMembers([]);
          return;
        }
        const data = await res.json();
        if (data.success && data.data && data.data.projectMembers) {
          // Only use projectMembers, not availableMembers
          const validMembers = data.data.projectMembers.filter((member: any) => 
            member && member._id && member.firstName && member.lastName
          );
          
          // Remove duplicates based on _id
          const uniqueMembers = validMembers.filter((member: any, index: number, self: any[]) => 
            index === self.findIndex((m: any) => m._id === member._id)
          );
          
          setTeamMembers(uniqueMembers);
        }
      } else {
        console.error('Failed to fetch team members:', res.status, res.statusText);
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    }
  };

  const handleTemplateSelect = (template: string) => {
    setFormData({ ...formData, title: template });
    setShowTemplates(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        startDate: formData.startDate || undefined,
        dueDate: formData.dueDate || undefined,
      };

      const url = editTask ? `/api/tasks/${editTask._id}` : `/api/projects/${projectId}/tasks`;
      const method = editTask ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('API Response:', {
        url,
        method,
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get('content-type')
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Expected JSON response but got:', contentType);
        const text = await res.text();
        console.error('Response URL:', url);
        console.error('Response Status:', res.status, res.statusText);
        console.error('Response body:', text.substring(0, 500));
        alert(`Server error (${res.status}): Invalid response format. Check console for details.`);
        return;
      }

      const data = await res.json();

      if (data.success) {
        onSubmit();
        onClose();
      } else {
        alert(data.error || 'Failed to save task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const titleLength = formData.title.length;
  const descLength = formData.description.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editTask ? 'Edit Task' : 'Create New Task'}
            </h2>
            {editTask && editTask.createdBy && (
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                <User className="w-4 h-4" />
                Created by {editTask.createdBy.firstName} {editTask.createdBy.lastName}
                {editTask.createdAt && (
                  <span className="flex items-center gap-1 ml-2">
                    <Clock className="w-4 h-4" />
                    {new Date(editTask.createdAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Phase Selection */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Phase *
            </label>
            <div className="flex gap-3 items-center">
              <select
                value={formData.phase}
                onChange={(e) => {
                  setFormData({ ...formData, phase: e.target.value as any });
                  setShowTemplates(!editTask);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="architectural">Architectural</option>
                <option value="structural">Structural</option>
                <option value="electrical">Electrical</option>
                <option value="mechanical">Mechanical</option>
                <option value="site-development">Site Development</option>
                <option value="final-plan">Final Plan</option>
                <option value="final-estimate">Final Estimate</option>
                <option value="checking">Checking</option>
                <option value="other">Other</option>
              </select>
              <span className={`px-4 py-2 rounded-lg border-2 font-medium text-sm whitespace-nowrap ${PHASE_COLORS[formData.phase]}`}>
                {formData.phase.charAt(0).toUpperCase() + formData.phase.slice(1).replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Task Templates */}
          {showTemplates && !editTask && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Templates (Optional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TASK_TEMPLATES[formData.phase].map((template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className={`px-3 py-2 text-sm rounded-lg border-2 hover:shadow-md transition-all ${PHASE_COLORS[formData.phase]}`}
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Task Title and Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Task Title *
                </label>
                <span className={`text-xs ${titleLength > 180 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                  {titleLength}/200
                </span>
              </div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter task title..."
                required
                maxLength={200}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <span className={`text-xs ${descLength > 900 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                  {descLength}/1000
                </span>
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter task description..."
                rows={3}
                required
                maxLength={1000}
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
            </div>
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium ${
                  formData.priority === 'high' ? 'border-red-300 bg-red-50 text-red-900' :
                  formData.priority === 'medium' ? 'border-yellow-300 bg-yellow-50 text-yellow-900' :
                  'border-green-300 bg-green-50 text-green-900'
                }`}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium ${
                  formData.status === 'completed' ? 'border-green-300 bg-green-50 text-green-900' :
                  formData.status === 'in-progress' ? 'border-blue-300 bg-blue-50 text-blue-900' :
                  'border-gray-300 bg-gray-50 text-gray-900'
                }`}
                required
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Assignee and Estimated Hours */}
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Assignment & Effort
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To
                </label>
                <select
                  value={formData.assigneeId}
                  onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.firstName} {member.lastName}
                    </option>
                  ))}
                </select>
                {teamMembers.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">No team members assigned to this project</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Estimated Hours
                </label>
                <input
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  placeholder="0"
                  min="0"
                  max="1000"
                  step="0.5"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center gap-3 pt-4 border-t-2 border-gray-200">
            <div className="text-sm text-gray-500">
              {editTask && editTask.updatedAt && (
                <span>Last updated: {new Date(editTask.updatedAt).toLocaleString()}</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:from-gray-400 disabled:to-gray-500 shadow-md hover:shadow-lg font-medium"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : editTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
