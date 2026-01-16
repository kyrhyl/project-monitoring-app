'use client';

import { useState, useEffect, useCallback } from 'react';
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
  progress?: number;
  tasks: TaskPhase[];
  teamName?: string;
}

interface TimelineProps {
  initialTeamFilter?: string;
  projectId?: string; // Optional: if provided, show only this project
  compact?: boolean; // Optional: compact view mode
  isPublic?: boolean; // Optional: use public API endpoints
}

type ViewMode = 'project' | 'member';

interface TaskConflict {
  taskId: string;
  conflictingWith: string[];
}

interface MemberWorkload {
  memberId: string;
  memberName: string;
  tasks: TaskPhase[];
  projects: Set<string>;
}

interface ProjectDuration {
  projectId: string;
  projectName: string;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  teamMembers: string[];
  hasConflicts: boolean;
}

interface ResourceAvailability {
  memberName: string;
  busyPeriods: { start: Date; end: Date; projectName: string }[];
  availablePeriods: { start: Date; end: Date }[];
  utilizationPercent: number;
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

// Helper function to detect task conflicts (overlapping dates for same person)
const detectConflicts = (allProjects: ProjectTimelineData[]): Map<string, TaskConflict> => {
  const conflictMap = new Map<string, TaskConflict>();
  const tasksByMember = new Map<string, TaskPhase[]>();

  // Group tasks by assignee
  allProjects.forEach(project => {
    project.tasks.forEach((task: any) => {
      const memberId = task.assigneeId?._id || task.assigneeId;
      if (memberId && task.startDate && task.dueDate) {
        if (!tasksByMember.has(memberId)) {
          tasksByMember.set(memberId, []);
        }
        tasksByMember.get(memberId)!.push(task);
      }
    });
  });

  // Check for overlaps
  tasksByMember.forEach((tasks, memberId) => {
    tasks.forEach((task1, idx1) => {
      const start1 = new Date(task1.startDate!);
      const end1 = new Date(task1.dueDate!);
      const conflictingWith: string[] = [];

      tasks.forEach((task2, idx2) => {
        if (idx1 !== idx2) {
          const start2 = new Date(task2.startDate!);
          const end2 = new Date(task2.dueDate!);

          // Check if dates overlap
          if (start1 <= end2 && end1 >= start2) {
            conflictingWith.push(task2._id);
          }
        }
      });

      if (conflictingWith.length > 0) {
        conflictMap.set(task1._id, {
          taskId: task1._id,
          conflictingWith
        });
      }
    });
  });

  return conflictMap;
};

// Helper function to group tasks by member
const groupTasksByMember = (allProjects: ProjectTimelineData[]): MemberWorkload[] => {
  const memberMap = new Map<string, MemberWorkload>();

  allProjects.forEach(project => {
    project.tasks.forEach((task: any) => {
      const memberId = task.assigneeId?._id || task.assigneeId || 'unassigned';
      const memberName = task.assigneeId 
        ? `${task.assigneeId.firstName || ''} ${task.assigneeId.lastName || ''}`.trim() 
        : task.assigneeName || 'Unassigned';

      if (!memberMap.has(memberId)) {
        memberMap.set(memberId, {
          memberId,
          memberName,
          tasks: [],
          projects: new Set()
        });
      }

      const workload = memberMap.get(memberId)!;
      workload.tasks.push({ ...task, projectName: project.name, projectId: project._id });
      workload.projects.add(project.name);
    });
  });

  return Array.from(memberMap.values()).sort((a, b) => a.memberName.localeCompare(b.memberName));
};

// Helper function to calculate project durations and team assignments
const calculateProjectDurations = (allProjects: ProjectTimelineData[], conflictMap: Map<string, TaskConflict>): ProjectDuration[] => {
  return allProjects.map(project => {
    const startDate = project.startDate ? new Date(project.startDate) : new Date();
    const endDate = project.endDate ? new Date(project.endDate) : new Date();
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get unique team members assigned to this project
    const teamMembers = new Set<string>();
    project.tasks.forEach((task: any) => {
      const memberName = task.assigneeId 
        ? `${task.assigneeId.firstName || ''} ${task.assigneeId.lastName || ''}`.trim() 
        : task.assigneeName || 'Unassigned';
      if (memberName !== 'Unassigned') {
        teamMembers.add(memberName);
      }
    });
    
    // Check if any tasks in this project have conflicts
    const hasConflicts = project.tasks.some((task: any) => conflictMap.has(task._id));
    
    return {
      projectId: project._id,
      projectName: project.name,
      startDate,
      endDate,
      durationDays,
      teamMembers: Array.from(teamMembers),
      hasConflicts
    };
  }).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
};

// Helper function to analyze resource availability
const analyzeResourceAvailability = (allProjects: ProjectTimelineData[], dateRange: { start: Date; end: Date }): ResourceAvailability[] => {
  const memberWorkloads = groupTasksByMember(allProjects);
  
  return memberWorkloads.map(workload => {
    // Get all busy periods for this member
    const busyPeriods = workload.tasks
      .filter(task => task.startDate && task.dueDate)
      .map((task: any) => ({
        start: new Date(task.startDate),
        end: new Date(task.dueDate),
        projectName: task.projectName
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Calculate utilization percentage
    const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const busyDays = busyPeriods.reduce((sum, period) => {
      return sum + Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    const utilizationPercent = totalDays > 0 ? Math.round((busyDays / totalDays) * 100) : 0;
    
    // Find available periods (gaps between busy periods)
    const availablePeriods: { start: Date; end: Date }[] = [];
    if (busyPeriods.length > 0) {
      // Check gap before first task
      if (busyPeriods[0].start.getTime() > dateRange.start.getTime()) {
        availablePeriods.push({
          start: dateRange.start,
          end: busyPeriods[0].start
        });
      }
      
      // Check gaps between tasks
      for (let i = 0; i < busyPeriods.length - 1; i++) {
        const gap = busyPeriods[i + 1].start.getTime() - busyPeriods[i].end.getTime();
        if (gap > 24 * 60 * 60 * 1000) { // More than 1 day gap
          availablePeriods.push({
            start: busyPeriods[i].end,
            end: busyPeriods[i + 1].start
          });
        }
      }
      
      // Check gap after last task
      if (busyPeriods[busyPeriods.length - 1].end.getTime() < dateRange.end.getTime()) {
        availablePeriods.push({
          start: busyPeriods[busyPeriods.length - 1].end,
          end: dateRange.end
        });
      }
    } else {
      // Completely available
      availablePeriods.push({
        start: dateRange.start,
        end: dateRange.end
      });
    }
    
    return {
      memberName: workload.memberName,
      busyPeriods,
      availablePeriods,
      utilizationPercent
    };
  }).sort((a, b) => b.utilizationPercent - a.utilizationPercent);
};

export default function ProjectTimeline({ initialTeamFilter, projectId, isPublic = false }: TimelineProps) {
  const [projects, setProjects] = useState<ProjectTimelineData[]>([]);
  const [teams, setTeams] = useState<{ _id: string; name: string }[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>(initialTeamFilter || 'all');
  const [dateRange, setDateRange] = useState({ start: new Date(), end: new Date() });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('project');
  const [conflicts, setConflicts] = useState<Map<string, TaskConflict>>(new Map());
  const [showPlanningPanel, setShowPlanningPanel] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  // Sync top and main scrollbars
  useEffect(() => {
    const topScroll = document.getElementById('top-scroll');
    const mainScroll = document.getElementById('main-scroll');
    
    if (!topScroll || !mainScroll) return;

    const syncTopToMain = () => {
      if (mainScroll) mainScroll.scrollLeft = topScroll.scrollLeft;
    };

    const syncMainToTop = () => {
      if (topScroll) topScroll.scrollLeft = mainScroll.scrollLeft;
    };

    topScroll.addEventListener('scroll', syncTopToMain);
    mainScroll.addEventListener('scroll', syncMainToTop);

    return () => {
      if (topScroll) topScroll.removeEventListener('scroll', syncTopToMain);
      if (mainScroll) mainScroll.removeEventListener('scroll', syncMainToTop);
    };
  }, []);

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
      // Determine API base path based on isPublic prop
      const apiBase = isPublic ? '/api/public' : '/api';
      
      // If projectId is provided, fetch only that project
      if (projectId) {
        if (isPublic) {
          // Public API: only fetch project, no tasks
          const projectRes = await fetch(`${apiBase}/projects/${projectId}`);
          const projectData = await projectRes.json();
          
          if (projectData.success) {
            const project = {
              ...projectData.data,
              tasks: [],
              teamName: 'Public'
            };
            setProjects([project]);
            calculateDateRange([project]);
          }
        } else {
          // Authenticated API: fetch project and tasks
          const [projectRes, tasksRes] = await Promise.all([
            fetch(`${apiBase}/projects/${projectId}`),
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
        }
      } else {
        // Original behavior: fetch all projects
        const url = selectedTeam && selectedTeam !== 'all' 
          ? `${apiBase}/projects?teamId=${selectedTeam}` 
          : `${apiBase}/projects`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        // Handle both response formats: { projects: [...] } or { success: true, data: [...] }
        const projectsList = data.projects || data.data || [];
        
        if (projectsList.length > 0) {
          // For public API, tasks are not available separately
          if (isPublic) {
            const projectsWithTasks = projectsList.map((project: any) => ({
              ...project,
              tasks: [],
              teamName: 'Public'
            }));
            setProjects(projectsWithTasks);
            calculateDateRange(projectsWithTasks);
          } else {
            // Fetch tasks for each project (authenticated API)
            const projectsWithTasks = await Promise.all(
              projectsList.map(async (project: any) => {
                try {
                  const tasksRes = await fetch(`/api/projects/${project._id}/tasks`);
                  const tasksData = await tasksRes.json();
                  return {
                    ...project,
                    tasks: tasksData.data || tasksData.tasks || [],
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
            setConflicts(detectConflicts(projectsWithTasks));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!projectId) {
      fetchTeams();
    }
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, selectedTeam]);

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

  const memberWorkloads = groupTasksByMember(projects);
  const totalConflicts = conflicts.size;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {projectId ? 'Task Timeline' : 'Project Timeline'}
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">
            {viewMode === 'project' ? 'Gantt chart view of all project tasks' : 'Team member workload view'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          {!projectId && (
            <div className="bg-gray-100 rounded-lg p-1 flex items-center gap-1">
              <button
                onClick={() => setViewMode('project')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'project'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📊 By Project
              </button>
              <button
                onClick={() => setViewMode('member')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'member'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                👥 By Member
              </button>
            </div>
          )}

          {/* Conflict Warning */}
          {totalConflicts > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-red-600 font-bold text-lg">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-red-900">{totalConflicts} Conflict{totalConflicts !== 1 ? 's' : ''}</p>
                <p className="text-xs text-red-700">Overlapping assignments detected</p>
              </div>
            </div>
          )}
          
          {/* Planning Panel Toggle */}
          {!projectId && (
            <button
              onClick={() => setShowPlanningPanel(!showPlanningPanel)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                showPlanningPanel
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50'
              }`}
            >
              📅 {showPlanningPanel ? 'Hide' : 'Show'} Planning Info
            </button>
          )}
          
          {/* Team Filter */}
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

      {/* Planning Panel */}
      {showPlanningPanel && !projectId && !loading && (
        <div className="mb-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6 shadow-lg flex-shrink-0">
          <h3 className="text-2xl font-bold text-indigo-900 mb-6 flex items-center gap-3">
            <span className="text-3xl">📊</span>
            Project Planning & Resource Analysis
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Durations */}
            <div className="bg-white rounded-lg p-5 shadow-md border border-indigo-100">
              <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">📅</span>
                Project Durations & Team Assignments
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {calculateProjectDurations(projects, conflicts).map(project => (
                  <div key={project.projectId} className={`p-4 rounded-lg border-2 ${
                    project.hasConflicts 
                      ? 'bg-red-50 border-red-300' 
                      : 'bg-green-50 border-green-300'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h5 className="font-bold text-gray-900">{project.projectName}</h5>
                        <p className="text-sm text-gray-600 mt-1">
                          📆 {project.startDate.toLocaleDateString()} → {project.endDate.toLocaleDateString()}
                        </p>
                        <p className="text-sm font-semibold text-indigo-700 mt-1">
                          Duration: {project.durationDays} days ({Math.ceil(project.durationDays / 7)} weeks)
                        </p>
                      </div>
                      {project.hasConflicts && (
                        <span className="text-red-500 text-2xl">⚠️</span>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Team Members ({project.teamMembers.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {project.teamMembers.length > 0 ? (
                          project.teamMembers.map(member => (
                            <span key={member} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-medium">
                              👤 {member}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500 italic">No team members assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No projects to display</p>
                )}
              </div>
            </div>
            
            {/* Resource Availability */}
            <div className="bg-white rounded-lg p-5 shadow-md border border-indigo-100">
              <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">👥</span>
                Team Member Availability & Utilization
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {analyzeResourceAvailability(projects, dateRange).map(resource => (
                  <div key={resource.memberName} className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-gray-900">{resource.memberName}</h5>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        resource.utilizationPercent > 80 ? 'bg-red-100 text-red-800' :
                        resource.utilizationPercent > 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {resource.utilizationPercent}% Utilized
                      </div>
                    </div>
                    
                    {/* Utilization Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          resource.utilizationPercent > 80 ? 'bg-red-500' :
                          resource.utilizationPercent > 50 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(resource.utilizationPercent, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">Busy Periods ({resource.busyPeriods.length}):</p>
                        <div className="space-y-1">
                          {resource.busyPeriods.slice(0, 3).map((period, idx) => (
                            <div key={idx} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded flex items-center gap-2">
                              <span className="font-medium">{period.projectName}</span>
                              <span className="text-gray-600">
                                {period.start.toLocaleDateString()} - {period.end.toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                          {resource.busyPeriods.length > 3 && (
                            <p className="text-xs text-gray-500 italic">+ {resource.busyPeriods.length - 3} more</p>
                          )}
                          {resource.busyPeriods.length === 0 && (
                            <p className="text-xs text-gray-500 italic">No scheduled tasks</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">Available Periods ({resource.availablePeriods.length}):</p>
                        <div className="space-y-1">
                          {resource.availablePeriods.slice(0, 2).map((period, idx) => (
                            <div key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {period.start.toLocaleDateString()} - {period.end.toLocaleDateString()}
                            </div>
                          ))}
                          {resource.availablePeriods.length > 2 && (
                            <p className="text-xs text-gray-500 italic">+ {resource.availablePeriods.length - 2} more</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {groupTasksByMember(projects).length === 0 && (
                  <p className="text-center text-gray-500 py-8">No team members with assignments</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Planning Recommendations */}
          <div className="mt-6 bg-white rounded-lg p-5 shadow-md border border-indigo-100">
            <h4 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Planning Recommendations
            </h4>
            <div className="space-y-2 text-sm">
              {totalConflicts > 0 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-bold text-red-900">Resolve {totalConflicts} scheduling conflict{totalConflicts !== 1 ? 's' : ''}</p>
                    <p className="text-red-700 text-xs mt-1">Team members have overlapping task assignments. Adjust task dates or reassign tasks to prevent workload issues.</p>
                  </div>
                </div>
              )}
              {analyzeResourceAvailability(projects, dateRange).filter(r => r.utilizationPercent > 80).length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="font-bold text-yellow-900">
                      {analyzeResourceAvailability(projects, dateRange).filter(r => r.utilizationPercent > 80).length} team member(s) over-utilized
                    </p>
                    <p className="text-yellow-700 text-xs mt-1">
                      Consider redistributing tasks or extending project timelines to prevent burnout.
                    </p>
                  </div>
                </div>
              )}
              {analyzeResourceAvailability(projects, dateRange).filter(r => r.utilizationPercent < 30).length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <span className="text-2xl">📋</span>
                  <div>
                    <p className="font-bold text-blue-900">
                      {analyzeResourceAvailability(projects, dateRange).filter(r => r.utilizationPercent < 30).length} team member(s) under-utilized
                    </p>
                    <p className="text-blue-700 text-xs mt-1">
                      These members have capacity for additional tasks.
                    </p>
                  </div>
                </div>
              )}
              {totalConflicts === 0 && analyzeResourceAvailability(projects, dateRange).every(r => r.utilizationPercent >= 30 && r.utilizationPercent <= 80) && (
                <div className="flex items-start gap-3 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-bold text-green-900">Schedule looks good!</p>
                    <p className="text-green-700 text-xs mt-1">No conflicts detected and team workload is well-balanced.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 flex-1">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Scrollbar Mirror */}
          <div className="overflow-x-auto overflow-y-hidden border-b border-gray-300 bg-gray-50" id="top-scroll">
            <div className="min-w-[1200px] h-3"></div>
          </div>
          
          <div className="flex-1 overflow-auto" id="main-scroll">
            <div className="min-w-[1200px]">
              {/* Date Headers - Sticky */}
              <div className="flex border-b-2 border-gray-300 sticky top-0 z-30 bg-white shadow-md">
              <div className="w-64 flex-shrink-0 font-semibold text-gray-700 py-4 px-4 bg-gray-100 text-base sticky left-0 z-40 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">
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
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-2">No projects found.</p>
                <p className="text-sm text-gray-400">Create your first project to get started!</p>
              </div>
            ) : viewMode === 'project' && (
              /* PROJECT VIEW */
              projects.map((project, idx) => {
                const isExpanded = expandedProjects.has(project._id);
                const projectDuration = project.startDate && project.endDate 
                  ? `${new Date(project.startDate).toLocaleDateString()} - ${new Date(project.endDate).toLocaleDateString()}`
                  : 'No dates set';
                const durationDays = project.startDate && project.endDate
                  ? Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))
                  : 0;

                return (
                  <div key={project._id} className={`border-b-2 border-gray-300`}>
                    {/* Project Header - Clickable Accordion */}
                    {!projectId && (
                      <div 
                        className="flex bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 cursor-pointer transition-all duration-200 border-b border-gray-200 group"
                        onClick={() => toggleProject(project._id)}
                      >
                        <div className="w-64 flex-shrink-0 py-2 px-3 flex items-center gap-2 sticky left-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100 group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-200">
                          {/* Expand/Collapse Icon with animation */}
                          <div className={`transition-all duration-300 ease-in-out transform ${isExpanded ? 'rotate-90 text-blue-600' : 'text-gray-500 group-hover:text-blue-600'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 text-sm truncate group-hover:text-blue-900 transition-colors" title={project.name}>{project.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {project.teamName && project.teamName !== 'Unassigned' && (
                                <span className="bg-white px-1.5 py-0.5 rounded text-[10px] border border-gray-300 group-hover:border-blue-300 group-hover:bg-blue-50 transition-colors">
                                  👥 {project.teamName}
                                </span>
                              )}
                              <span className={`px-1.5 py-0.5 rounded text-white text-[10px] font-medium shadow-sm ${
                                project.status === 'completed' ? 'bg-green-600' :
                                project.status === 'on-going' ? 'bg-blue-600' :
                                project.status === 'submitted' ? 'bg-orange-500' :
                                'bg-gray-500'
                              }`}>
                                {project.status}
                              </span>
                              <span className="text-[10px] text-gray-600 group-hover:text-blue-700 transition-colors">
                                📅 {durationDays > 0 ? `${durationDays}d` : 'No dates'}
                              </span>
                              <span className="text-[10px] text-indigo-600 font-medium group-hover:text-indigo-700 transition-colors">
                                {isExpanded ? '📂' : '📁'} {project.tasks.length} task{project.tasks.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 relative py-2">
                          {/* Project duration bar */}
                          {project.startDate && project.endDate && (
                            <div
                              className="absolute top-2 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold shadow hover:shadow-md transition-shadow"
                              style={{
                                left: `${calculateBarPosition(project.startDate, project.endDate).left}%`,
                                width: `${calculateBarPosition(project.startDate, project.endDate).width}%`,
                                backgroundColor: project.status === 'completed' ? '#10b981' : 
                                               project.status === 'on-going' ? '#3b82f6' : 
                                               project.status === 'submitted' ? '#f59e0b' : '#6b7280',
                                minWidth: '60px'
                              }}
                            >
                              {project.progress}%
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Task rows - Only show when expanded or in single project view */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      (isExpanded || projectId) ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      {project.tasks.length === 0 ? (
                        <div className="flex py-4 bg-white border-t border-gray-200">
                          <div className="w-64 flex-shrink-0 px-4 text-sm text-gray-500 italic pl-16">
                            💭 No tasks assigned yet
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
                  </div>
                );
              })
            )}
          </div>
        </div>
        </div>
      )}

      {/* Member View */}
      {viewMode === 'member' && (
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {groupTasksByMember(projects).map((workload) => {
              const memberConflicts = workload.tasks.filter(task => conflicts.has(task._id));
              
              return (
                <div key={workload.memberId} className="mb-8 border-2 border-gray-300 rounded-lg overflow-hidden">
                  {/* Member Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-2xl font-bold">
                          {workload.memberName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{workload.memberName}</h3>
                        <p className="text-sm text-indigo-100">
                          {workload.tasks.length} task{workload.tasks.length !== 1 ? 's' : ''} across {workload.projects.size} project{workload.projects.size !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {memberConflicts.length > 0 && (
                      <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                        <span className="text-2xl">⚠️</span>
                        <span>{memberConflicts.length} Conflict{memberConflicts.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* Conflict Warnings */}
                  {memberConflicts.length > 0 && (
                    <div className="bg-red-50 border-b-2 border-red-200 p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">⚠️</span>
                        <div className="flex-1">
                          <h4 className="font-bold text-red-800 text-lg mb-2">Schedule Conflicts Detected</h4>
                          {memberConflicts.map((task, idx) => {
                            const conflict = conflicts.get(task._id);
                            if (!conflict) return null;
                            
                            return (
                              <div key={idx} className="mb-3 p-3 bg-white border border-red-300 rounded-lg">
                                <p className="font-semibold text-red-900 mb-2">
                                  📅 Task: {task.title}
                                </p>
                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    <span className="font-medium">{new Date(task.startDate!).toLocaleDateString()} - {new Date(task.dueDate!).toLocaleDateString()}</span>
                                  </div>
                                  <div className="text-gray-600">
                                    Conflicts with {conflict.conflictingWith.length} other task(s)
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="p-6 bg-white">
                    {/* Date Headers */}
                    <div className="flex mb-2">
                      <div className="w-48 flex-shrink-0"></div>
                      <div className="flex-1 flex border-b border-gray-200">
                        {dateHeaders.map((date, index) => {
                          const { day, month } = formatDateHeader(date);
                          return (
                            <div
                              key={index}
                              className="flex-1 text-center text-xs font-semibold text-gray-600 pb-2"
                              style={{ minWidth: '40px' }}
                            >
                              {day}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Group tasks by project */}
                    {Array.from(workload.projects).map(projectName => {
                      const projectTasks = workload.tasks.filter((t: any) => t.projectName === projectName);
                      const hasConflict = projectTasks.some(task => conflicts.has(task._id));

                      return (
                        <div key={projectName} className="mb-4">
                          <div className="flex items-center gap-2 mb-2 px-2">
                            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
                            <span className="font-semibold text-gray-700">{projectName}</span>
                            {hasConflict && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                                Has Conflicts
                              </span>
                            )}
                          </div>

                          {projectTasks.map((task: any, taskIdx: number) => {
                            const isConflicting = conflicts.has(task._id);

                            return (
                              <div
                                key={task._id}
                                className={`flex items-center mb-2 ${
                                  isConflicting ? 'bg-red-50 border-2 border-red-300 rounded-lg p-2' : ''
                                }`}
                              >
                                <div className="w-48 flex-shrink-0 pr-4">
                                  <div className="flex items-center gap-2">
                                    {isConflicting && <span className="text-red-500 text-xl">⚠️</span>}
                                    <div>
                                      <div className="text-sm font-medium text-gray-800">{task.title}</div>
                                      <div className="text-xs text-gray-500">{task.phase}</div>
                                      {task.completedAt && (
                                        <div className="flex items-center gap-1 mt-1">
                                          {new Date(task.completedAt) < new Date(task.dueDate!) ? (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                              <span>✓</span> Early
                                            </span>
                                          ) : new Date(task.completedAt).toDateString() === new Date(task.dueDate!).toDateString() ? (
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                              <span>✓</span> On Time
                                            </span>
                                          ) : (
                                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                              <span>✓</span> Late
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-1 relative h-12">
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
                                  
                                  {/* Task Bar */}
                                  {task.startDate && task.dueDate ? (() => {
                                    const taskStart = new Date(task.startDate);
                                    const taskEnd = new Date(task.dueDate);
                                    const position = calculateBarPosition(taskStart, taskEnd);
                                    if (position.width === 0) return null;
                                    
                                    const completionStatus = getCompletionStatus(task);
                                    
                                    return (
                                      <div className="relative">
                                        <div
                                          className={`absolute h-6 rounded-lg flex items-center px-2.5 text-white text-xs font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer ${getPhaseColor(task.phase)} ${
                                            isConflicting ? 'border-4 border-red-500 shadow-lg shadow-red-300' : ''
                                          }`}
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
                                            className={`absolute w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${
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
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {groupTasksByMember(projects).length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">
                  No team members with assigned tasks found.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend - Compact */}
      <div className="mt-4 p-2 bg-gray-50 rounded border border-gray-200">
        <div className="flex items-center gap-4 text-xs flex-wrap mb-2">
          <span className="font-bold text-gray-800 text-sm">PHASES:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-yellow-400"></div>
            <span className="text-gray-700">Architectural</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-teal-500"></div>
            <span className="text-gray-700">Structural</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <span className="text-gray-700">Electrical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-purple-500"></div>
            <span className="text-gray-700">Mechanical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-gray-700">Final Plan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-blue-400"></div>
            <span className="text-gray-700">Final Estimate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-pink-400"></div>
            <span className="text-gray-700">Checking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-gray-400"></div>
            <span className="text-gray-700">Other</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs flex-wrap">
          <span className="font-bold text-gray-800 text-sm">COMPLETION STATUS:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-bold">✓</div>
            <span className="text-gray-700">Completed Early</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">✓</div>
            <span className="text-gray-700">Completed On Time</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">!</div>
            <span className="text-gray-700">Completed Late</span>
          </div>
        </div>
      </div>
    </div>
  );
}
