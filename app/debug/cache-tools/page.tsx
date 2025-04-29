'use client';

import { useAuth } from '@/lib/context/AuthContext';
import UpdateCache from '@/app/components/UpdateCache';
import { Toaster, toast } from 'react-hot-toast';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CacheToolsPage() {
  const { user, loading } = useAuth();
  const [cacheStats, setCacheStats] = useState<{
    devotionCount: number;
    availableDates: number;
  }>({ devotionCount: 0, availableDates: 0 });

  useEffect(() => {
    // Get cache statistics
    const getStats = () => {
      try {
        let devotionCount = 0;
        let availableDates = 0;

        // Count devotion entries
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('devotion_')) {
            devotionCount++;
          }
        }

        // Check available dates
        try {
          const datesArray = JSON.parse(localStorage.getItem('availableDates') || '[]');
          availableDates = datesArray.length;
        } catch (e) {
          console.error('Error parsing available dates:', e);
        }

        setCacheStats({ devotionCount, availableDates });
      } catch (e) {
        console.error('Error getting cache stats:', e);
      }
    };

    getStats();
    
    // Set up interval to refresh stats every 2 seconds
    const interval = setInterval(getStats, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Function to clear all cache
  const clearAllCache = () => {
    if (confirm('Are you sure you want to clear all cached data? This will affect navigation.')) {
      try {
        // Clear devotion entries
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('devotion_') || key === 'availableDates')) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        toast.success(`Cleared ${keysToRemove.length} cache entries`);
      } catch (e) {
        console.error('Error clearing cache:', e);
        toast.error('Failed to clear cache');
      }
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
        <p className="mb-6">Please sign in to access this page.</p>
        <Link href="/auth/login" className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30">
          Sign In
        </Link>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <Toaster position="top-center" />
      
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Cache Tools</h1>
          <p className="text-white/60">
            Use these tools to manage and fix cache issues with date navigation.
          </p>
        </div>
        
        <div className="mb-8 bg-zinc-900/40 p-4 rounded-xl">
          <h2 className="text-xl font-semibold mb-2">Cache Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-800 p-4 rounded-lg">
              <p className="text-white/60 text-sm">Cached Devotions</p>
              <p className="text-2xl font-semibold">{cacheStats.devotionCount}</p>
            </div>
            <div className="bg-zinc-800 p-4 rounded-lg">
              <p className="text-white/60 text-sm">Available Dates</p>
              <p className="text-2xl font-semibold">{cacheStats.availableDates}</p>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <UpdateCache />
        </div>
        
        <div className="mb-8 bg-red-900/20 p-4 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Danger Zone</h2>
          <button
            onClick={clearAllCache}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Clear All Cache
          </button>
          <p className="mt-2 text-white/60 text-sm">
            This will remove all cached devotions and available dates.
          </p>
        </div>
        
        <div className="mt-10 pt-6 border-t border-white/10">
          <Link href="/" className="text-white/60 hover:text-white">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 