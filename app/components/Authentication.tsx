"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getFirebaseAuth, getGoogleAuthProvider } from "@/lib/firebase";
import { signInWithPopup, AuthError } from "firebase/auth";
import toast, { Toaster } from "react-hot-toast";
import { format } from "date-fns";
import { isBrowser } from "@/lib/utils/environment";

const SIGN_IN_COOLDOWN = 2000; // 2 seconds cooldown between sign-in attempts
let lastSignInAttempt = 0;

const handleAuthError = (error: AuthError) => {
  switch (error.code) {
    case "auth/popup-closed-by-user":
      return "Sign-in cancelled. Please try again.";
    case "auth/popup-blocked":
      return "Pop-up was blocked. Please allow pop-ups for this site.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return "An error occurred during sign-in. Please try again.";
  }
};

export default function Authentication() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setSessionCookie = async (token: string) => {
    try {
      const cookieValue = `__session=${token}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = cookieValue;
      console.log("Authentication - Setting session cookie:", cookieValue);

      // Verify the cookie was set
      const cookies = document.cookie.split(";");
      const sessionCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("__session=")
      );
      console.log("Authentication - Current cookies:", cookies);
      console.log("Authentication - Session cookie found:", sessionCookie);

      if (!sessionCookie) {
        throw new Error("Failed to set session cookie");
      }
    } catch (error) {
      console.error("Authentication - Error setting session cookie:", error);
      throw error;
    }
  };

  const redirectToDevotionPage = useCallback(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    router.push(`/devotion/${today}`);
  }, [router]);

  const signInWithGoogle = useCallback(async () => {
    // Ensure we're in browser environment
    if (!isBrowser) {
      console.log("Authentication skipped during build/SSR");
      return;
    }

    const now = Date.now();
    if (now - lastSignInAttempt < SIGN_IN_COOLDOWN) {
      toast.error("Please wait a moment before trying again");
      return;
    }
    lastSignInAttempt = now;

    const auth = getFirebaseAuth();
    const provider = getGoogleAuthProvider();

    if (!auth || !provider) {
      const error =
        "Authentication service is not available. Please try again later.";
      console.error("Firebase auth or provider is not initialized");
      setError(error);
      toast.error(error);
      return;
    }

    try {
      setLoading(true);
      setError("");

      // TypeScript assertion to inform TypeScript that these are not null
      // We've already checked above
      const result = await signInWithPopup(auth, provider);

      // Get the ID token and set the session cookie
      const token = await result.user.getIdToken(true);
      await setSessionCookie(token);

      console.log("Successfully signed in:", result.user.email);
      toast.success("Successfully signed in!");

      // Wait a moment for the cookie to be set
      setTimeout(() => {
        redirectToDevotionPage();
      }, 1000);
    } catch (error) {
      const authError = error as AuthError;
      console.error("Sign-in error:", authError);
      toast.error(authError.message);
    } finally {
      setLoading(false);
    }
  }, [router, redirectToDevotionPage]);

  return (
    <div className="min-h-screen">
      {/* Background Layer */}
      <div className="fixed inset-0">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000"
            alt="Mountain Background"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", zIndex: -1 }}
          />
        </div>
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/90"
          style={{ zIndex: 0 }}
        />
      </div>

      {/* Content Layer */}
      <main
        className="relative min-h-screen flex flex-col items-center justify-center p-6 text-white"
        style={{ zIndex: 1 }}
        role="main"
        aria-label="Authentication page"
      >
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Welcome to Selah</h1>
            <p className="text-lg text-gray-300">
              Your daily moment of reflection
            </p>
          </div>

          {error && (
            <div
              className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="group w-full bg-white/10 hover:bg-white/20 text-white py-4 px-6 rounded-2xl backdrop-blur-sm transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Sign in with Google"
          >
            <svg
              className={`w-6 h-6 ${loading ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="relative">
              {loading ? (
                <span className="inline-flex items-center">
                  <span className="animate-pulse">Signing in</span>
                  <span className="ml-1 animate-bounce delay-100">.</span>
                  <span className="ml-0.5 animate-bounce delay-200">.</span>
                  <span className="ml-0.5 animate-bounce delay-300">.</span>
                </span>
              ) : (
                "Continue with Google"
              )}
            </span>
          </button>

          <p className="text-center text-sm text-gray-400 mt-8">
            By continuing, you agree to our{" "}
            <a
              href="/terms"
              className="underline hover:text-white transition-colors"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="underline hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </main>
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
}
