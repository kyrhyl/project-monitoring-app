'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  _id: string;
  name: string;
  status: string;
  startDate: string;
  endDate?: string;
  priority: string;
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
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  dueDate?: string;
  estimatedHours?: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'team_leader' | 'member';
  teamName?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  type: 'project' | 'task';
  status: string;
  priority: string;
  assignee?: string;
  project?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');
  const [filterType, setFilterType] = useState<'all' | 'projects' | 'tasks'>('all');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchCalendarData();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (!response.ok) {
        router.push('/login');
        return;
      }
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      
      // Fetch projects and tasks
      const [projectsResponse, tasksResponse] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tasks')
      ]);

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.projects || []);
      }

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData.tasks || []);
      }

      // Convert to calendar events
      generateCalendarEvents();
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarEvents = () => {
    const calendarEvents: CalendarEvent[] = [];

    // Add project events
    projects.forEach(project => {
      if (project.startDate) {
        calendarEvents.push({
          id: `project-${project._id}`,
          title: `📋 ${project.name}`,
          start: new Date(project.startDate),
          end: project.endDate ? new Date(project.endDate) : undefined,
          type: 'project',
          status: project.status,
          priority: project.priority,
          project: project.name
        });
      }
    });

    // Add task events
    tasks.forEach(task => {
      if (task.dueDate) {
        calendarEvents.push({
          id: `task-${task._id}`,
          title: `✓ ${task.title}`,
          start: new Date(task.dueDate),
          type: 'task',
          status: task.status,
          priority: task.priority,
          assignee: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned',
          project: task.projectId?.name
        });
      }
    });

    setEvents(calendarEvents);
  };

  useEffect(() => {
    generateCalendarEvents();
  }, [projects, tasks]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      days.push(new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000));
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      const targetDate = new Date(date);
      
      // Check if it's a multi-day project
      if (event.type === 'project' && event.end) {
        return targetDate >= new Date(event.start) && targetDate <= new Date(event.end);
      }
      
      // For single day events
      return eventDate.toDateString() === targetDate.toDateString();
    }).filter(event => {
      if (filterType === 'all') return true;
      if (filterType === 'projects') return event.type === 'project';
      if (filterType === 'tasks') return event.type === 'task';
      return true;
    });
  };

  const getStatusColor = (status: string, type: string) => {
    if (type === 'project') {
      const colors = {
        'not-yet-started': 'bg-gray-200 text-gray-800',
        'on-going': 'bg-blue-200 text-blue-800',
        'submitted': 'bg-yellow-200 text-yellow-800',
        'approved': 'bg-green-200 text-green-800'
      };
      return colors[status as keyof typeof colors] || 'bg-gray-200 text-gray-800';
    } else {
      const colors = {
        'todo': 'bg-red-200 text-red-800',
        'in-progress': 'bg-yellow-200 text-yellow-800',
        'completed': 'bg-green-200 text-green-800'
      };
      return colors[status as keyof typeof colors] || 'bg-gray-200 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project Calendar</h1>
              <p className="mt-2 text-gray-600">Schedule overview for projects and tasks</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-amber-600 hover:text-amber-800 font-medium"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                ←
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                →
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Today
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Events</option>
                <option value="projects">Projects Only</option>
                <option value="tasks">Tasks Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-4 text-center font-semibold text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {getDaysInMonth(currentDate).map((date, index) => {
              const dayEvents = getEventsForDate(date);
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border-r border-b border-gray-200 ${
                    !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                  } ${isToday ? 'bg-amber-50 border-amber-200' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-amber-600' : ''}`}>
                    {date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`text-xs p-1 rounded cursor-pointer hover:opacity-75 ${getStatusColor(event.status, event.type)}`}
                        title={`${event.title} - ${event.assignee || 'No assignee'}`}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{getPriorityIcon(event.priority)}</span>
                          <span className="truncate">{event.title}</span>
                        </div>
                        {event.assignee && (
                          <div className="text-xs opacity-75 truncate">
                            👤 {event.assignee}
                          </div>
                        )}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">Type:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedEvent.type === 'project' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {selectedEvent.type}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEvent.status, selectedEvent.type)}`}>
                  {selectedEvent.status}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">Priority:</span>
                <span className="flex items-center space-x-1">
                  <span>{getPriorityIcon(selectedEvent.priority)}</span>
                  <span className="text-sm">{selectedEvent.priority}</span>
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">Date:</span>
                <span className="text-sm">{formatDate(selectedEvent.start)}</span>
              </div>

              {selectedEvent.end && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600">End Date:</span>
                  <span className="text-sm">{formatDate(selectedEvent.end)}</span>
                </div>
              )}

              {selectedEvent.assignee && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600">Assigned to:</span>
                  <span className="text-sm">{selectedEvent.assignee}</span>
                </div>
              )}

              {selectedEvent.project && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600">Project:</span>
                  <span className="text-sm">{selectedEvent.project}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}