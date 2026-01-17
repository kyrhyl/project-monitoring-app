'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProjectTimeline from '@/components/ProjectTimeline';

interface PublicProject {
  _id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  startDate: string;
  endDate?: string;
  progress: number;
  contractId?: string;
  appropriation?: string;
  location?: string;
  approvedBudgetContract?: number;
  contractDuration?: string;
  remarks?: string;
  teamMembers?: Array<{
    _id: string;
    firstName?: string;
    lastName?: string;
    username: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function PublicProjectsPage() {
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    location: '',
    search: ''
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [stats, setStats] = useState({
    total: 0,
    'not-yet-started': 0,
    'on-going': 0,
    'submitted': 0,
    'approved': 0
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'overview' | 'timeline'>('overview');

  const router = useRouter();

  useEffect(() => {
    fetchPublicProjects(); // For paginated projects
    setActiveStatusFilter(filters.status); // Sync active filter state
  }, [filters, pagination.page, sortBy, sortOrder]);

  // Fetch statistics only once on component mount
  useEffect(() => {
    fetchProjectStats(); // For statistics - only run once
  }, []);

  const fetchProjectStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all projects for statistics (without any filters for accurate totals)
      const statsParams = new URLSearchParams({
        limit: '1000' // Get all projects for stats, no filters applied
      });

      const response = await fetch(`/api/public/projects?${statsParams}`);
      const allData = await response.json();

      // Calculate statistics from all projects
      if (allData.success) {
        const newStats = {
          total: allData.pagination.total,
          'not-yet-started': 0,
          'on-going': 0,
          'submitted': 0,
          'approved': 0
        };
        
        allData.data.forEach((project: PublicProject) => {
          if (newStats.hasOwnProperty(project.status)) {
            newStats[project.status as keyof typeof newStats]++;
          }
        });
        
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchPublicProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.location && { location: filters.location }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/public/projects?${params}`);
      const data = await response.json();

      if (data.success) {
        setProjects(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching public projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilterClick = (status: string) => {
    setIsTransitioning(true);
    
    // If clicking the same filter, clear it (show all)
    const newStatus = activeStatusFilter === status ? '' : status;
    setActiveStatusFilter(newStatus);
    
    // Update filters
    setFilters(prev => ({
      ...prev,
      status: newStatus
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // Reset transition state after animation
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'not-yet-started': 'bg-gray-100 text-gray-800',
      'on-going': 'bg-blue-100 text-blue-800',
      'submitted': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'not-yet-started': 'Not Yet Started',
      'on-going': 'On Going',
      'submitted': 'Submitted',
      'approved': 'Approved'
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Compact Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Public Project Portal
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Transparency dashboard for public projects and progress
              </p>
            </div>
            
            {/* Navigation Tabs - Inline */}
            <nav className="flex gap-3">
              <button
                onClick={() => setViewMode('overview')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  viewMode === 'overview'
                    ? 'bg-amber-900 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Project Overview
                </span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-amber-900 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Projects Timeline
                </span>
              </button>
            </nav>
            
            <div className="lg:ml-auto flex items-center gap-3">
              <button
                onClick={() => router.push('/public-projects/report')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium px-6 py-2.5 rounded-lg transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Report
              </button>
              <button
                onClick={() => router.push('/login')}
                className="bg-gradient-to-r from-amber-900 to-yellow-900 hover:from-amber-800 hover:to-yellow-800 text-white font-medium px-6 py-2.5 rounded-lg transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
      <>
      {/* Compact Statistics Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Project Overview</h2>
              <p className="text-xs text-gray-600">Click counters to filter by status</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">{/* Reduced gap from 4 to 3 */}
            {/* Total Projects - Clickable */}
            <button
              onClick={() => handleStatusFilterClick('')}
              className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md p-3 text-center
                         transform transition-all duration-200 ease-out
                         hover:scale-105 hover:shadow-md active:scale-95
                         ${activeStatusFilter === '' ? 'ring-2 ring-blue-500 shadow-md scale-105' : 'hover:from-blue-100 hover:to-indigo-100'}
                         focus:outline-none focus:ring-1 focus:ring-blue-500`}
            >
              <div className="text-xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-blue-800">Total Projects</div>
            </button>
            
            {/* Status Statistics - All Clickable */}
            <button
              onClick={() => handleStatusFilterClick('not-yet-started')}
              className={`bg-gradient-to-r from-gray-50 to-slate-50 rounded-md p-3 text-center
                         transform transition-all duration-200 ease-out
                         hover:scale-105 hover:shadow-md active:scale-95
                         ${activeStatusFilter === 'not-yet-started' ? 'ring-2 ring-gray-500 shadow-md scale-105' : 'hover:from-gray-100 hover:to-slate-100'}
                         focus:outline-none focus:ring-1 focus:ring-gray-500`}
            >
              <div className="text-xl font-bold text-gray-600">{stats['not-yet-started']}</div>
              <div className="text-xs text-gray-800">Not Started</div>
            </button>
            
            <button
              onClick={() => handleStatusFilterClick('on-going')}
              className={`bg-gradient-to-r from-blue-50 to-cyan-50 rounded-md p-3 text-center
                         transform transition-all duration-200 ease-out
                         hover:scale-105 hover:shadow-md active:scale-95
                         ${activeStatusFilter === 'on-going' ? 'ring-2 ring-blue-500 shadow-md scale-105' : 'hover:from-blue-100 hover:to-cyan-100'}
                         focus:outline-none focus:ring-1 focus:ring-blue-500`}
            >
              <div className="text-xl font-bold text-blue-600">{stats['on-going']}</div>
              <div className="text-xs text-blue-800">On Going</div>
            </button>
            
            <button
              onClick={() => handleStatusFilterClick('submitted')}
              className={`bg-gradient-to-r from-yellow-50 to-amber-50 rounded-md p-3 text-center
                         transform transition-all duration-200 ease-out
                         hover:scale-105 hover:shadow-md active:scale-95
                         ${activeStatusFilter === 'submitted' ? 'ring-2 ring-yellow-500 shadow-md scale-105' : 'hover:from-yellow-100 hover:to-amber-100'}
                         focus:outline-none focus:ring-1 focus:ring-yellow-500`}
            >
              <div className="text-xl font-bold text-yellow-600">{stats.submitted}</div>
              <div className="text-xs text-yellow-800">Submitted</div>
            </button>
            
            <button
              onClick={() => handleStatusFilterClick('approved')}
              className={`bg-gradient-to-r from-green-50 to-emerald-50 rounded-md p-3 text-center
                         transform transition-all duration-200 ease-out
                         hover:scale-105 hover:shadow-md active:scale-95
                         ${activeStatusFilter === 'approved' ? 'ring-2 ring-green-500 shadow-md scale-105' : 'hover:from-green-100 hover:to-emerald-100'}
                         focus:outline-none focus:ring-1 focus:ring-green-500`}
            >
              <div className="text-xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-xs text-green-800">Approved</div>
            </button>
          </div>
        </div>
      </div>

      {/* Compact Filters & Sorting */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">{/* Removed title section completely */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search projects..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                placeholder="Filter by location..."
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              >
                <option value="name">Project Name</option>
                <option value="status">Status</option>
                <option value="location">Location</option>
                <option value="createdAt">Date Created</option>
                <option value="updatedAt">Last Updated</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Order
              </label>
              <div className="flex gap-1">
                <button
                  onClick={() => handleSortChange(sortBy)}
                  className={`flex-1 px-1.5 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    sortOrder === 'asc'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-150'
                  }`}
                >
                  ↑ A-Z
                </button>
                <button
                  onClick={() => handleSortChange(sortBy)}
                  className={`flex-1 px-1.5 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    sortOrder === 'desc'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-150'
                  }`}
                >
                  ↓ Z-A
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Actions
              </label>
              <button
                onClick={() => {
                  setFilters({ status: '', priority: '', location: '', search: '' });
                  setActiveStatusFilter('');
                  setSortBy('name');
                  setSortOrder('asc');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-2 py-1.5 text-xs font-medium bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-gray-500"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid with Fade Transitions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">{/* Added pt-6 for proper gap between sections */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300 ${
              isTransitioning ? 'opacity-50' : 'opacity-100'
            }`}>
              {projects.map((project, index) => (
                <div
                  key={project._id}
                  onClick={() => router.push(`/public-projects/${project._id}`)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 
                           transform transition-all duration-300 ease-out
                           hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]
                           active:scale-[0.98] cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {project.name}
                    </h3>
                    <div className="flex flex-col space-y-1 ml-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    {project.location && (
                      <div className="flex items-center text-gray-500">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {project.location}
                      </div>
                    )}
                    {project.contractId && (
                      <div className="flex items-center text-gray-500">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Contract: {project.contractId}
                      </div>
                    )}
                    {project.approvedBudgetContract && (
                      <div className="flex items-center text-gray-500">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Budget: ${project.approvedBudgetContract.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Assigned Members */}
                  {project.teamMembers && project.teamMembers.length > 0 && (
                    <div className="mt-4 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                      <div className="flex items-center mb-1.5">
                        <svg className="w-3.5 h-3.5 text-blue-600 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="text-xs font-medium text-blue-700">
                          Team ({project.teamMembers.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-5">
                        {project.teamMembers.slice(0, 3).map((member: any, idx: number) => (
                          <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {member.firstName && member.lastName 
                              ? `${member.firstName} ${member.lastName}`
                              : member.username}
                          </span>
                        ))}
                        {project.teamMembers.length > 3 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            +{project.teamMembers.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Remarks */}
                  {project.remarks && (
                    <div className="mt-4 p-2 bg-amber-50/50 rounded-lg border border-amber-200">
                      <div className="flex items-start">
                        <svg className="w-3.5 h-3.5 text-amber-600 mr-1.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-amber-700 mb-0.5">Remarks</div>
                          <p className="text-xs text-amber-900 line-clamp-2">{project.remarks}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium text-gray-900">{project.progress}%</span>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-amber-600 h-2 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2m0 0V9a2 2 0 012-2h14a2 2 0 012 2v2M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600">Try adjusting your search filters</p>
          </div>
        )}
      </div>
      </>
      )}

      {/* Timeline Mode */}
      {viewMode === 'timeline' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <div className="h-[calc(100vh-8rem)] overflow-y-auto">
              <ProjectTimeline compact={true} isPublic={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}