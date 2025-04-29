'use client';

import { useState, useEffect } from 'react';
import { getApp, getApps } from 'firebase/app';
import { getFirebaseDb } from '@/lib/firebase/firebase';

export default function FirebaseConfigDebugPage() {
  const [config, setConfig] = useState<any>(null);
  const [adminConfig, setAdminConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(true);

  // Check client-side Firebase config
  useEffect(() => {
    try {
      const apps = getApps();
      const isInitialized = apps.length > 0;
      
      let appConfig = null;
      if (isInitialized) {
        const app = getApp();
        appConfig = {
          name: app.name,
          options: {
            apiKey: app.options.apiKey ? '✓' : '✗',
            authDomain: app.options.authDomain ? '✓' : '✗',
            projectId: app.options.projectId ? '✓' : '✗',
            storageBucket: app.options.storageBucket ? '✓' : '✗',
            messagingSenderId: app.options.messagingSenderId ? '✓' : '✗',
            appId: app.options.appId ? '✓' : '✗',
          }
        };
      }
      
      // Check Firestore connection
      let dbStatus = 'Not checked';
      try {
        const db = getFirebaseDb();
        dbStatus = db ? 'Available' : 'Failed to get instance';
      } catch (dbError) {
        dbStatus = `Error: ${dbError instanceof Error ? dbError.message : String(dbError)}`;
      }
      
      setConfig({
        isInitialized,
        appCount: apps.length,
        appConfig,
        dbStatus
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Check server-side Firebase admin config
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/debug/firebase-admin');
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setAdminConfig(data);
      } catch (e) {
        setAdminError(e instanceof Error ? e.message : String(e));
      } finally {
        setAdminLoading(false);
      }
    };

    checkAdmin();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firebase Configuration Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Client Firebase Config */}
          <div className="bg-zinc-900 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Client-side Firebase</h2>
            
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="bg-red-900/30 p-4 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Initialized:</span>
                  <span className={config?.isInitialized ? 'text-green-400' : 'text-red-400'}>
                    {config?.isInitialized ? 'Yes' : 'No'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>App Count:</span>
                  <span>{config?.appCount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Firestore DB:</span>
                  <span>{config?.dbStatus}</span>
                </div>
                
                {config?.appConfig && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">App Config:</h3>
                    <div className="bg-black/30 p-4 rounded-lg">
                      {Object.entries(config.appConfig.options).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span>{key}:</span>
                          <span className={value === '✓' ? 'text-green-400' : 'text-red-400'}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Server Firebase Admin Config */}
          <div className="bg-zinc-900 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Server-side Firebase Admin</h2>
            
            {adminLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
              </div>
            ) : adminError ? (
              <div className="bg-red-900/30 p-4 rounded-lg">
                <p className="text-red-400">{adminError}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Node Environment:</span>
                  <span>{adminConfig?.environmentVariables?.nodeEnv}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Admin Initialized:</span>
                  <span className={adminConfig?.adminInitialized ? 'text-green-400' : 'text-red-400'}>
                    {adminConfig?.adminInitialized ? 'Yes' : 'No'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Apps Initialized:</span>
                  <span>{adminConfig?.environmentVariables?.appsInitialized}</span>
                </div>
                
                <h3 className="text-lg font-medium mb-2">Environment Variables:</h3>
                <div className="bg-black/30 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span>Project ID:</span>
                    <span className={adminConfig?.environmentVariables?.projectId ? 'text-green-400' : 'text-red-400'}>
                      {adminConfig?.environmentVariables?.projectId ? 'Available' : 'Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Client Email:</span>
                    <span className={adminConfig?.environmentVariables?.clientEmail ? 'text-green-400' : 'text-red-400'}>
                      {adminConfig?.environmentVariables?.clientEmail ? 'Available' : 'Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Private Key:</span>
                    <span className={adminConfig?.environmentVariables?.privateKey ? 'text-green-400' : 'text-red-400'}>
                      {adminConfig?.environmentVariables?.privateKey ? 'Available' : 'Missing'}
                    </span>
                  </div>
                  {adminConfig?.environmentVariables?.privateKey && (
                    <div className="flex justify-between">
                      <span>Key Length:</span>
                      <span>{adminConfig?.environmentVariables?.privateKeyLength}</span>
                    </div>
                  )}
                </div>
                
                {adminConfig?.initError && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-red-400 mb-2">Initialization Error:</h3>
                    <div className="bg-red-900/30 p-4 rounded-lg">
                      <p className="text-red-400 whitespace-pre-wrap break-words">{adminConfig.initError.message}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 