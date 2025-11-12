'use client';

import { useEffect, useState } from 'react';

export default function CalendarDebugPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch projects
      const projectsResponse = await fetch('/api/public/projects?limit=100');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.data || []);
        console.log('Projects data:', projectsData);
      }

      // Fetch tasks
      const tasksResponse = await fetch('/api/public/tasks?limit=100');
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData.data || []);
        console.log('Tasks data:', tasksData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading debug data...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Calendar Debug Information</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Projects Debug */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">
            Projects Data ({projects.length} items)
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {projects.map((project, index) => (
              <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                <div className="font-medium">{project.name || 'No name'}</div>
                <div className="text-sm text-gray-600">
                  Status: {project.status || 'No status'}<br/>
                  Start: {project.startDate ? new Date(project.startDate).toDateString() : 'No start date'}<br/>
                  End: {project.endDate ? new Date(project.endDate).toDateString() : 'No end date'}<br/>
                  Deadline: {(project as any).deadline ? new Date((project as any).deadline).toDateString() : 'No deadline'}
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="text-gray-500 italic">No projects found</div>
            )}
          </div>
        </div>

        {/* Tasks Debug */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-600">
            Tasks Data ({tasks.length} items)
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {tasks.map((task, index) => (
              <div key={index} className="border-l-4 border-green-200 pl-4 py-2">
                <div className="font-medium">{task.title || 'No title'}</div>
                <div className="text-sm text-gray-600">
                  Status: {task.status || 'No status'}<br/>
                  Due Date: {task.dueDate ? new Date(task.dueDate).toDateString() : 'No due date'}<br/>
                  Priority: {task.priority || 'No priority'}<br/>
                  Assignee: {task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned'}<br/>
                  Project: {(task as any).project?.name || 'No project'}
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-gray-500 italic">No tasks found</div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Events Preview */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-600">
          Calendar Events Preview
        </h2>
        <div className="space-y-2">
          {/* Project Events */}
          {projects.map((project, index) => {
            const events = [];
            if (project.startDate) {
              events.push({
                type: 'Project Start',
                title: `📋 ${project.name}`,
                date: new Date(project.startDate).toDateString()
              });
            }
            if ((project as any).deadline) {
              events.push({
                type: 'Project Deadline',
                title: `⚠️ ${project.name} (Deadline)`,
                date: new Date((project as any).deadline).toDateString()
              });
            }
            return events.map((event, eventIndex) => (
              <div key={`project-${index}-${eventIndex}`} className="flex items-center space-x-4 py-2 border-b">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{event.type}</span>
                <span className="font-medium">{event.title}</span>
                <span className="text-gray-500">{event.date}</span>
              </div>
            ));
          })}
          
          {/* Task Events */}
          {tasks.filter(task => task.dueDate).map((task, index) => (
            <div key={`task-${index}`} className="flex items-center space-x-4 py-2 border-b">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Task</span>
              <span className="font-medium">✓ {task.title}</span>
              <span className="text-gray-500">{new Date(task.dueDate).toDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}