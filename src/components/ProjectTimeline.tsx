'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface TaskPhase {
  _id: string;
  title: string;
  phase: 'architectural' | 'structural' | 'electrical' | 'mechanical' | 'final-plan' | 'final-estimate' | 'checking' | 'other';
  status: 'todo' | 'in-progress' | 'completed';
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
  estimatedHours?: number;
}

interface ProjectTimelineData {
  _id: string;
  name: string;
  startDate?: Date;
  endDate?: Date;
  status: string;
  tasks: TaskPhase[];
  teamName?: string;
}

interface TimelineProps {
  initialTeamFilter?: string;
  projectId?: string; // Optional: if provided, show only this project
}

const phaseColors = {
  'architectural': 'bg-yellow-400',
  'structural': 'bg-teal-500',
  'electrical': 'bg-orange-500',
  'mechanical': 'bg-purple-500',
  'final-plan': 'bg-yellow-500',
  'final-estimate': 'bg-blue-400',
  'checking': 'bg-pink-400',
  'other': 'bg-gray-400',
  'todo': 'bg-gray-300',
  'in-progress': 'bg-blue-500',
  'completed': 'bg-green-500',
};

const phaseLabels = {
  'architectural': 'Architectural',
  'structural': 'Structural',
  'electrical': 'Electrical',
  'mechanical': 'Mechanical',
  'final-plan': 'Final Plan',
  'final-estimate': 'Final Estimate',
  'checking': 'Checking',
  'other': 'Other',
};

const getPhaseColor = (phase: string) => {
  return phaseColors[phase as keyof typeof phaseColors] || 'bg-gray-400';
};

// Helper function to determine completion status
const getCompletionStatus = (task: TaskPhase): 'early' | 'on-time' | 'late' | 'none' => {
  if (task.status !== 'completed' || !task.completedAt || !task.dueDate) {
    return 'none';
  }
  
  const completed = new Date(task.completedAt);
  const due = new Date(task.dueDate);
  
  // Set both to midnight for fair comparison
  completed.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  if (completed < due) return 'early';
  if (completed.getTime() === due.getTime()) return 'on-time';
  return 'late';
};

export default function ProjectTimeline({ initialTeamFilter, projectId }: TimelineProps) {
  const [projects, setProjects] = useState<ProjectTimelineData[]>([]);
  const [teams, setTeams] = useState<{ _id: string; name: string }[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>(initialTeamFilter || 'all');
  const [dateRange, setDateRange] = useState({ start: new Date(), end: new Date() });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      // Only fetch teams if not viewing a single project
      fetchTeams();
    }
    fetchProjects();
  }, [selectedTeam, projectId]);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      if (!res.ok) {
        // If not admin, user won't have access to teams endpoint
        // That's okay, we'll just not show team filter
        if (res.status === 403) {
          console.log('Team filtering not available (admin access required)');
          setTeams([]);
        }
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        setTeams(data.data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // If projectId is provided, fetch only that project
      if (projectId) {
        const [projectRes, tasksRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/tasks`)
        ]);
        
        const projectData = await projectRes.json();
        const tasksData = await tasksRes.json();
        
        if (projectData.success) {
          const project = {
            ...projectData.data,
            tasks: tasksData.data || [],
            teamName: projectData.data.teamId?.name || 'Unassigned'
          };
          setProjects([project]);
          calculateDateRange([project]);
        }
      } else {
        // Original behavior: fetch all projects
        const url = selectedTeam && selectedTeam !== 'all' 
          ? `/api/projects?teamId=${selectedTeam}` 
          : '/api/projects';
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.projects) {
          // Fetch tasks for each project
          const projectsWithTasks = await Promise.all(
            data.projects.map(async (project: any) => {
              try {
                const tasksRes = await fetch(`/api/tasks?projectId=${project._id}`);
                const tasksData = await tasksRes.json();
                return {
                  ...project,
                  tasks: tasksData.tasks || [],
                  teamName: project.teamId?.name || 'Unassigned'
                };
              } catch (error) {
                console.error(`Error fetching tasks for project ${project._id}:`, error);
                return { ...project, tasks: [], teamName: 'Unassigned' };
              }
            })
          );

          setProjects(projectsWithTasks);
          calculateDateRange(projectsWithTasks);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDateRange = (projects: ProjectTimelineData[]) => {
    if (projects.length === 0) {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setMonth(today.getMonth() + 2);
      setDateRange({ start: today, end: endDate });
      return;
    }

    let minDate = new Date();
    let maxDate = new Date();

    projects.forEach(project => {
      if (project.startDate) {
        const start = new Date(project.startDate);
        if (start < minDate) minDate = start;
      }
      if (project.endDate) {
        const end = new Date(project.endDate);
        if (end > maxDate) maxDate = end;
      }
      project.tasks.forEach(task => {
        if (task.dueDate) {
          const due = new Date(task.dueDate);
          if (due > maxDate) maxDate = due;
        }
      });
    });

    // Add padding
    const startWithPadding = new Date(minDate);
    startWithPadding.setDate(startWithPadding.getDate() - 7);
    const endWithPadding = new Date(maxDate);
    endWithPadding.setDate(endWithPadding.getDate() + 7);

    setDateRange({ start: startWithPadding, end: endWithPadding });
  };

  const generateDateHeaders = () => {
    const headers = [];
    const current = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    while (current <= end) {
      headers.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return headers;
  };

  const calculateBarPosition = (startDate: Date | undefined, endDate: Date | undefined) => {
    if (!startDate || !endDate) return { left: 0, width: 0 };

    const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const startDays = Math.ceil((new Date(startDate).getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1; // +1 to include the end date

    const left = (startDays / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: Math.max(0, left), width: Math.max(1, width) };
  };

  const formatDateHeader = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return { day, month };
  };

  const dateHeaders = generateDateHeaders();
  const groupedHeaders = dateHeaders.reduce((acc, date) => {
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(date);
    return acc;
  }, {} as Record<string, Date[]>);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {projectId ? 'Task Timeline' : 'Project Timeline'}
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">Gantt chart view of all project tasks</p>
        </div>
        
        {/* Team Filter - only show when viewing all projects */}
        <div className="flex items-center gap-4">
          {!projectId && teams.length > 0 && (
            <div className="relative">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Teams</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>{team.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          )}
          
          <button
            onClick={fetchProjects}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Date Headers */}
            <div className="flex border-b-2 border-gray-300">
              <div className="w-64 flex-shrink-0 font-semibold text-gray-700 py-4 px-4 bg-gray-100 text-base sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">
                {projectId ? 'TASK / ASSIGNED TO' : 'PROJECT NAME'}
              </div>
              <div className="flex-1 flex">
                {Object.entries(groupedHeaders).map(([monthYear, dates]) => (
                  <div key={monthYear} style={{ width: `${(dates.length / dateHeaders.length) * 100}%` }} className="border-l border-gray-300">
                    <div className="text-center font-bold text-gray-800 py-3 border-b border-gray-300 bg-gray-100 text-sm">
                      {monthYear}
                    </div>
                    <div className="flex">
                      {dates.map((date, idx) => {
                        const { day } = formatDateHeader(date);
                        const isToday = new Date().toDateString() === date.toDateString();
                        return (
                          <div
                            key={idx}
                            className={`flex-1 text-center text-sm font-medium py-2 border-l border-gray-200 ${
                              isToday ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Rows */}
            {projects.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No projects found. Create your first project to get started!
              </div>
            ) : (
              projects.map((project, idx) => (
                <div key={project._id} className={`border-b border-gray-200`}>
                  {/* Show project header only if not in single project view */}
                  {!projectId && (
                    <div className="flex bg-gray-50">
                      <div className="w-48 flex-shrink-0 py-4 px-4">
                        <div className="font-medium text-gray-900">{project.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{project.teamName}</div>
                      </div>
                      <div className="flex-1 relative py-4">
                        {/* Project bar */}
                        {project.startDate && project.endDate && (
                          <div
                            className="absolute top-4 h-8 rounded flex items-center justify-center text-white text-xs font-medium shadow-sm"
                            style={{
                              left: `${calculateBarPosition(project.startDate, project.endDate).left}%`,
                              width: `${calculateBarPosition(project.startDate, project.endDate).width}%`,
                              backgroundColor: project.status === 'completed' ? '#10b981' : 
                                             project.status === 'on-going' ? '#3b82f6' : 
                                             project.status === 'submitted' ? '#f59e0b' : '#6b7280'
                            }}
                          >
                            {project.name}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Task rows */}
                  {project.tasks.length === 0 ? (
                    <div className="flex py-4 bg-white">
                      <div className="w-48 flex-shrink-0 px-4 text-sm text-gray-500 italic">
                        No tasks
                      </div>
                    </div>
                  ) : (
                    project.tasks.map((task: any, taskIdx) => {
                      const taskStart = task.startDate ? new Date(task.startDate) : null;
                      const taskEnd = task.dueDate ? new Date(task.dueDate) : null;
                      
                      const assigneeName = task.assigneeId 
                        ? `${task.assigneeId.firstName || ''} ${task.assigneeId.lastName || ''}`.trim() || task.assigneeName || 'Unassigned'
                        : task.assigneeName || 'Unassigned';

                      return (
                        <div key={task._id} className={`flex ${taskIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                          <div className={`w-64 flex-shrink-0 py-1.5 px-4 border-t border-gray-200 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.1)] ${taskIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <div className="font-semibold text-gray-900 text-sm truncate" title={task.title}>
                              {task.title}
                            </div>
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {assigneeName}
                            </div>
                          </div>
                          <div className="flex-1 relative py-1.5 border-t border-gray-200">
                            {/* Vertical grid lines */}
                            <div className="absolute inset-0 flex">
                              {dateHeaders.map((_, idx) => (
                                <div
                                  key={idx}
                                  className="flex-1 border-l border-gray-100"
                                  style={{ width: `${100 / dateHeaders.length}%` }}
                                />
                              ))}
                            </div>
                            {taskStart && taskEnd ? (() => {
                              const position = calculateBarPosition(taskStart, taskEnd);
                              if (position.width === 0) return null;
                              
                              const completionStatus = getCompletionStatus(task);
                              
                              return (
                                <div className="relative">
                                  <div
                                    className={`absolute h-6 rounded-lg flex items-center px-2.5 text-white text-xs font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer ${getPhaseColor(task.phase)}`}
                                    style={{
                                      top: '3px',
                                      left: `${position.left}%`,
                                      width: `${position.width}%`,
                                      minWidth: '60px'
                                    }}
                                    title={`${task.title} - ${phaseLabels[task.phase as keyof typeof phaseLabels] || task.phase} - ${task.status}${
                                      task.completedAt ? `\nCompleted: ${new Date(task.completedAt).toLocaleDateString()}` : ''
                                    }${task.dueDate ? `\nDue: ${new Date(task.dueDate).toLocaleDateString()}` : ''}`}
                                  >
                                    <span className="truncate">{task.title}</span>
                                    {task.estimatedHours && (
                                      <span className="ml-2 text-xs opacity-90">• {task.estimatedHours}h</span>
                                    )}
                                  </div>
                                  {/* Completion status badge */}
                                  {completionStatus !== 'none' && (
                                    <div
                                      className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${
                                        completionStatus === 'early' ? 'bg-green-500' :
                                        completionStatus === 'on-time' ? 'bg-blue-500' :
                                        'bg-red-500'
                                      }`}
                                      style={{
                                        left: `calc(${position.left + position.width}% - 10px)`,
                                        top: '1px'
                                      }}
                                      title={
                                        completionStatus === 'early' ? '✓ Completed Early' :
                                        completionStatus === 'on-time' ? '✓ Completed On Time' :
                                        '⚠ Completed Late'
                                      }
                                    >
                                      {completionStatus === 'early' ? '✓' :
                                       completionStatus === 'on-time' ? '✓' : '!'}
                                    </div>
                                  )}
                                </div>
                              );
                            })() : (
                              <div className="flex items-center h-full">
                                <span className="text-sm text-gray-400 italic ml-3">No dates set</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="mb-4">
          <div className="flex items-center gap-6 text-sm flex-wrap">
            <span className="font-bold text-gray-800 text-base">PHASES:</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-yellow-400 shadow"></div>
              <span className="text-gray-700 font-medium">Architectural</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-teal-500 shadow"></div>
              <span className="text-gray-700 font-medium">Structural</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-orange-500 shadow"></div>
              <span className="text-gray-700 font-medium">Electrical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-purple-500 shadow"></div>
              <span className="text-gray-700 font-medium">Mechanical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-yellow-500 shadow"></div>
              <span className="text-gray-700 font-medium">Final Plan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-400 shadow"></div>
              <span className="text-gray-700 font-medium">Final Estimate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-pink-400 shadow"></div>
              <span className="text-gray-700 font-medium">Checking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gray-400 shadow"></div>
              <span className="text-gray-700 font-medium">Other</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-300 pt-3">
          <div className="flex items-center gap-6 text-sm flex-wrap">
            <span className="font-bold text-gray-800 text-base">COMPLETION STATUS:</span>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 shadow flex items-center justify-center text-white text-xs font-bold">✓</div>
              <span className="text-gray-700 font-medium">Completed Early</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-500 shadow flex items-center justify-center text-white text-xs font-bold">✓</div>
              <span className="text-gray-700 font-medium">Completed On Time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-red-500 shadow flex items-center justify-center text-white text-xs font-bold">!</div>
              <span className="text-gray-700 font-medium">Completed Late</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
