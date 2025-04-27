"use client";

import { useState, useEffect } from "react";
// Remove the firebaseConfig import which isn't exported
// import { firebaseConfig } from "@/lib/firebase";

export default function FirebaseTestPage() {
  const [status, setStatus] = useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    // Test function to debug Firebase
    async function testFirebase() {
      try {
        setStatus("Testing environment...");

        // Log environment
        const envInfo = {
          nextPublicVars: {
            apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId:
              !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          },
          window: typeof window !== "undefined",
          document: typeof document !== "undefined",
        };

        setDebugInfo((prev: Record<string, any>) => ({
          ...prev,
          environment: envInfo,
        }));

        // Check global patched functions
        const globalPatchInfo = {
          hasIsFirebaseServerApp:
            typeof window !== "undefined" && !!window._isFirebaseServerApp,
          hasRegisterComponent:
            typeof window !== "undefined" && !!window._registerComponent,
          hasGetProvider:
            typeof window !== "undefined" && !!window._getProvider,
        };

        setDebugInfo((prev: Record<string, any>) => ({
          ...prev,
          globalPatch: globalPatchInfo,
        }));

        // Now try to dynamically import Firebase
        setStatus("Importing Firebase...");

        const firebase = await import("@/lib/firebase");
        setDebugInfo((prev: Record<string, any>) => ({
          ...prev,
          imports: {
            app: !!firebase.app,
            auth: !!firebase.auth,
            db: !!firebase.db,
            storage: !!firebase.storage,
          },
        }));

        setStatus("Firebase imported successfully");

        // If we got here, Firebase was imported successfully
        if (firebase.app) {
          setStatus("Firebase initialized successfully");
        } else {
          setStatus("Firebase import succeeded but app is undefined");
          setError("Firebase app is undefined");
        }
      } catch (e: any) {
        console.error("Firebase test error:", e);
        setError(`Error: ${e.message || "Unknown error"}`);
        setStatus("Failed to initialize Firebase");

        // Log stack trace
        setDebugInfo((prev: Record<string, any>) => ({
          ...prev,
          error: { message: e.message, stack: e.stack },
        }));
      }
    }

    testFirebase();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6">Firebase Test Page</h1>

        <div className="mb-8 p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-2">Status:</h2>
          <p
            className={`mb-3 font-mono ${
              status.includes("Failed") ? "text-red-500" : "text-green-500"
            }`}
          >
            {status}
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-md">
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                Error:
              </h3>
              <p className="text-red-700 dark:text-red-300 font-mono text-sm whitespace-pre-wrap">
                {error}
              </p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Debugging Information:</h2>

          {Object.keys(debugInfo).map((section) => (
            <div key={section} className="mb-6 p-4 border rounded-md">
              <h3 className="text-lg font-medium mb-2 capitalize">
                {section}:
              </h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(debugInfo[section], null, 2)}
              </pre>
            </div>
          ))}
        </div>

        <div className="mt-6 flex space-x-4">
          <a
            href="/"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
