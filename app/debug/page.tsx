"use client";

import { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export default function DebugPage() {
  const [envVars, setEnvVars] = useState<Record<string, boolean>>({});
  const [appStatus, setAppStatus] = useState<string>('Not checked');
  const [authStatus, setAuthStatus] = useState<string>('Not initialized');
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check environment variables
    const vars = {
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    setEnvVars(vars);
    
    // Check app initialization
    try {
      const appsCount = getApps().length;
      setAppStatus(`Apps count: ${appsCount}`);
    } catch (e) {
      setAppStatus(`Error checking apps: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);
  
  const testAuth = async () => {
    try {
      setError(null);
      setAuthStatus('Initializing...');
      
      // Get config directly from env vars
      const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };
      
      // Log actual values (first few chars only for security)
      const maskedConfig = Object.entries(config).reduce((acc, [key, value]) => {
        acc[key] = value ? 
          (typeof value === 'string' && value.length > 5 ? 
            `${value.substring(0, 5)}...` : 
            '[present]') : 
          '[missing]';
        return acc;
      }, {} as Record<string, string>);
      
      setTestResults({
        ...testResults,
        config: maskedConfig
      });
      
      // Initialize Firebase directly
      let app;
      if (getApps().length === 0) {
        app = initializeApp(config);
        setTestResults({
          ...testResults,
          appInitialized: true
        });
      } else {
        app = getApps()[0];
        setTestResults({
          ...testResults,
          existingAppUsed: true
        });
      }
      
      // Initialize Auth
      const auth = getAuth(app);
      setAuthStatus('Auth initialized');
      setTestResults({
        ...testResults,
        authInitialized: true,
        authObject: {
          name: auth.name,
          currentUser: auth.currentUser ? 'Present' : 'None'
        }
      });
      
    } catch (e) {
      setAuthStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  
  const testSignIn = async () => {
    try {
      setError(null);
      setAuthStatus('Attempting sign in...');
      
      // Get existing app or initialize
      let app;
      if (getApps().length === 0) {
        const config = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };
        app = initializeApp(config);
      } else {
        app = getApps()[0];
      }
      
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      setTestResults({
        ...testResults,
        signInAttempt: true
      });
      
      const result = await signInWithPopup(auth, provider);
      
      setAuthStatus('Sign in successful');
      setTestResults({
        ...testResults,
        signInSuccess: true,
        user: {
          uid: result.user.uid,
          email: result.user.email ? `${result.user.email.substring(0, 3)}...` : null,
          displayName: result.user.displayName ? `${result.user.displayName.substring(0, 3)}...` : null
        }
      });
      
      // Test token
      const token = await result.user.getIdToken();
      setTestResults({
        ...testResults,
        tokenSuccess: true,
        tokenLength: token.length
      });
      
    } catch (e) {
      setAuthStatus(`Sign in error: ${e instanceof Error ? e.message : String(e)}`);
      setError(e instanceof Error ? e.message : String(e));
      setTestResults({
        ...testResults,
        signInError: e instanceof Error ? e.message : String(e)
      });
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Firebase Debug Page</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
        <pre className="bg-black text-green-400 p-4 rounded overflow-auto">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Firebase App Status</h2>
        <p className="mb-2">{appStatus}</p>
        <button 
          onClick={testAuth}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
        >
          Test Firebase Auth
        </button>
        <button 
          onClick={testSignIn}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Test Sign In
        </button>
      </div>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Auth Status</h2>
        <p className={`mb-2 ${authStatus.includes('Error') ? 'text-red-500' : ''}`}>
          {authStatus}
        </p>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Test Results</h2>
        <pre className="bg-black text-green-400 p-4 rounded overflow-auto">
          {JSON.stringify(testResults, null, 2)}
        </pre>
      </div>
    </div>
  );
} 