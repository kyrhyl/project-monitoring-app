'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('auth-token');
    if (token) {
      // If user is logged in, redirect to dashboard
      router.push('/dashboard');
    } else {
      // Show landing page with options
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gradient-to-r from-amber-900 to-yellow-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold bg-gradient-to-r from-black to-gray-800 bg-clip-text text-transparent mb-4">
          Project Monitor
        </h1>
        <p className="text-gray-600 mb-8">
          Comprehensive project management and transparency platform
        </p>

        <div className="space-y-4">
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-gradient-to-r from-amber-900 to-yellow-900 hover:from-amber-800 hover:to-yellow-800 text-white font-medium px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
          >
            Staff Login
          </button>
          
          <button
            onClick={() => router.push('/public-projects')}
            className="w-full bg-white hover:bg-gray-50 text-gray-800 font-medium px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-amber-300 transition-all flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Public Transparency Portal
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mt-6">
          Access public project information and transparency reports without logging in
        </p>
      </div>
    </div>
  );
}
