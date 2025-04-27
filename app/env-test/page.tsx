"use client";

import { useState, useEffect } from "react";

export default function EnvTestPage() {
  const [envVars, setEnvVars] = useState<any>(null);
  const [windowObj, setWindowObj] = useState<boolean>(false);

  useEffect(() => {
    // Check if we're in browser environment
    setWindowObj(typeof window !== "undefined");

    // Get all environment variables starting with NEXT_PUBLIC
    const publicEnvVars: Record<string, string | undefined> = {};

    if (typeof process !== "undefined" && process.env) {
      Object.keys(process.env).forEach((key) => {
        if (key.startsWith("NEXT_PUBLIC_")) {
          // Only record if the env var exists, mask the actual values
          publicEnvVars[key] = process.env[key] ? "[EXISTS]" : "[MISSING]";
        }
      });
    }

    // Check specifically for Firebase env vars
    const firebaseEnvVars = {
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY
        ? "[EXISTS]"
        : "[MISSING]",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env
        .NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
        ? "[EXISTS]"
        : "[MISSING]",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env
        .NEXT_PUBLIC_FIREBASE_PROJECT_ID
        ? "[EXISTS]"
        : "[MISSING]",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env
        .NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        ? "[EXISTS]"
        : "[MISSING]",
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env
        .NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
        ? "[EXISTS]"
        : "[MISSING]",
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
        ? "[EXISTS]"
        : "[MISSING]",
    };

    setEnvVars({
      publicEnvVars,
      firebaseEnvVars,
    });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Browser Environment:</h2>
        <p className="mb-2">
          Window object: {windowObj ? "Available" : "Not available"}
        </p>
        <p className="mb-2">
          Document object:{" "}
          {typeof document !== "undefined" ? "Available" : "Not available"}
        </p>
      </div>

      {envVars ? (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">
              Firebase Environment Variables:
            </h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(envVars.firebaseEnvVars, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">
              All Public Environment Variables:
            </h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(envVars.publicEnvVars, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <p>Loading environment variables...</p>
      )}

      <div className="mt-6">
        <a
          href="/"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
