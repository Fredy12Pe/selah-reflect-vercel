"use client";

import { useState, useEffect } from 'react';
import { getFirebaseDb, getFirebaseAuth } from '@/lib/firebase/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export default function FirebaseStatusPage() {
  const [firebaseStatus, setFirebaseStatus] = useState<{
    dbInitialized: boolean;
    authInitialized: boolean;
    user: string | null;
    collections: string[];
    testCollection: string;
    testDocuments: number;
  }>({
    dbInitialized: false,
    authInitialized: false,
    user: null,
    collections: [],
    testCollection: '',
    testDocuments: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function checkFirebaseStatus() {
      try {
        setLoading(true);
        setError(null);
        
        // Check Firebase DB
        const db = getFirebaseDb();
        const dbInitialized = !!db;
        
        // Check Firebase Auth
        const auth = getFirebaseAuth();
        const authInitialized = !!auth;
        const user = auth?.currentUser ? auth.currentUser.email || auth.currentUser.uid : null;
        
        // Initialize status object
        const status = {
          dbInitialized,
          authInitialized,
          user,
          collections: [],
          testCollection: '',
          testDocuments: 0
        };
        
        // Update status first before attempting collection access
        setFirebaseStatus(status);
        
        // Try to access collections if DB is initialized
        if (dbInitialized && db) {
          try {
            // Test the "devotions" collection
            const devotionsQuery = query(collection(db, 'devotions'), limit(5));
            const devotionsSnapshot = await getDocs(devotionsQuery);
            status.testCollection = 'devotions';
            status.testDocuments = devotionsSnapshot.size;
            
            // Get a list of available collections (this will depend on Firebase rules)
            // This won't work in most configurations due to security rules
            /*
            const collections = await db.listCollections();
            status.collections = collections.map(col => col.id);
            */
            
            // Just add the known collections
            status.collections = ['devotions', 'hymns', 'users', 'meta'] as string[];
          } catch (collectionError) {
            console.error('Error accessing collections:', collectionError);
            setError('Firebase initialized but collection access failed. You may need to sign in or check permission rules.');
          }
        }
        
        setFirebaseStatus(status);
      } catch (err) {
        console.error('Error checking Firebase status:', err);
        setError(err instanceof Error ? err.message : 'Unknown error checking Firebase status');
      } finally {
        setLoading(false);
      }
    }
    
    checkFirebaseStatus();
  }, []);
  
  const handleSignIn = async () => {
    try {
      setError(null);
      const auth = getFirebaseAuth();
      
      if (!auth) {
        setError('Firebase auth not initialized');
        return;
      }
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      setFirebaseStatus(prev => ({
        ...prev,
        user: result.user?.email || result.user?.uid || 'Unknown'
      }));
      
      // Reload the page to check if we can access collections after signing in
      window.location.reload();
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Unknown sign in error');
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Firebase Status Debug</h1>
      
      {loading ? (
        <div className="text-center p-4">Checking Firebase status...</div>
      ) : (
        <>
          <div className="mb-6 p-4 bg-gray-100 rounded">
            <h2 className="text-xl font-semibold mb-4">Firebase Status</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="font-medium mr-2">Database initialized:</span>
                <span className={firebaseStatus.dbInitialized ? "text-green-600" : "text-red-600"}>
                  {firebaseStatus.dbInitialized ? "✓" : "✗"}
                </span>
              </div>
              
              <div className="flex items-center">
                <span className="font-medium mr-2">Auth initialized:</span>
                <span className={firebaseStatus.authInitialized ? "text-green-600" : "text-red-600"}>
                  {firebaseStatus.authInitialized ? "✓" : "✗"}
                </span>
              </div>
              
              <div className="flex items-center">
                <span className="font-medium mr-2">Current user:</span>
                {firebaseStatus.user ? (
                  <span className="text-green-600">{firebaseStatus.user}</span>
                ) : (
                  <span className="text-red-600">Not signed in</span>
                )}
                
                {!firebaseStatus.user && (
                  <button
                    onClick={handleSignIn}
                    className="ml-4 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Sign In
                  </button>
                )}
              </div>
              
              <div>
                <span className="font-medium">Available collections:</span>
                {firebaseStatus.collections.length > 0 ? (
                  <ul className="list-disc list-inside mt-2 pl-4">
                    {firebaseStatus.collections.map(col => (
                      <li key={col}>{col}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-red-600">No collections available or accessible</p>
                )}
              </div>
              
              {firebaseStatus.testCollection && (
                <div>
                  <span className="font-medium">Test collection ({firebaseStatus.testCollection}):</span>
                  <p className="mt-1">
                    Found {firebaseStatus.testDocuments} documents
                  </p>
                </div>
              )}
            </div>
            
            {error && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}
          </div>
          
          <div className="mb-6 p-4 bg-gray-100 rounded">
            <h2 className="text-xl font-semibold mb-4">Troubleshooting</h2>
            
            <h3 className="font-medium text-lg mb-2">Common Issues</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>
                <strong>Firebase not initialized:</strong> Check that your <code>.env.local</code> file has all the required Firebase config values
              </li>
              <li>
                <strong>Auth not working:</strong> Make sure Firebase authentication is enabled in your Firebase console
              </li>
              <li>
                <strong>Can't access collections:</strong> You might need to sign in first or check Firebase security rules
              </li>
              <li>
                <strong>Server configuration error:</strong> The server-side Firebase admin SDK might not be properly initialized
              </li>
            </ul>
            
            <h3 className="font-medium text-lg mb-2">Required Environment Variables</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>NEXT_PUBLIC_FIREBASE_API_KEY</li>
              <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
              <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
              <li>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</li>
              <li>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</li>
              <li>NEXT_PUBLIC_FIREBASE_APP_ID</li>
              <li>FIREBASE_CLIENT_EMAIL (for server)</li>
              <li>FIREBASE_PRIVATE_KEY (for server)</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
} 