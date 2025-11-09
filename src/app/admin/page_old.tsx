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
    }
    
    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('user');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to deactivate this user?')) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          fetchUsers();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (confirm('Are you sure you want to delete this team?')) {
      try {
        const response = await fetch(`/api/teams/${teamId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          fetchTeams();
        }
      } catch (error) {
        console.error('Error deleting team:', error);
      }
    }
  };

  const UserForm = () => {
    const [formData, setFormData] = useState({
      username: editingUser?.username || '',
      email: editingUser?.email || '',
      firstName: editingUser?.firstName || '',
      lastName: editingUser?.lastName || '',
      password: '',
      role: editingUser?.role || 'member'
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const url = editingUser ? `/api/users/${editingUser._id}` : '/api/users';
        const method = editingUser ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await response.json();
        if (data.success) {
          fetchUsers();
          setShowUserForm(false);
          setEditingUser(null);
        }
      } catch (error) {
        console.error('Error saving user:', error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h2 className="text-xl font-bold mb-4">
            {editingUser ? 'Edit User' : 'Create New User'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editingUser ? 'New Password (leave empty to keep current)' : 'Password'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!editingUser}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="member">Member</option>
                <option value="team_leader">Team Leader</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                {editingUser ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUserForm(false);
                  setEditingUser(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const TeamForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      teamLeaderId: '',
      memberIds: [] as string[]
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const response = await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await response.json();
        if (data.success) {
          fetchTeams();
          setShowTeamForm(false);
          setFormData({ name: '', description: '', teamLeaderId: '', memberIds: [] });
        } else {
          alert(data.error || 'Failed to create team');
        }
      } catch (error) {
        console.error('Error creating team:', error);
        alert('Error creating team');
      }
    };

    const handleMemberToggle = (userId: string) => {
      setFormData(prev => ({
        ...prev,
        memberIds: prev.memberIds.includes(userId)
          ? prev.memberIds.filter(id => id !== userId)
          : [...prev.memberIds, userId]
      }));
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-96 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Create New Team</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team Leader (Optional)</label>
              <select
                value={formData.teamLeaderId}
                onChange={(e) => setFormData({ ...formData, teamLeaderId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a team leader</option>
                {users.filter(user => user.role !== 'admin').map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.firstName} {user.lastName} (@{user.username})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Members</label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                {users.filter(user => user.role !== 'admin' && user._id !== formData.teamLeaderId).map((user) => (
                  <div key={user._id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={user._id}
                      checked={formData.memberIds.includes(user._id)}
                      onChange={() => handleMemberToggle(user._id)}
                      className="mr-2"
                    />
                    <label htmlFor={user._id} className="text-sm">
                      {user.firstName} {user.lastName} (@{user.username})
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Create Team
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTeamForm(false);
                  setFormData({ name: '', description: '', teamLeaderId: '', memberIds: [] });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'team_leader': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-700"
              >
                View Projects
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'teams'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Teams ({teams.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">User Management</h2>
              <button
                onClick={() => setShowUserForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                + Add User
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.teamId?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setShowUserForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Team Management</h2>
              <button
                onClick={() => setShowTeamForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                + Add Team
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div key={team._id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-2">{team.name}</h3>
                  <p className="text-gray-600 mb-4">{team.description}</p>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Team Leader:</h4>
                    <p className="text-sm">
                      {team.teamLeaderId ? 
                        `${team.teamLeaderId.firstName} ${team.teamLeaderId.lastName}` : 
                        'No leader assigned'
                      }
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">
                      Members ({team.members.length}):
                    </h4>
                    <div className="text-sm text-gray-600">
                      {team.members.slice(0, 3).map((member, index) => (
                        <div key={member._id}>
                          {member.firstName} {member.lastName}
                        </div>
                      ))}
                      {team.members.length > 3 && (
                        <div className="text-gray-500">
                          +{team.members.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-900 text-sm">
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteTeam(team._id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showUserForm && <UserForm />}
      {showTeamForm && <TeamForm />}
    </div>
  );
}