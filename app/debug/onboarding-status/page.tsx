"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { useForceOnboardingMode } from '@/lib/hooks/useForceOnboardingMode';
import Link from 'next/link';

export default function OnboardingDebugPage() {
  const { user, loading: authLoading } = useAuth();
  const { hasCompletedOnboarding, loading: onboardingLoading, completeOnboarding, resetOnboarding } = useOnboarding(user);
  const { isForced, enableForcedMode, disableForcedMode } = useForceOnboardingMode();
  
  const [localStorageItems, setLocalStorageItems] = useState<{key: string, value: string}[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Refresh local storage display
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const items: {key: string, value: string}[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('onboarding')) {
          const value = localStorage.getItem(key) || '';
          items.push({ key, value });
        }
      }
      setLocalStorageItems(items);
    } catch (error) {
      console.error("Error reading localStorage:", error);
    }
  }, [refreshTrigger, user]);
  
  // Force refresh the data
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Reset onboarding manually for the current user
  const handleResetOnboarding = () => {
    if (!user) return;
    
    try {
      const userOnboardingKey = `selah_onboarding_completed_${user.uid}`;
      localStorage.setItem(userOnboardingKey, 'false');
      resetOnboarding();
      refreshData();
      alert('Onboarding status reset to false');
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      alert('Error: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  // Complete onboarding manually for the current user
  const handleCompleteOnboarding = () => {
    if (!user) return;
    
    try {
      const userOnboardingKey = `selah_onboarding_completed_${user.uid}`;
      localStorage.setItem(userOnboardingKey, 'true');
      completeOnboarding();
      refreshData();
      alert('Onboarding status set to completed (true)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Error: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  // Clear all onboarding data from localStorage
  const handleClearAllOnboardingData = () => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.includes('onboarding')) {
          localStorage.removeItem(key);
        }
      }
      refreshData();
      alert('All onboarding data cleared from localStorage');
    } catch (error) {
      console.error('Error clearing onboarding data:', error);
      alert('Error: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Onboarding Debug Panel</h1>
      
      <div className="bg-gray-100 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Status</h2>
        {authLoading ? (
          <p>Loading authentication status...</p>
        ) : user ? (
          <div>
            <p><strong>User ID:</strong> {user.uid}</p>
            <p><strong>Email:</strong> {user.email || 'No email'}</p>
            <p><strong>Anonymous:</strong> {user.isAnonymous ? 'Yes' : 'No'}</p>
          </div>
        ) : (
          <p>No user is logged in. <Link href="/auth/login" className="text-blue-500 underline">Log in</Link></p>
        )}
      </div>
      
      <div className="bg-gray-100 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Onboarding Status</h2>
        {onboardingLoading ? (
          <p>Loading onboarding status...</p>
        ) : (
          <>
            <p><strong>Has Completed Onboarding:</strong> {
              hasCompletedOnboarding === null 
                ? 'Unknown' 
                : hasCompletedOnboarding 
                  ? 'Yes' 
                  : 'No'
            }</p>
            <p><strong>Forced Onboarding Mode:</strong> {isForced ? 'Enabled' : 'Disabled'}</p>
          </>
        )}
      </div>
      
      <div className="bg-gray-100 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Local Storage Data</h2>
        {localStorageItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border">Key</th>
                  <th className="py-2 px-4 border">Value</th>
                </tr>
              </thead>
              <tbody>
                {localStorageItems.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border">{item.key}</td>
                    <td className="py-2 px-4 border">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No onboarding-related items in localStorage</p>
        )}
        <button 
          onClick={refreshData}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Refresh Data
        </button>
      </div>
      
      <div className="bg-gray-100 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Onboarding Controls</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={handleResetOnboarding}
            disabled={!user}
            className={`bg-yellow-500 text-white px-4 py-2 rounded ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Reset Onboarding Status (Set to False)
          </button>
          
          <button 
            onClick={handleCompleteOnboarding}
            disabled={!user}
            className={`bg-green-500 text-white px-4 py-2 rounded ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Complete Onboarding (Set to True)
          </button>
          
          <button 
            onClick={enableForcedMode}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            Enable Forced Onboarding Mode
          </button>
          
          <button 
            onClick={disableForcedMode}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Disable Forced Onboarding Mode
          </button>
          
          <button 
            onClick={handleClearAllOnboardingData}
            className="bg-red-500 text-white px-4 py-2 rounded col-span-full"
          >
            Clear ALL Onboarding Data
          </button>
          
          <button 
            onClick={() => {
              if (user) {
                // Use the exact key format for onboarding status
                const onboardingKey = `selah_onboarding_completed_${user.uid}`;
                localStorage.setItem(onboardingKey, 'false');
                
                // Log the change
                console.log("Force set onboarding to false:", {
                  key: onboardingKey,
                  value: 'false'
                });
                
                // Force redirect to onboarding
                window.location.href = '/onboarding';
              }
            }}
            disabled={!user}
            className={`bg-blue-600 text-white px-4 py-2 rounded col-span-full ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            FORCE GO TO ONBOARDING (Reset & Redirect)
          </button>
        </div>
      </div>
      
      <div className="bg-gray-100 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Navigation</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/onboarding" className="text-blue-500 hover:underline">Go to Onboarding Flow</Link>
          </li>
          <li>
            <Link href="/auth/login" className="text-blue-500 hover:underline">Go to Login Page</Link>
          </li>
          <li>
            <Link href="/debug" className="text-blue-500 hover:underline">Go to Debug Home</Link>
          </li>
          <li>
            <Link href="/" className="text-blue-500 hover:underline">Go to App Home</Link>
          </li>
        </ul>
      </div>
    </div>
  );
} 