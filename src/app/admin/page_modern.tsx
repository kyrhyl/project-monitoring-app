'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModernNavigation from '@/components/ui/ModernNavigation';
import { ModernCard, StatsCard, ActionButton } from '@/components/ui/ModernCards';

interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'team_leader' | 'member';
  teamId?: { _id: string; name: string };
  isActive: boolean;
  lastLogin?: string;
}

interface Team {
  _id: string;
  name: string;
  description: string;
  teamLeaderId?: { _id: string; username: string; firstName: string; lastName: string };
  members: User[];
  isActive: boolean;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'users' | 'teams'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchTeams();
    }
  }, [activeTab]);

  const checkAuth = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    
    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setCurrentUser(user);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      const data = await response.json();
      if (data.success) {
        setTeams(data.data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    router.push('/login');
  };

  const tabs = [
    {
      id: 'users',
      label: 'Users',
      count: users.length,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      )
    },
    {
      id: 'teams',
      label: 'Teams', 
      count: teams.length,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <ModernNavigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        userInfo={{
          name: `${currentUser?.firstName} ${currentUser?.lastName}`,
          role: currentUser?.role || 'admin'
        }}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Users"
            value={users.length}
            color="chocolate"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Active Teams"
            value={teams.filter(t => t.isActive).length}
            color="emerald"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Team Leaders"
            value={users.filter(u => u.role === 'team_leader').length}
            color="gray"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Members"
            value={users.filter(u => u.role === 'member').length}
            color="black"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
        </div>

        {/* Main Content */}
        <ModernCard>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === 'users' ? 'User Management' : 'Team Management'}
            </h2>
            <ActionButton
              onClick={() => activeTab === 'users' ? setShowUserForm(true) : setShowTeamForm(true)}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
              label={activeTab === 'users' ? 'Add User' : 'Add Team'}
            />
          </div>

          {activeTab === 'users' ? <UsersTable users={users} /> : <TeamsTable teams={teams} />}
        </ModernCard>
      </main>
    </div>
  );
}

// Users Table Component
function UsersTable({ users }: { users: User[] }) {
  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      team_leader: 'bg-blue-100 text-blue-800 border-blue-200',
      member: 'bg-green-100 text-green-800 border-green-200'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[role as keyof typeof styles]}`}>
        {role.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
        isActive 
          ? 'bg-green-100 text-green-800 border-green-200' 
          : 'bg-gray-100 text-gray-800 border-gray-200'
      }`}>
        {isActive ? 'ACTIVE' : 'INACTIVE'}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Team</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user._id} className="hover:bg-gray-50/50 transition-colors duration-200">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">@{user.username}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{user.email}</div>
              </td>
              <td className="px-6 py-4">
                {getRoleBadge(user.role)}
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {user.teamId?.name || 'No Team'}
                </div>
              </td>
              <td className="px-6 py-4">
                {getStatusBadge(user.isActive)}
              </td>
              <td className="px-6 py-4 text-right space-x-2">
                <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                  Edit
                </button>
                <button className="text-red-600 hover:text-red-900 text-sm font-medium">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Teams Table Component
function TeamsTable({ teams }: { teams: Team[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teams.map((team) => (
        <ModernCard key={team._id} className="group">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{team.name}</h3>
              <p className="text-sm text-gray-600">{team.description}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              team.isActive 
                ? 'bg-green-100 text-green-800 border-green-200' 
                : 'bg-gray-100 text-gray-800 border-gray-200'
            }`}>
              {team.isActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          
          {team.teamLeaderId && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-xs font-medium text-blue-600 mb-1">TEAM LEADER</div>
              <div className="text-sm font-medium text-blue-900">
                {team.teamLeaderId.firstName} {team.teamLeaderId.lastName}
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-600 mb-2">
              MEMBERS ({team.members.length})
            </div>
            <div className="flex -space-x-2">
              {team.members.slice(0, 5).map((member, index) => (
                <div
                  key={member._id}
                  className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center border-2 border-white"
                  title={`${member.firstName} ${member.lastName}`}
                >
                  <span className="text-white text-xs font-semibold">
                    {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                  </span>
                </div>
              ))}
              {team.members.length > 5 && (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white">
                  <span className="text-gray-600 text-xs font-semibold">
                    +{team.members.length - 5}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <ActionButton
              onClick={() => {}}
              variant="secondary"
              size="sm"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
              label="Edit"
            />
            <ActionButton
              onClick={() => {}}
              variant="danger"
              size="sm"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
              label="Delete"
            />
          </div>
        </ModernCard>
      ))}
    </div>
  );
}