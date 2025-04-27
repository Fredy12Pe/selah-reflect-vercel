"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import {
  getFirebaseAuth,
  getGoogleAuthProvider,
} from "@/lib/firebase/firebase";
import { useAuth } from "@/lib/context/AuthContext";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const from = searchParams?.get("from") || "/";

  // Static loading state that shows immediately while JavaScript loads
  useEffect(() => {
    // Mark as initialized once JavaScript is running
    setInitialized(true);

    // Apply Firebase patches to ensure they're available
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
      console.log("[Login] Applied Firebase patches in login page");
    }

    // If user is already authenticated, redirect
    if (user) {
      router.push(from !== "/auth/login" ? from : "/");
    }
  }, [from, router, user]);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      const auth = getFirebaseAuth();
      const provider = getGoogleAuthProvider();

      if (!auth || !provider) {
        throw new Error("Authentication services are not available");
      }

      await signInWithPopup(auth, provider);

      if (from) {
        router.push(from);
      } else {
        // We know this date has data from our import
        router.push("/devotion/2025-04-01");
      }
      router.refresh();
    } catch (error: any) {
      console.error("Sign in error:", error);
      setError(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  // Show static loading state before JavaScript initializes
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 bg-opacity-75 bg-[url('/images/background.jpg')] bg-cover bg-center">
        <div className="bg-black bg-opacity-50 p-8 rounded-lg shadow-xl max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">
            Welcome to Selah
          </h1>
          <div className="space-y-4">
            <div className="w-full flex items-center justify-center space-x-2 bg-white text-gray-800 px-4 py-2 rounded-lg">
              <div className="w-6 h-6 rounded-full border-2 border-gray-800 border-t-transparent animate-spin"></div>
              <span>Initializing application...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 bg-opacity-75 bg-[url('/images/background.jpg')] bg-cover bg-center">
      <div className="bg-black bg-opacity-50 p-8 rounded-lg shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">
          Welcome to Selah
        </h1>
        <div className="space-y-4">
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-white text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <img src="/google.svg" alt="Google" className="w-6 h-6" />
            <span>
              {loading ? "Setting up your session..." : "Sign in with Google"}
            </span>
          </button>
          {error && (
            <div className="text-red-500 text-center text-sm mt-2">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
