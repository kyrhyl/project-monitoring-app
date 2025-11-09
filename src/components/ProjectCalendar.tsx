'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ProjectCalendarTask {
  _id: string;
  title: string;
  dueDate: Date;
  status: string;
  priority: string;
  assigneeName: string;
}

interface ProjectCalendarProps {
  projectId: string;
}

interface CalendarItem {
  id: string;
  title: string;
  date: Date;
  status: string;
  priority: string;
  assigneeName?: string;
}

const ProjectCalendar: React.FC<ProjectCalendarProps> = ({ projectId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProjectCalendarData = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        credentials: 'include' // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project tasks');
      }

      const data = await response.json();
      
      // Check if the response has the expected structure
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch project tasks');
      }
      
      const items: CalendarItem[] = (data.data || [])
        .filter((task: ProjectCalendarTask) => task.dueDate)
        .map((task: ProjectCalendarTask) => ({
          id: task._id,
          title: task.title,
          date: new Date(task.dueDate),
          status: task.status,
          priority: task.priority,
          assigneeName: task.assigneeName
        }));

      setCalendarData(items);
    } catch (error) {
      console.error('Error fetching project calendar data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load project calendar data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectCalendarData();
    }
  }, [projectId]);

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
    return calendarData.filter(item => {
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
      'todo': 'bg-gray-100 text-gray-800 border-gray-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200'
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
        <h2 className="text-2xl font-bold text-amber-900">Project Tasks - {monthYear}</h2>
        
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

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded-t-lg">
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {days.map((day, index) => {
          const items = getItemsForDate(day.date);
          const isToday = day.date.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={index}
              className={`min-h-24 border border-gray-100 p-1 ${
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
                {items.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className={`text-xs p-1 rounded border-l-2 ${getPriorityColor(item.priority)} cursor-pointer hover:shadow-sm transition-shadow`}
                    title={`${item.title} - ${item.status} priority: ${item.priority} (${item.assigneeName})`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate flex-1">
                        {item.title}
                      </span>
                      <span className={`px-1 py-0.5 rounded text-xs ${getStatusColor(item.status)}`}>
                        {item.status === 'todo' ? 'T' : item.status === 'in-progress' ? 'P' : 'C'}
                      </span>
                    </div>
                    {item.assigneeName && (
                      <div className="text-gray-600 text-xs truncate font-medium">
                        👤 {item.assigneeName}
                      </div>
                    )}
                  </div>
                ))}
                
                {items.length > 2 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    +{items.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600">
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
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">T</span>
          <span>Todo</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">P</span>
          <span>In Progress</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">C</span>
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCalendar;