'use client';

import { useState, useEffect } from 'react';
import { IProject } from '@/models/Project';

interface DashboardStatsProps {
  projects: IProject[];
}

const DashboardStats = ({ projects }: DashboardStatsProps) => {
  const [stats, setStats] = useState({
    total: 0,
    onGoing: 0,
    approved: 0,
    averageProgress: 0
  });

  useEffect(() => {
    const total = projects.length;
    const onGoing = projects.filter(p => p.status === 'on-going').length;
    const approved = projects.filter(p => p.status === 'approved').length;
    const averageProgress = total > 0 
      ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / total)
      : 0;

    setStats({ total, onGoing, approved, averageProgress });
  }, [projects]);

  const StatCard = ({ title, value, icon, color }: { title: string; value: number | string; icon: string; color: string }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total Projects"
        value={stats.total}
        icon="📊"
        color="bg-blue-100"
      />
      <StatCard
        title="On Going"
        value={stats.onGoing}
        icon="⚡"
        color="bg-green-100"
      />
      <StatCard
        title="Approved"
        value={stats.approved}
        icon="✅"
        color="bg-purple-100"
      />
      <StatCard
        title="Avg Progress"
        value={`${stats.averageProgress}%`}
        icon="📈"
        color="bg-yellow-100"
      />
    </div>
  );
};

export default DashboardStats;