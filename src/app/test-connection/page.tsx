'use client';

import { useState } from 'react';

export default function TestConnection() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          MongoDB Atlas Connection Test
        </h1>
        
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          {loading ? 'Testing Connection...' : 'Test MongoDB Atlas Connection'}
        </button>

        {result && (
          <div className="border rounded-lg p-4">
            <div className={`mb-2 font-semibold ${
              result.success ? 'text-green-600' : 'text-red-600'
            }`}>
              {result.success ? '✅ SUCCESS' : '❌ FAILED'}
            </div>
            
            <div className="mb-4">
              <strong>Message:</strong> {result.message}
            </div>

            {result.data && (
              <div className="mb-4">
                <strong>Connection Details:</strong>
                <pre className="bg-gray-100 p-3 rounded mt-2 text-sm overflow-auto">
{JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}

            {result.error && (
              <div className="mb-4">
                <strong>Error:</strong> 
                <pre className="bg-red-50 p-3 rounded mt-2 text-sm text-red-700 overflow-auto">
{JSON.stringify(result.error, null, 2)}
                </pre>
              </div>
            )}

            {result.details && (
              <div>
                <strong>Error Details:</strong>
                <pre className="bg-red-50 p-3 rounded mt-2 text-sm text-red-700 overflow-auto">
{JSON.stringify(result.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <p><strong>MongoDB URI:</strong> {process.env.NEXT_PUBLIC_MONGODB_URI_HINT || 'Configured in .env.local'}</p>
          <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
        </div>
      </div>
    </div>
  );
}