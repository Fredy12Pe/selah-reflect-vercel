"use client";

import { useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export default function SimpleAuthPage() {
  const [status, setStatus] = useState('Not signed in');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const signIn = async () => {
    setStatus('Signing in...');
    setError(null);
    
    try {
      // Basic Firebase config
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };
      
      // Initialize Firebase
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      const auth = getAuth(app);
      
      // Create provider
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // Sign in
      setStatus('Opening popup...');
      const result = await signInWithPopup(auth, provider);
      
      // Got user
      setStatus('Signed in successfully');
      setUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
      });
      
      // Try to get token
      setStatus('Getting token...');
      const token = await result.user.getIdToken();
      
      // Try to set session cookie
      setStatus('Setting session cookie...');
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: token }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus('Session cookie set successfully!');
      } else {
        throw new Error(data.error || 'Failed to set session cookie');
      }
      
    } catch (e) {
      setStatus('Error signing in');
      setError(e instanceof Error ? e.message : String(e));
      console.error('Sign in error:', e);
    }
  };
  
  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Simple Auth Test</h1>
      
      <div className="mb-6">
        <p className="mb-2"><strong>Status:</strong> {status}</p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        <button
          onClick={signIn}
          disabled={status === 'Signing in...' || status === 'Opening popup...'}
          className="bg-blue-500 text-white px-6 py-3 rounded font-medium hover:bg-blue-600 disabled:opacity-50"
        >
          Sign in with Google
        </button>
      </div>
      
      {user && (
        <div className="p-4 bg-green-100 border border-green-400 rounded">
          <h2 className="text-xl font-semibold mb-2">User Info</h2>
          <p><strong>UID:</strong> {user.uid}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Name:</strong> {user.displayName || 'Not provided'}</p>
          <p className="mt-4">
            <a 
              href="/debug" 
              className="text-blue-500 hover:underline"
            >
              Go to advanced debug page
            </a>
          </p>
        </div>
      )}
    </div>
  );
} 