'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function EnvInstructionsPage() {
  const [activeTab, setActiveTab] = useState<'vercel' | 'local'>('vercel');
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/debug/navigation" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Debug Navigation
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Environment Setup Instructions</h1>
      
      <div className="flex mb-6">
        <button
          className={`px-4 py-2 ${activeTab === 'vercel' ? 'bg-blue-600 text-white' : 'bg-gray-200'} rounded-l-md`}
          onClick={() => setActiveTab('vercel')}
        >
          Vercel Setup
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'local' ? 'bg-blue-600 text-white' : 'bg-gray-200'} rounded-r-md`}
          onClick={() => setActiveTab('local')}
        >
          Local Development
        </button>
      </div>
      
      {activeTab === 'vercel' && (
        <div className="bg-white p-6 border rounded-md">
          <h2 className="text-2xl font-semibold mb-4">Setting up Environment Variables in Vercel</h2>
          
          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <p className="font-medium">Log in to your Vercel dashboard</p>
              <p className="text-gray-600">Go to <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://vercel.com/dashboard</a></p>
            </li>
            
            <li>
              <p className="font-medium">Select your project</p>
              <p className="text-gray-600">Click on the Selah Reflect project in your dashboard</p>
            </li>
            
            <li>
              <p className="font-medium">Go to Settings</p>
              <p className="text-gray-600">Click on the "Settings" tab in the top navigation</p>
            </li>
            
            <li>
              <p className="font-medium">Find Environment Variables</p>
              <p className="text-gray-600">Select "Environment Variables" from the left sidebar</p>
            </li>
            
            <li>
              <p className="font-medium">Add or edit variables</p>
              <p className="text-gray-600">Click "Add New" to add each required variable:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li><code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_FIREBASE_API_KEY</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_FIREBASE_PROJECT_ID</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_FIREBASE_APP_ID</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID</code></li>
              </ul>
            </li>
            
            <li>
              <p className="font-medium">Deploy your changes</p>
              <p className="text-gray-600">After setting variables, redeploy your application for the changes to take effect</p>
            </li>
          </ol>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-semibold text-lg mb-2">Finding Firebase Configuration</h3>
            <p>You can find your Firebase configuration values by:</p>
            <ol className="list-decimal pl-6 mt-2 space-y-1">
              <li>Going to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Firebase Console</a></li>
              <li>Selecting your project</li>
              <li>Clicking the gear icon (⚙️) next to "Project Overview"</li>
              <li>Selecting "Project settings"</li>
              <li>Scrolling down to "Your apps" section</li>
              <li>Find the web app and click the config button (</>) to view the configuration</li>
            </ol>
          </div>
        </div>
      )}
      
      {activeTab === 'local' && (
        <div className="bg-white p-6 border rounded-md">
          <h2 className="text-2xl font-semibold mb-4">Setting up Environment Variables for Local Development</h2>
          
          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <p className="font-medium">Create a .env.local file</p>
              <p className="text-gray-600">In the root of your project, create a file named <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code></p>
            </li>
            
            <li>
              <p className="font-medium">Add environment variables</p>
              <p className="text-gray-600">Add the following variables to your .env.local file:</p>
              <pre className="bg-gray-100 p-3 rounded-md mt-2 overflow-x-auto">
                <code>{`NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id`}</code>
              </pre>
            </li>
            
            <li>
              <p className="font-medium">Replace placeholder values</p>
              <p className="text-gray-600">Replace each <code className="bg-gray-100 px-2 py-1 rounded">your_*</code> value with the actual value from your Firebase project</p>
            </li>
            
            <li>
              <p className="font-medium">Restart your development server</p>
              <p className="text-gray-600">Run <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code> to restart with the new environment variables</p>
            </li>
          </ol>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="font-semibold text-lg mb-2">Security Notice</h3>
            <p>Important things to remember:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Never commit your <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> file to version control</li>
              <li>Ensure <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> is in your <code className="bg-gray-100 px-2 py-1 rounded">.gitignore</code> file</li>
              <li>Do not share your Firebase credentials publicly</li>
              <li>Set appropriate security rules in your Firebase project</li>
            </ul>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-semibold text-lg mb-2">Troubleshooting</h3>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Make sure there are no spaces around the equals sign in your .env.local file</li>
              <li>Do not use quotes around your values</li>
              <li>Check for typos in variable names</li>
              <li>If changes don't take effect, try stopping and restarting your development server</li>
              <li>Use the <Link href="/debug/env-check" className="text-blue-600 hover:underline">Environment Check</Link> page to verify your variables are loaded</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 