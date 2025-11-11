'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ModernNavigation from '@/components/ui/ModernNavigation';
import { ModernCard, StatsCard, ActionButton } from '@/components/ui/ModernCards';

interface User {
  _id: string;
  username: string;
  email?: string;
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
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    // Always fetch both users and teams on initial load since they're both needed
    fetchUsers();
    fetchTeams();
  }, []); // Empty dependency array for initial load only

  // Separate useEffect for tab changes (if needed for future functionality)
  useEffect(() => {
    // This can be used for tab-specific operations in the future
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
        console.log('Fetched users data:', data.data);
        console.log('First user teamId:', data.data[0]?.teamId);
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
        console.log('Fetched teams data:', data.data);
        console.log('First team members:', data.data[0]?.members);
        setTeams(data.data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (userData: {
    username: string;
    email?: string;
    password?: string;
    firstName: string;
    lastName: string;
    role: string;
    teamId?: string;
  }) => {
    try {
      const url = editingUser ? `/api/users/${editingUser._id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      // For updates, only send password if it's not empty
      const submitData: any = { ...userData };
      if (editingUser && !userData.password) {
        delete submitData.password;
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      
      const data = await response.json();
      
      console.log('Update response:', data);
      
      if (data.success) {
        console.log('Updated user data:', data.data);
        // Instead of updating local state, refresh the entire users list
        // to ensure we get properly populated team data
        await fetchUsers();
        setShowUserForm(false);
        setEditingUser(null);
      } else {
        alert(data.error || `Failed to ${editingUser ? 'update' : 'create'} user`);
      }
    } catch (error) {
      console.error('Error submitting user:', error);
      alert(`Failed to ${editingUser ? 'update' : 'create'} user`);
    }
  };

  const handleTeamSubmit = async (teamData: {
    name: string;
    description: string;
    teamLeaderId?: string;
    memberIds: string[];
  }) => {
    try {
      const url = editingTeam ? `/api/teams/${editingTeam._id}` : '/api/teams';
      const method = editingTeam ? 'PUT' : 'POST';
      
      console.log('Submitting team data:', teamData);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData),
      });
      
      const data = await response.json();
      
      console.log('Team update/create response:', data);
      
      if (data.success) {
        console.log('Updated/created team data:', data.data);
        if (editingTeam) {
          // Update existing team in the list
          setTeams(prev => prev.map(team => 
            team._id === editingTeam._id ? data.data : team
          ));
        } else {
          // Add new team to the list
          setTeams(prev => [data.data, ...prev]);
        }
        setShowTeamForm(false);
        setEditingTeam(null);
      } else {
        alert(data.error || `Failed to ${editingTeam ? 'update' : 'create'} team`);
      }
    } catch (error) {
      console.error('Error submitting team:', error);
      alert(`Failed to ${editingTeam ? 'update' : 'create'} team`);
    }
  };

  const syncTeamMembers = async () => {
    try {
      const response = await fetch('/api/sync-teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Teams synchronized successfully! Updated ${data.data.teamsUpdated} teams with ${data.data.usersProcessed} users.`);
        // Refresh the teams data to show updated members
        fetchTeams();
      } else {
        alert(`Failed to sync teams: ${data.error}`);
      }
    } catch (error) {
      console.error('Error syncing teams:', error);
      alert('Failed to sync teams');
    }
  };

  const handleTeamDelete = async (team: Team) => {
    // First, try to delete without force to check dependencies
    try {
      const response = await fetch(`/api/teams/${team._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Successful deletion
        alert(`Team "${data.details.teamName}" deleted successfully!\n\n` +
              `Users affected: ${data.details.usersAffected}\n` +
              `Projects affected: ${data.details.projectsAffected || 0}\n` +
              `Type: ${data.details.deletionType} delete (can be restored)`);
        
        // Refresh both teams and users data
        fetchTeams();
        fetchUsers();
        
      } else if (response.status === 409) {
        // Conflict - has dependencies, show warning dialog
        const confirmMessage = 
          `⚠️ TEAM DELETION WARNING ⚠️\n\n` +
          `Team: ${data.details.teamName}\n` +
          `Projects using this team: ${data.details.projectCount}\n` +
          `Users in this team: ${data.details.userCount}\n\n` +
          `${data.details.warning}\n\n` +
          `Do you want to proceed with force deletion?\n` +
          `This will:\n` +
          `• Remove team assignment from all users\n` +
          `• Set projects to "on-hold" status\n` +
          `• Mark team as deleted (can be restored)`;
        
        if (confirm(confirmMessage)) {
          // User confirmed, proceed with force deletion
          const forceResponse = await fetch(`/api/teams/${team._id}?force=true`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          });
          
          const forceData = await forceResponse.json();
          
          if (forceData.success) {
            alert(`Team "${forceData.details.teamName}" force deleted successfully!\n\n` +
                  `Users affected: ${forceData.details.usersAffected}\n` +
                  `Projects affected: ${forceData.details.projectsAffected}\n` +
                  `${forceData.warning || ''}`);
            
            // Refresh data
            fetchTeams();
            fetchUsers();
          } else {
            alert(`Failed to force delete team: ${forceData.error}`);
          }
        }
      } else {
        // Other error
        alert(`Failed to delete team: ${data.error}`);
      }
      
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team due to network error');
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
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
            <h2 className="text-2xl font-bold text-slate-900">
              {activeTab === 'users' ? 'User Management' : 'Team Management'}
            </h2>
            <div className="flex space-x-3">
              {activeTab === 'teams' && (
                <ActionButton
                  onClick={syncTeamMembers}
                  variant="secondary"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  }
                  label="Sync Teams"
                />
              )}
              {activeTab === 'users' && (
                <ActionButton
                  onClick={() => setShowBulkImport(true)}
                  variant="secondary"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  label="Bulk Import"
                />
              )}
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
          </div>

          {activeTab === 'users' ? (
            <UsersTable 
              users={users} 
              onEditUser={(user) => {
                setEditingUser(user);
                setShowUserForm(true);
              }}
              onDeleteUser={(user) => {
                // TODO: Implement delete functionality
                console.log('Delete user:', user);
              }}
            />
          ) : (
            <TeamsTable 
              teams={teams} 
              onEditTeam={(team) => {
                setEditingTeam(team);
                setShowTeamForm(true);
              }}
              onDeleteTeam={async (team) => {
                await handleTeamDelete(team);
              }}
            />
          )}
        </ModernCard>

        {/* User Creation Modal */}
        {showUserForm && (
          <UserFormModal 
            onClose={() => {
              setShowUserForm(false);
              setEditingUser(null);
            }}
            onSubmit={handleUserSubmit}
            editingUser={editingUser}
            teams={teams}
          />
        )}

        {showTeamForm && (
          <TeamFormModal 
            onClose={() => {
              setShowTeamForm(false);
              setEditingTeam(null);
            }}
            onSubmit={handleTeamSubmit}
            editingTeam={editingTeam}
            users={users}
          />
        )}

        {/* Bulk Import Modal */}
        {showBulkImport && (
          <BulkImportModal 
            onClose={() => setShowBulkImport(false)}
            onSuccess={() => {
              setShowBulkImport(false);
              fetchUsers(); // Refresh users after bulk import
            }}
          />
        )}
      </main>
    </div>
  );
}

// Users Table Component
function UsersTable({ 
  users, 
  onEditUser, 
  onDeleteUser 
}: { 
  users: User[]; 
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}) {
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
                <div className="text-sm text-gray-900">{user.email || 'No email provided'}</div>
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
                <Link
                  href={`/admin/users/${user._id}`}
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  View Details
                </Link>
                <button 
                  onClick={() => onEditUser(user)}
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDeleteUser(user)}
                  className="text-red-600 hover:text-red-900 text-sm font-medium"
                >
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
function TeamsTable({ 
  teams, 
  onEditTeam, 
  onDeleteTeam 
}: { 
  teams: Team[];
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (team: Team) => void;
}) {
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
            {team.members.length === 0 ? (
              <div className="text-sm text-gray-400 italic">No members assigned</div>
            ) : (
              <div className="space-y-2">
                {team.members.slice(0, 4).map((member, index) => (
                  <div
                    key={member._id || `member-${index}`}
                    className="flex items-center space-x-2"
                  >
                    <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">
                      {member.firstName} {member.lastName}
                    </span>
                  </div>
                ))}
                {team.members.length > 4 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-xs font-semibold">
                        +{team.members.length - 4}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 italic">
                      and {team.members.length - 4} more member{team.members.length - 4 > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <ActionButton
              onClick={() => onEditTeam(team)}
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
              onClick={() => onDeleteTeam(team)}
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

// User Form Modal Component
function UserFormModal({ 
  onClose, 
  onSubmit, 
  editingUser,
  teams
}: { 
  onClose: () => void; 
  onSubmit: (userData: any) => void; 
  editingUser: User | null;
  teams: Team[];
}) {
  const [formData, setFormData] = useState({
    username: editingUser?.username || '',
    email: editingUser?.email || '',
    password: '',
    firstName: editingUser?.firstName || '',
    lastName: editingUser?.lastName || '',
    role: editingUser?.role || 'member',
    teamId: editingUser?.teamId?._id || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean the form data before submitting
    const cleanedData: any = { ...formData };
    
    // Convert empty strings to undefined for optional fields
    if (cleanedData.email === '') {
      cleanedData.email = undefined;
    }
    if (cleanedData.teamId === '') {
      cleanedData.teamId = undefined;
    }
    
    onSubmit(cleanedData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingUser ? 'Edit User' : 'Add New User'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-gray-400 text-sm">(optional)</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={!editingUser}
              placeholder={editingUser ? "Leave blank to keep current password" : ""}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="member">Member</option>
              <option value="team_leader">Team Leader</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team <span className="text-gray-400 text-sm">(optional)</span>
            </label>
            <select
              name="teamId"
              value={formData.teamId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No Team</option>
              {teams.map(team => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TeamFormModal({ 
  onClose, 
  onSubmit, 
  editingTeam,
  users
}: { 
  onClose: () => void; 
  onSubmit: (teamData: any) => void; 
  editingTeam: Team | null;
  users: User[];
}) {
  const [formData, setFormData] = useState({
    name: editingTeam?.name || '',
    description: editingTeam?.description || '',
    teamLeaderId: editingTeam?.teamLeaderId?._id || '',
    memberIds: editingTeam?.members?.map((member: any) => member._id || member) || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean the form data before submitting
    const cleanedData: any = { ...formData };
    
    // Convert empty strings to undefined for optional fields
    if (cleanedData.teamLeaderId === '') {
      cleanedData.teamLeaderId = undefined;
    }
    
    onSubmit(cleanedData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleMemberChange = (userId: string, isChecked: boolean) => {
    setFormData(prev => ({
      ...prev,
      memberIds: isChecked 
        ? [...prev.memberIds, userId]
        : prev.memberIds.filter(id => id !== userId)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingTeam ? 'Edit Team' : 'Add New Team'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Leader <span className="text-gray-400 text-sm">(optional)</span>
            </label>
            <select
              name="teamLeaderId"
              value={formData.teamLeaderId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No Team Leader</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName} (@{user.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Members <span className="text-gray-400 text-sm">(select multiple)</span>
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50">
              {users.length === 0 ? (
                <p className="text-gray-500 text-sm">No users available</p>
              ) : (
                <div className="space-y-2">
                  {users.map(user => (
                    <label key={user._id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.memberIds.includes(user._id)}
                        onChange={(e) => handleMemberChange(user._id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="text-xs text-gray-500">
                          @{user.username}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {editingTeam ? 'Update Team' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Bulk Import Modal Component
function BulkImportModal({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [userData, setUserData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleBulkImport = async () => {
    if (!userData.trim()) {
      alert('Please paste user data to import');
      return;
    }

    setIsProcessing(true);
    setResults(null);

    try {
      // Parse the pasted data (expecting JSON format or CSV-like format)
      let users;
      
      // Try to parse as JSON first
      try {
        users = JSON.parse(userData);
      } catch {
        // If not JSON, try to parse as CSV-like format
        const lines = userData.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        users = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const user: any = {};
          headers.forEach((header, index) => {
            if (values[index]) {
              user[header.toLowerCase()] = values[index];
            }
          });
          return user;
        });
      }

      const response = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ users }),
      });

      const result = await response.json();
      setResults(result);

      if (result.summary?.successful > 0) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }

    } catch (error) {
      console.error('Bulk import error:', error);
      alert('Error processing bulk import. Please check the data format.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Bulk Import Users</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste User Data
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Paste JSON array or CSV data. For CSV format, first line should be headers: firstName,lastName,username,role,email,teamId
                <br />
                Example: firstName,lastName,username,role,email,teamId
                <br />
                John,Doe,john.doe,member,john@example.com,team1
              </p>
              <textarea
                value={userData}
                onChange={(e) => setUserData(e.target.value)}
                placeholder="Paste your user data here..."
                className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                disabled={isProcessing}
              />
            </div>

            {results && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Import Results</h4>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{results.summary?.total || 0}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{results.summary?.successful || 0}</div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{results.summary?.failed || 0}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>

                {results.results?.failed?.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium text-red-700 mb-2">Failed Imports:</h5>
                    <div className="max-h-32 overflow-y-auto">
                      {results.results.failed.map((fail: any, index: number) => (
                        <div key={index} className="text-sm text-red-600 mb-1">
                          {fail.userData.username || `User ${index + 1}`}: {fail.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isProcessing}
            >
              {results?.summary?.successful > 0 ? 'Close' : 'Cancel'}
            </button>
            <button
              onClick={handleBulkImport}
              disabled={isProcessing || !userData.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Import Users'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}