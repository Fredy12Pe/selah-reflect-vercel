"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ResetBibleCachePage() {
  const [cacheCleared, setCacheCleared] = useState(false);
  const [cacheKeys, setCacheKeys] = useState<string[]>([]);
  const [errorCount, setErrorCount] = useState<number | null>(null);
  
  useEffect(() => {
    // Check for cached Bible verses
    if (typeof window !== 'undefined') {
      const prefix = 'bible_verse_cache_';
      const keys: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      
      setCacheKeys(keys);
      
      // Check error count
      try {
        const errorCount = localStorage.getItem('bible_api_error_count');
        if (errorCount) {
          setErrorCount(parseInt(errorCount, 10));
        }
      } catch (e) {}
    }
  }, []);
  
  const clearBibleCache = () => {
    const keysToRemove = [...cacheKeys];
    
    // Remove the keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Also reset error counter
    localStorage.setItem('bible_api_error_count', '0');
    setErrorCount(0);
    
    setCacheKeys([]);
    setCacheCleared(true);
  };
  
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Reset Bible Cache</h1>
          <p className="mb-4">
            This utility helps fix issues with Bible verse display by clearing cached verses
            and resetting the error counters.
          </p>
          
          <div className="p-4 bg-zinc-900 rounded-lg mb-6">
            {cacheKeys.length > 0 ? (
              <p>Found {cacheKeys.length} cached Bible verses</p>
            ) : (
              <p>No cached Bible verses found</p>
            )}
            
            {errorCount !== null && (
              <p className="mt-2">
                API error count: <span className={errorCount > 5 ? "text-red-400" : ""}>{errorCount}</span>
              </p>
            )}
          </div>
          
          {cacheCleared ? (
            <div className="p-4 bg-green-900/30 rounded-lg mb-6">
              <p className="font-medium">Cache successfully cleared!</p>
              <p className="mt-2">Bible verses will be fetched fresh on your next visit.</p>
            </div>
          ) : (
            <button 
              onClick={clearBibleCache}
              disabled={cacheKeys.length === 0 && errorCount === 0}
              className={`px-6 py-3 rounded-lg ${
                cacheKeys.length === 0 && errorCount === 0
                  ? "bg-zinc-700 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Clear Bible Cache
            </button>
          )}
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-medium mb-4">Common Issues & Solutions</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-zinc-900 rounded-lg">
              <h3 className="font-medium mb-2">Bible verses not loading</h3>
              <p className="text-white/80 mb-3">
                If Bible verses fail to load, this usually indicates an API connectivity issue
                or rate limiting. Clearing the cache may help resolve this.
              </p>
            </div>
            
            <div className="p-4 bg-zinc-900 rounded-lg">
              <h3 className="font-medium mb-2">ESV API key issues</h3>
              <p className="text-white/80 mb-3">
                Sometimes the ESV Bible API returns errors due to authentication issues.
                The app will automatically use the scripture text from the devotion as a fallback.
              </p>
              <Link href="/debug/esv-api-setup">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                  Configure ESV API Key
                </button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-zinc-800">
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Return to home page
          </Link>
        </div>
      </div>
    </div>
  );
} 