'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  tabs: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }>;
  userInfo?: {
    name: string;
    role: string;
  };
}

export default function ModernNavigation({ activeTab, setActiveTab, tabs, userInfo }: NavigationProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('user');
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    router.push('/login');
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-900 to-yellow-900 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
                Project Monitor
              </h1>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-200 relative
                  ${activeTab === tab.id
                    ? 'bg-amber-50 text-amber-900 shadow-sm'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`
                    ml-2 px-2 py-1 text-xs rounded-full font-semibold
                    ${activeTab === tab.id
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-amber-900 rounded-full"></div>
                )}
              </button>
            ))}
          </nav>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-amber-900 to-yellow-900 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {userInfo?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-black">{userInfo?.name || 'Admin'}</div>
                <div className="text-xs text-gray-500 capitalize">{userInfo?.role || 'Administrator'}</div>
              </div>
              <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200/50">
                  <div className="text-sm font-medium text-black">{userInfo?.name || 'Administrator'}</div>
                  <div className="text-xs text-gray-500 capitalize">{userInfo?.role || 'admin'}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900 transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}