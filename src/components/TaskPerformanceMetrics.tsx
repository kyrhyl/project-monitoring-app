'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';

interface TaskStats {
  totalCompleted: number;
  completedEarly: number;
  completedOnTime: number;
  completedLate: number;
  averageDaysEarly: number;
  averageDaysLate: number;
  onTimePercentage: number;
}

interface TaskPerformanceMetricsProps {
  projectId?: string;
  teamId?: string;
  userId?: string;
  title?: string;
}

export default function TaskPerformanceMetrics({ 
  projectId, 
  teamId, 
  userId,
  title = "Task Completion Performance"
}: TaskPerformanceMetricsProps) {
  const [stats, setStats] = useState<TaskStats>({
    totalCompleted: 0,
    completedEarly: 0,
    completedOnTime: 0,
    completedLate: 0,
    averageDaysEarly: 0,
    averageDaysLate: 0,
    onTimePercentage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [projectId, teamId, userId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (teamId) params.append('teamId', teamId);
      if (userId) params.append('userId', userId);
      
      const response = await fetch(`/api/tasks/performance-stats?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching performance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (stats.totalCompleted === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">No completed tasks yet</p>
      </div>
    );
  }

  const earlyPercentage = (stats.completedEarly / stats.totalCompleted) * 100;
  const onTimePercentage = (stats.completedOnTime / stats.totalCompleted) * 100;
  const latePercentage = (stats.completedLate / stats.totalCompleted) * 100;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          onClick={fetchStats}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Total Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalCompleted}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Completed Early</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{stats.completedEarly}</p>
          <p className="text-xs text-green-600 mt-1">{earlyPercentage.toFixed(1)}%</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">On Time</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{stats.completedOnTime}</p>
          <p className="text-xs text-blue-600 mt-1">{onTimePercentage.toFixed(1)}%</p>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-700">Late</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{stats.completedLate}</p>
          <p className="text-xs text-red-600 mt-1">{latePercentage.toFixed(1)}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Completion Distribution</span>
          <span className="text-sm text-gray-600">
            {stats.onTimePercentage.toFixed(1)}% on-time or better
          </span>
        </div>
        <div className="flex h-4 rounded-full overflow-hidden bg-gray-200">
          <div
            className="bg-green-500"
            style={{ width: `${earlyPercentage}%` }}
            title={`Early: ${earlyPercentage.toFixed(1)}%`}
          />
          <div
            className="bg-blue-500"
            style={{ width: `${onTimePercentage}%` }}
            title={`On Time: ${onTimePercentage.toFixed(1)}%`}
          />
          <div
            className="bg-red-500"
            style={{ width: `${latePercentage}%` }}
            title={`Late: ${latePercentage.toFixed(1)}%`}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-600">
          <span>Early ({stats.completedEarly})</span>
          <span>On Time ({stats.completedOnTime})</span>
          <span>Late ({stats.completedLate})</span>
        </div>
      </div>

      {/* Average Days */}
      <div className="grid grid-cols-2 gap-4">
        {stats.averageDaysEarly > 0 && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm font-medium text-green-700 mb-1">Avg. Days Early</p>
            <p className="text-xl font-bold text-green-700">
              {stats.averageDaysEarly.toFixed(1)} days
            </p>
          </div>
        )}
        {stats.averageDaysLate > 0 && (
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm font-medium text-red-700 mb-1">Avg. Days Late</p>
            <p className="text-xl font-bold text-red-700">
              {stats.averageDaysLate.toFixed(1)} days
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
