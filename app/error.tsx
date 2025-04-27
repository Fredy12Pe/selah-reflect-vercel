"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console
    console.error("Application error:", error);

    // Apply Firebase patches just in case
    if (typeof window !== "undefined") {
      window._isFirebaseServerApp =
        window._isFirebaseServerApp ||
        function () {
          return false;
        };
      window._registerComponent =
        window._registerComponent ||
        function (component) {
          return component;
        };
      window._getProvider =
        window._getProvider ||
        function () {
          return {
            getImmediate: function () {
              return {};
            },
            get: function () {
              return {};
            },
          };
        };
    }
  }, [error]);

  const isFirebaseError =
    error.message?.includes("Firebase") ||
    error.message?.includes("auth") ||
    error.message?.includes("firestore");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="max-w-md w-full bg-gray-900 p-8 rounded-lg shadow-xl">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>

        <div className="mb-6">
          <p className="text-red-400 mb-4">
            {isFirebaseError
              ? "We encountered an issue connecting to our services."
              : error.message || "An unexpected error occurred"}
          </p>

          {error.digest && (
            <p className="text-gray-400 text-sm mb-4">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col space-y-4">
          <button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
          >
            Try again
          </button>

          <Link
            href="/auth/login"
            className="text-center bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
          >
            Return to login
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
