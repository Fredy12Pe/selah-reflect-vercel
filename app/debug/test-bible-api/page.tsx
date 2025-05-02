"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getVerse } from '@/lib/bibleApi';

export default function TestBibleApiPage() {
  const [reference, setReference] = useState('John 3:16');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if API key exists
    const key = process.env.NEXT_PUBLIC_ESV_BIBLE_API_KEY;
    if (key) {
      setApiKey(key.substring(0, 5) + '...');
      setApiKeyValid(key !== 'YOUR_ESV_API_KEY' && key !== 'test_key_for_demo_purposes');
    } else {
      setApiKey(null);
      setApiKeyValid(false);
    }
  }, []);
  
  const testEsvApi = async () => {
    if (!reference) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Testing Bible API with reference:', reference);
      const result = await getVerse(reference);
      console.log('API result:', result);
      setResult(result);
    } catch (err: any) {
      console.error('Error testing Bible API:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Bible API Test</h1>
          
          <p className="mb-6">
            Use this utility to test the Bible API integration and diagnose issues.
          </p>
          
          {/* API Key Status */}
          <div className={`p-4 rounded-lg mb-6 ${
            apiKeyValid === true
              ? 'bg-green-900/30' 
              : apiKeyValid === false
                ? 'bg-red-900/30'
                : 'bg-yellow-900/30'
          }`}>
            <h2 className="font-medium mb-2">ESV API Key Status</h2>
            
            {apiKeyValid === null && (
              <p>Checking API key status...</p>
            )}
            
            {apiKeyValid === true && (
              <div>
                <p className="text-green-400">✅ API key configured: {apiKey}</p>
                <p className="mt-2">Your Bible API integration should be working correctly.</p>
              </div>
            )}
            
            {apiKeyValid === false && (
              <div>
                <p className="text-red-400">❌ {apiKey ? `Invalid API key: ${apiKey}` : 'No API key found'}</p>
                <p className="mt-2">You need to configure a valid ESV API key.</p>
                <Link href="/debug/esv-api-setup" className="text-blue-400 hover:text-blue-300 block mt-2">
                  Go to API key setup
                </Link>
              </div>
            )}
          </div>
          
          {/* Test Form */}
          <div className="p-4 bg-zinc-900 rounded-lg mb-6">
            <h2 className="font-medium mb-3">Test Bible API</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="reference" className="block mb-1">Bible Reference</label>
                <input
                  id="reference"
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-700 rounded text-white"
                  placeholder="e.g. John 3:16"
                />
              </div>
              
              <button
                onClick={testEsvApi}
                disabled={loading || !reference}
                className={`px-4 py-2 rounded-lg ${
                  loading || !reference
                    ? 'bg-zinc-700 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Testing...' : 'Test Bible API'}
              </button>
            </div>
          </div>
          
          {/* Test Results */}
          {result && (
            <div className="p-4 bg-zinc-900 rounded-lg mb-6">
              <h2 className="font-medium mb-3">Test Results</h2>
              
              <div className="space-y-3">
                <div>
                  <span className="text-white/70">Source:</span>{' '}
                  <span className={result.source === 'esv' ? 'text-green-400' : 'text-yellow-400'}>
                    {result.source || 'unknown'}
                  </span>
                </div>
                
                <div>
                  <span className="text-white/70">Reference:</span>{' '}
                  <span>{result.reference}</span>
                </div>
                
                <div>
                  <span className="text-white/70">Text:</span>{' '}
                  <div className="mt-1 p-3 bg-black rounded border border-zinc-800">
                    {result.text}
                  </div>
                </div>
                
                {result.verses && result.verses.length > 0 && (
                  <div>
                    <span className="text-white/70">Verses:</span>{' '}
                    <div className="mt-1 space-y-2">
                      {result.verses.map((verse: any, index: number) => (
                        <div key={index} className="p-2 bg-black rounded border border-zinc-800">
                          <span className="text-white/60 text-sm mr-2">{verse.verse}</span>
                          {verse.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {result.error && (
                  <div>
                    <span className="text-red-400">Error:</span>{' '}
                    <div className="mt-1 p-3 bg-black rounded border border-red-900/40">
                      {result.error}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-900/30 rounded-lg mb-6">
              <h2 className="font-medium mb-2">Error</h2>
              <p>{error}</p>
            </div>
          )}
        </div>
        
        <div className="mt-8 pt-4 border-t border-zinc-800">
          <div className="flex flex-col space-y-2">
            <Link href="/debug/esv-api-setup" className="text-blue-400 hover:text-blue-300">
              Configure ESV API Key
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