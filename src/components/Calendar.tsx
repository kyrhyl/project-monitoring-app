'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CalendarProject {
  _id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: string;
  priority: string;
  teamLeader: string;
}

interface CalendarTask {
  _id: string;
  title: string;
  dueDate: Date;
  status: string;
  priority: string;
  projectId: string;
  projectName: string;
  assigneeName: string;
}

interface CalendarItem {
  id: string;
  title: string;
  date: Date;
  type: 'project' | 'task';
  status: string;
  priority: string;
  projectName?: string;
  assigneeName?: string;
  isStart?: boolean;
  isEnd?: boolean;
}

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarItem[]>([]);
  const [filteredData, setFilteredData] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'month' | 'week'>('month');
  const [isMobile, setIsMobile] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    type: 'all',
    assignee: 'all'
  });

  const fetchCalendarData = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/calendar', {
        credentials: 'include' // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error('Failed to fetch calendar data');
      }

      const data = await response.json();
      
      const items: CalendarItem[] = [];
      
      // Add projects
      data.projects.forEach((project: CalendarProject) => {
        if (project.startDate) {
          items.push({
            id: project._id,
            title: project.name,
            date: new Date(project.startDate),
            type: 'project',
            status: project.status,
            priority: project.priority,
            isStart: true
          });
        }
        
        if (project.endDate) {
          items.push({
            id: `${project._id}-end`,
            title: `${project.name} (End)`,
            date: new Date(project.endDate),
            type: 'project',
            status: project.status,
            priority: project.priority,
            isEnd: true
          });
        }
      });

      // Add tasks
      data.tasks.forEach((task: CalendarTask) => {
        if (task.dueDate) {
          items.push({
            id: task._id,
            title: task.title,
            date: new Date(task.dueDate),
            type: 'task',
            status: task.status,
            priority: task.priority,
            projectName: task.projectName,
            assigneeName: task.assigneeName
          });
        }
      });

      setCalendarData(items);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setError('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [calendarData, filters]);

  const applyFilters = () => {
    let filtered = calendarData;

    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(item => item.priority === filters.priority);
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(item => item.type === filters.type);
    }

    if (filters.assignee !== 'all') {
      filtered = filtered.filter(item => 
        item.type === 'task' && item.assigneeName === filters.assignee
      );
    }

    setFilteredData(filtered);
  };

  const getUniqueAssignees = () => {
    const assignees = calendarData
      .filter(item => item.type === 'task' && item.assigneeName)
      .map(item => item.assigneeName!)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return assignees;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];
    
    // Previous month days
    for (let i = firstDayWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }

    // Next month days to fill the grid
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false });
    }

    return days;
  };

  const getItemsForDate = (date: Date) => {
    return filteredData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'on-hold': 'bg-gray-100 text-gray-800 border-gray-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const priorityColors = {
      'low': 'bg-green-50 border-l-green-400',
      'medium': 'bg-yellow-50 border-l-yellow-400',
      'high': 'bg-red-50 border-l-red-400'
    };
    return priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-50 border-l-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-800"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
        {error}
      </div>
    );
  }

  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const days = getDaysInMonth(currentDate);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-amber-900">{monthYear}</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                view === 'month' 
                  ? 'bg-amber-800 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                view === 'week' 
                  ? 'bg-amber-800 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 text-sm font-medium"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <div className="flex items-center space-x-2 min-w-0">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Type:</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-0"
            >
              <option value="all">All</option>
              <option value="project">Projects</option>
              <option value="task">Tasks</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 min-w-0">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-0"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 min-w-0">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Priority:</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-0"
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 min-w-0">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Assignee:</label>
            <select
              value={filters.assignee}
              onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
              className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-0"
            >
              <option value="all">All</option>
              {getUniqueAssignees().map(assignee => (
                <option key={assignee} value={assignee}>
                  {assignee}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setFilters({ status: 'all', priority: 'all', type: 'all', assignee: 'all' })}
            className="px-3 sm:px-4 py-1 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 whitespace-nowrap"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-auto">
        <div className="grid grid-cols-7 gap-1 min-w-max sm:min-w-0">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded-t-lg min-w-24 sm:min-w-32">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
          
          {/* Calendar Days */}
          {days.map((day, index) => {
            const items = getItemsForDate(day.date);
            const isToday = day.date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`min-h-20 sm:min-h-24 min-w-24 sm:min-w-32 border border-gray-100 p-1 ${
                  day.isCurrentMonth 
                    ? 'bg-white' 
                    : 'bg-gray-50'
                } ${
                  isToday 
                    ? 'ring-2 ring-amber-400 ring-opacity-50' 
                    : ''
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  day.isCurrentMonth 
                    ? isToday 
                      ? 'text-amber-800' 
                      : 'text-gray-900'
                    : 'text-gray-400'
                }`}>
                  {day.date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {items.slice(0, isMobile ? 1 : 3).map((item) => (
                    <div
                      key={item.id}
                      className={`text-xs p-1 rounded border-l-2 ${getPriorityColor(item.priority)} cursor-pointer hover:shadow-sm transition-shadow`}
                      title={`${item.title} - ${item.status} priority: ${item.priority}${item.assigneeName ? ` (${item.assigneeName})` : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate flex-1">
                          <span className="hidden sm:inline">{item.type === 'project' ? '📋' : '✓'} </span>
                          <span className="sm:hidden">{item.type === 'project' ? '📋' : '✓'}</span>
                          <span className="hidden sm:inline">{item.title}</span>
                          <span className="sm:hidden">{item.title.substring(0, 8)}...</span>
                        </span>
                        <span className={`px-1 py-0.5 rounded text-xs ${getStatusColor(item.status)}`}>
                          {item.status.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {item.type === 'task' && item.assigneeName && (
                        <div className="text-gray-600 text-xs truncate font-medium">
                          👤 {item.assigneeName}
                        </div>
                      )}
                      {item.projectName && (
                        <div className="text-gray-500 text-xs truncate hidden sm:block">
                          {item.projectName}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {items.length > (isMobile ? 1 : 3) && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{items.length - (isMobile ? 1 : 3)} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <span>📋</span>
          <span>Projects</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>✓</span>
          <span>Tasks</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>👤</span>
          <span>Assigned Team Member</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-100 border-l-2 border-l-green-400 rounded-sm"></div>
          <span>Low Priority</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-100 border-l-2 border-l-yellow-400 rounded-sm"></div>
          <span>Medium Priority</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-100 border-l-2 border-l-red-400 rounded-sm"></div>
          <span>High Priority</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;