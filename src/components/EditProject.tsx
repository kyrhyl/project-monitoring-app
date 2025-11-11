'use client';

import { useState } from 'react';
import { IProject } from '@/models/Project';

interface EditProjectProps {
  project: IProject;
  onUpdate: (updatedProject: IProject) => void;
  onCancel: () => void;
}

const EditProject = ({ project, onUpdate, onCancel }: EditProjectProps) => {
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description,
    status: project.status,
    priority: project.priority,
    startDate: new Date(project.startDate).toISOString().split('T')[0],
    endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
    progress: project.progress,
    contractId: project.contractId || '',
    contractName: project.contractName || '',
    appropriation: project.appropriation || '',
    location: project.location || '',
    approvedBudgetContract: project.approvedBudgetContract || '',
    contractDuration: project.contractDuration || '',
    fundingSource: project.fundingSource || ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (formData.endDate && formData.startDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      // Compare dates by setting time to midnight for accurate comparison
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      if (endDateOnly <= startDateOnly) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (formData.progress < 0 || formData.progress > 100) {
      newErrors.progress = 'Progress must be between 0 and 100';
    }

    if (formData.approvedBudgetContract && Number(formData.approvedBudgetContract) < 0) {
      newErrors.approvedBudgetContract = 'Approved budget cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare update data with proper date handling
      const updateData: any = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        progress: formData.progress,
        contractId: formData.contractId,
        contractName: formData.contractName,
        appropriation: formData.appropriation,
        location: formData.location,
        approvedBudgetContract: formData.approvedBudgetContract,
        contractDuration: formData.contractDuration,
        fundingSource: formData.fundingSource
      };

      // Only include dates if they are valid
      if (formData.startDate) {
        updateData.startDate = new Date(formData.startDate).toISOString();
      }

      if (formData.endDate && formData.endDate.trim() !== '') {
        updateData.endDate = new Date(formData.endDate).toISOString();
      } else {
        updateData.endDate = null;
      }

      console.log('Sending update data:', updateData); // Debug log

      const response = await fetch(`/api/projects/${project._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      const data = await response.json();
      onUpdate(data.data);
      alert('Project updated successfully!');
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Edit Project</h2>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-project-form"
            disabled={loading}
            className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      <form id="edit-project-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                maxLength={100}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
                <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-2">
                  Progress (%)
                </label>
                <input
                  type="range"
                  id="progress"
                  name="progress"
                  value={formData.progress}
                  onChange={e => {
                    setFormData(prev => ({
                      ...prev,
                      progress: Number(e.target.value)
                    }));
                    if (errors.progress) {
                      setErrors(prev => ({ ...prev, progress: '' }));
                    }
                  }}
                  min="0"
                  max="100"
                  step="1"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:ring-amber-500 focus:border-amber-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>{formData.progress}%</span>
                  <span>100%</span>
                </div>
                {errors.progress && <p className="mt-1 text-sm text-red-600">{errors.progress}</p>}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            maxLength={500}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          <p className="mt-1 text-sm text-gray-500">{formData.description.length}/500 characters</p>
        </div>

        {/* Status and Priority */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status & Priority</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                  errors.startDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                  errors.endDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
            </div>
          </div>
        </div>

        {/* Contract Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contract Information</h3>
          
          {/* First row: Contract ID and Appropriation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="contractId" className="block text-sm font-medium text-gray-700 mb-2">
                Contract ID
              </label>
              <input
                type="text"
                id="contractId"
                name="contractId"
                value={formData.contractId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                maxLength={50}
                placeholder="Enter contract ID"
              />
            </div>

            <div>
              <label htmlFor="appropriation" className="block text-sm font-medium text-gray-700 mb-2">
                Appropriation
              </label>
              <input
                type="text"
                id="appropriation"
                name="appropriation"
                value={formData.appropriation}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                maxLength={100}
                placeholder="Enter appropriation"
              />
            </div>
          </div>

          {/* Second row: Funding Source */}
          <div className="mb-6">
            <label htmlFor="fundingSource" className="block text-sm font-medium text-gray-700 mb-2">
              Funding Source
            </label>
            <input
              type="text"
              id="fundingSource"
              name="fundingSource"
              value={formData.fundingSource}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              maxLength={150}
              placeholder="e.g., National Government Budget, Foreign Aid, Private Partnership"
            />
          </div>

          {/* Third row: Contract Name */}
          <div className="mb-6">
            <label htmlFor="contractName" className="block text-sm font-medium text-gray-700 mb-2">
              Contract Name
            </label>
            <input
              type="text"
              id="contractName"
              name="contractName"
              value={formData.contractName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              maxLength={200}
              placeholder="Enter contract name"
            />
          </div>

          {/* Fourth row: ABC, Location, Contract Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="approvedBudgetContract" className="block text-sm font-medium text-gray-700 mb-2">
                Approved Budget for Contract (ABC)
              </label>
              <input
                type="number"
                id="approvedBudgetContract"
                name="approvedBudgetContract"
                value={formData.approvedBudgetContract}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                  errors.approvedBudgetContract ? 'border-red-300' : 'border-gray-300'
                }`}
                min="0"
                step="0.01"
                placeholder="Enter budget amount"
              />
              {errors.approvedBudgetContract && (
                <p className="mt-1 text-sm text-red-600">{errors.approvedBudgetContract}</p>
              )}
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                maxLength={200}
                placeholder="Enter project location"
              />
            </div>

            <div>
              <label htmlFor="contractDuration" className="block text-sm font-medium text-gray-700 mb-2">
                Contract Duration
              </label>
              <input
                type="text"
                id="contractDuration"
                name="contractDuration"
                value={formData.contractDuration}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                maxLength={50}
                placeholder="e.g., 12 months, 2 years"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditProject;