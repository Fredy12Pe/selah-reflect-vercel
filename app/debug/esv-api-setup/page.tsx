"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function EsvApiSetupPage() {
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'valid' | 'invalid' | 'missing'>('checking');
  const [apiKeyValue, setApiKeyValue] = useState<string | null>(null);
  
  useEffect(() => {
    // This runs only on client-side
    // Check if the API key exists and has a real value
    const apiKey = process.env.NEXT_PUBLIC_ESV_BIBLE_API_KEY;
    
    if (!apiKey) {
      setApiKeyStatus('missing');
    } else if (apiKey === 'YOUR_ESV_API_KEY') {
      setApiKeyStatus('invalid');
      setApiKeyValue('YOUR_ESV_API_KEY');
    } else {
      setApiKeyStatus('valid');
      // Only show first few chars for security
      setApiKeyValue(apiKey.substring(0, 5) + '...');
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">ESV Bible API Setup</h1>
          
          <p className="mb-6">
            This utility helps you configure your ESV Bible API key for Selah Reflect.
          </p>
          
          {/* API Key Status */}
          <div className={`p-4 rounded-lg mb-6 ${
            apiKeyStatus === 'valid' 
              ? 'bg-green-900/30' 
              : apiKeyStatus === 'checking'
                ? 'bg-yellow-900/30'
                : 'bg-red-900/30'
          }`}>
            <h2 className="font-medium mb-2">ESV API Key Status</h2>
            
            {apiKeyStatus === 'checking' && (
              <p>Checking API key status...</p>
            )}
            
            {apiKeyStatus === 'valid' && (
              <div>
                <p className="text-green-400">✅ Valid API key found: {apiKeyValue}</p>
                <p className="mt-2">Your Bible API integration should be working correctly.</p>
              </div>
            )}
            
            {apiKeyStatus === 'invalid' && (
              <div>
                <p className="text-red-400">❌ Invalid API key: {apiKeyValue}</p>
                <p className="mt-2">You need to replace this with a real ESV API key.</p>
              </div>
            )}
            
            {apiKeyStatus === 'missing' && (
              <div>
                <p className="text-red-400">❌ No ESV API key found</p>
                <p className="mt-2">You need to configure an ESV API key for Bible verses to load properly.</p>
              </div>
            )}
          </div>
          
          {/* Setup Instructions */}
          <div className="p-4 bg-zinc-900 rounded-lg mb-6">
            <h2 className="font-medium mb-3">Setup Instructions</h2>
            
            <ol className="list-decimal pl-5 space-y-3">
              <li>
                <p>Get an ESV API key:</p>
                <a 
                  href="https://api.esv.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 block ml-4 mt-1"
                >
                  Sign up at the ESV API website
                </a>
              </li>
              
              <li>
                <p>Create a new API key for your application</p>
              </li>
              
              <li>
                <p>Open your terminal and run:</p>
                <div className="bg-black border border-zinc-700 rounded p-2 font-mono text-sm mt-1">
                  node scripts/setup-bible-api.js
                </div>
              </li>
              
              <li>
                <p>Follow the prompts to enter your API key</p>
              </li>
              
              <li>
                <p>Restart your Next.js server if it's running</p>
              </li>
              
              <li>
                <p>Run tests to verify your API key is working:</p>
                <div className="bg-black border border-zinc-700 rounded p-2 font-mono text-sm mt-1">
                  node scripts/test-esv-api.js
                </div>
              </li>
            </ol>
          </div>
          
          {/* Manual Setup */}
          <div className="p-4 bg-zinc-900 rounded-lg">
            <h2 className="font-medium mb-3">Manual Setup</h2>
            
            <p className="mb-3">
              Alternatively, you can configure your API key manually by editing your .env.local file:
            </p>
            
            <div className="bg-black border border-zinc-700 rounded p-2 font-mono text-sm">
              NEXT_PUBLIC_ESV_BIBLE_API_KEY=your_actual_api_key
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-zinc-800">
          <div className="flex flex-col space-y-2">
            <Link href="/debug/test-bible-api" className="text-blue-400 hover:text-blue-300">
              Test Bible API Integration
            </Link>
            <Link href="/debug/reset-app" className="text-blue-400 hover:text-blue-300">
              Go to App Reset Tool
            </Link>
            <Link href="/" className="text-blue-400 hover:text-blue-300">
              Return to home page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 