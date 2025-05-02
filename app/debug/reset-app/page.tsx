"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ResetAppPage() {
  const [cacheCleared, setCacheCleared] = useState(false);
  const [bibleVerseCount, setBibleVerseCount] = useState(0);
  const [errorCount, setErrorCount] = useState<number | null>(null);
  const [storageUsage, setStorageUsage] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<boolean>(true);
  
  useEffect(() => {
    // Calculate localStorage usage and gather statistics
    if (typeof window !== 'undefined') {
      try {
        // Check online status
        setNetworkStatus(navigator.onLine);
        
        // Add event listeners for online/offline status
        const handleOnline = () => setNetworkStatus(true);
        const handleOffline = () => setNetworkStatus(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        // Count Bible verses in cache
        const prefix = 'bible_verse_cache_';
        let bibleVerseKeys = 0;
        let totalSize = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key) || '';
            totalSize += key.length + value.length;
            
            if (key.startsWith(prefix)) {
              bibleVerseKeys++;
            }
          }
        }
        
        setBibleVerseCount(bibleVerseKeys);
        
        // Calculate storage size in KB
        const sizeInKB = (totalSize * 2) / 1024; // × 2 for UTF-16 encoding
        setStorageUsage(sizeInKB.toFixed(2) + ' KB');
        
        // Check error count
        const errorCount = localStorage.getItem('bible_api_error_count');
        if (errorCount) {
          setErrorCount(parseInt(errorCount, 10));
        }
        
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      } catch (e) {
        console.error('Error accessing localStorage:', e);
      }
    }
  }, []);
  
  const clearAppCache = () => {
    if (typeof window !== 'undefined') {
      try {
        // Clear Bible verse cache
        const prefix = 'bible_verse_cache_';
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            keysToRemove.push(key);
          }
        }
        
        // Remove the keys
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
        
        // Reset error counters
        localStorage.setItem('bible_api_error_count', '0');
        
        // Update state
        setBibleVerseCount(0);
        setErrorCount(0);
        setCacheCleared(true);
        
        // Recalculate storage usage
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key) || '';
            totalSize += key.length + value.length;
          }
        }
        
        const sizeInKB = (totalSize * 2) / 1024;
        setStorageUsage(sizeInKB.toFixed(2) + ' KB');
      } catch (e) {
        console.error('Error clearing cache:', e);
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Reset App State</h1>
          
          <p className="mb-6">
            This utility helps fix issues by resetting various parts of the app state and clearing caches.
          </p>
          
          {/* Connection Status */}
          <div className={`p-4 rounded-lg mb-6 ${networkStatus ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
            <h2 className="font-medium mb-2">Network Status</h2>
            <p>
              You are currently <strong>{networkStatus ? 'online' : 'offline'}</strong>
            </p>
            {!networkStatus && (
              <p className="mt-2 text-red-300">
                You need an internet connection for Bible verses and devotions to load properly.
              </p>
            )}
          </div>
          
          {/* Storage Statistics */}
          <div className="p-4 bg-zinc-900 rounded-lg mb-6">
            <h2 className="font-medium mb-2">App Storage</h2>
            <ul className="space-y-2">
              <li>Bible verses in cache: {bibleVerseCount}</li>
              <li>API error count: <span className={errorCount && errorCount > 5 ? "text-red-400" : ""}>{errorCount || 0}</span></li>
              <li>Total localStorage usage: {storageUsage || "Calculating..."}</li>
            </ul>
          </div>
          
          {cacheCleared ? (
            <div className="p-4 bg-green-900/30 rounded-lg mb-6">
              <p className="font-medium">App cache successfully cleared!</p>
              <p className="mt-2">Bible verses will be fetched fresh on your next visit.</p>
            </div>
          ) : (
            <button 
              onClick={clearAppCache}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700"
            >
              Clear App Cache
            </button>
          )}
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-medium mb-4">Troubleshooting Tips</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-zinc-900 rounded-lg">
              <h3 className="font-medium mb-2">ESV Bible API Configuration</h3>
              <p className="text-white/80 mb-3">
                For Bible verses to load properly, you need a valid ESV Bible API key configured in your .env.local file.
                You can use the setup utility to configure your API key.
              </p>
              <Link href="/debug/esv-api-setup">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                  Configure ESV API Key
                </button>
              </Link>
            </div>
            
            <div className="p-4 bg-zinc-900 rounded-lg">
              <h3 className="font-medium mb-2">Firestore connection issues</h3>
              <p className="text-white/80 mb-3">
                If you see errors about Firestore connections, it could be due to network issues or browser
                privacy settings. Try using a different network or temporarily disable tracking protection.
              </p>
            </div>
            
            <div className="p-4 bg-zinc-900 rounded-lg">
              <h3 className="font-medium mb-2">Bible verses not loading</h3>
              <p className="text-white/80 mb-3">
                The app will use the scripture text from the devotion as a fallback when Bible API calls fail.
                If you continue to have issues, please ensure you have a stable internet connection.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-zinc-800">
          <div className="flex flex-col space-y-2">
            <Link href="/debug/test-bible-api" className="text-blue-400 hover:text-blue-300">
              Test Bible API Integration
            </Link>
            <Link href="/debug/esv-api-setup" className="text-blue-400 hover:text-blue-300">
              ESV API Key Setup
            </Link>
            <Link href="/debug/reset-bible-cache" className="text-blue-400 hover:text-blue-300">
              Go to Bible Cache Reset Tool
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