"use client";

import { useState, useEffect } from 'react';

export default function SessionTestPage() {
  const [sessionStatus, setSessionStatus] = useState<string>('Checking...');
  const [error, setError] = useState<string | null>(null);
  const [cookiesPresent, setCookiesPresent] = useState<boolean | null>(null);
  
  // Helper function to check if cookies are enabled
  const areCookiesEnabled = () => {
    try {
      document.cookie = "testcookie=1; SameSite=Lax; path=/";
      const result = document.cookie.indexOf("testcookie=") !== -1;
      document.cookie = "testcookie=1; SameSite=Lax; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      return result;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    // Check if cookies are enabled at all
    const cookiesEnabled = areCookiesEnabled();
    setCookiesPresent(cookiesEnabled);
    
    if (!cookiesEnabled) {
      setSessionStatus('Cookies are disabled in your browser');
      return;
    }
    
    // Check session
    const checkSession = async () => {
      try {
        setSessionStatus('Checking session...');
        
        const response = await fetch('/api/auth/verify-session', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setSessionStatus('Session is valid! User is authenticated.');
          } else {
            setSessionStatus('Session check succeeded, but user is not authenticated');
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to verify session');
        }
      } catch (e) {
        setSessionStatus('Session verification failed');
        setError(e instanceof Error ? e.message : String(e));
        console.error('Session check error:', e);
      }
    };
    
    checkSession();
  }, []);
  
  const clearSession = () => {
    // Clear session cookie by setting an expired date
    document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax";
    setSessionStatus('Session cookie cleared. Refreshing...');
    
    // Reload the page after a brief delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };
  
  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Session Test Page</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Session Status</h2>
        <p className={`mb-4 ${sessionStatus.includes('valid') ? 'text-green-600 font-bold' : ''}`}>
          {sessionStatus}
        </p>
        
        <div className="mb-4">
          <p><strong>Cookies Enabled:</strong> {cookiesPresent === null ? 'Checking...' : (cookiesPresent ? 'Yes' : 'No')}</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        <div className="flex space-x-2">
          <button
            onClick={clearSession}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Clear Session
          </button>
          
          <a 
            href="/debug/simple-auth" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-block"
          >
            Try Sign In
          </a>
        </div>
      </div>
      
      <div className="space-y-2">
        <a href="/debug" className="text-blue-500 hover:underline block">Go to Debug Home</a>
        <a href="/auth/login" className="text-blue-500 hover:underline block">Go to Main Login Page</a>
        <a href="/" className="text-blue-500 hover:underline block">Go to App Home</a>
      </div>
    </div>
  );
} 