'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// List of required Firebase environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
];

export default function EnvCheckPage() {
  const [envStatus, setEnvStatus] = useState<{[key: string]: {exists: boolean, masked: string}}>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check for the existence of each required environment variable
    const status: {[key: string]: {exists: boolean, masked: string}} = {};
    
    requiredEnvVars.forEach(varName => {
      const value = process.env[varName] || '';
      const exists = !!value;
      let masked = '';
      
      if (exists) {
        // Mask the value for security (show first 4 and last 4 chars if long enough)
        if (value.length > 8) {
          masked = value.substring(0, 4) + '...' + value.substring(value.length - 4);
        } else {
          masked = '****';
        }
      }
      
      status[varName] = { exists, masked };
    });
    
    setEnvStatus(status);
    setLoading(false);
  }, []);

  // Calculate overall status
  const allPresent = Object.values(envStatus).every(status => status.exists);
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Environment Variables Check</h1>
      
      <div className="mb-6">
        <Link href="/debug/navigation" className="text-blue-600 hover:underline">
          ← Back to Debug Navigation
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className={`p-6 rounded-lg shadow ${allPresent ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h2 className="text-2xl font-semibold mb-4">
              {allPresent 
                ? '✅ All environment variables are set' 
                : '❌ Some environment variables are missing'}
            </h2>
            <p>
              {allPresent 
                ? 'Your Firebase configuration appears to be correctly set up.'
                : 'Your application is missing some required environment variables. Please check the details below.'}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variable Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value Preview
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requiredEnvVars.map((varName) => (
                  <tr key={varName}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {varName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {envStatus[varName]?.exists ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Set
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Missing
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {envStatus[varName]?.exists ? envStatus[varName]?.masked : 'Not set'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!allPresent && (
            <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Next Steps</h3>
              <p className="mb-4">
                Some environment variables are missing. Please follow our setup instructions:
              </p>
              <Link 
                href="/debug/env-instructions" 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block"
              >
                View Setup Instructions
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 