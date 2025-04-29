"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { signInWithGoogle } from "@/lib/firebase/authHelper";
import { AuthError } from "firebase/auth";
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

// Debug component to show auth-related information
function DebugPanel() {
  const [info, setInfo] = useState<Record<string, any>>({});
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Collect browser information
    const browserInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      platform: navigator.platform,
      windowSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      time: new Date().toISOString()
    };
    
    // Check for Firebase auth
    const firebaseInfo = {
      firebaseAvailable: !!(window as any).firebase,
      authPatched: !!(window as any)._registerComponent,
      popupFunctionsAvailable: typeof (window as any).openWindowPopup === 'function'
    };
    
    setInfo({
      browser: browserInfo,
      firebase: firebaseInfo
    });
  }, []);
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-green-400 p-4 rounded-lg text-xs font-mono z-50 max-w-md max-h-80 overflow-auto">
      <h4 className="font-bold mb-2">Debug Information</h4>
      <pre>{JSON.stringify(info, null, 2)}</pre>
      <div className="mt-2 flex justify-between border-t border-gray-700 pt-2">
        <button 
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(info, null, 2))
              .then(() => toast.success("Debug info copied"))
              .catch(() => toast.error("Failed to copy"));
          }}
          className="text-blue-400 hover:text-blue-300"
        >
          Copy
        </button>
        <button 
          onClick={() => {
            if (typeof window !== 'undefined') {
              (window as any)._registerComponent = (window as any)._registerComponent || 
                function(c: any) { return c; };
              (window as any)._getProvider = (window as any)._getProvider || 
                function() { return { getImmediate: () => ({}), get: () => ({}) }; };
              toast.success("Applied Firebase patches");
            }
          }}
          className="text-yellow-400 hover:text-yellow-300"
        >
          Apply Patches
        </button>
      </div>
    </div>
  );
}

export default function Authentication() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugVisible, setDebugVisible] = useState(false);
  const [titleClicks, setTitleClicks] = useState(0);

  // Title click handler to reveal debug panel
  const handleTitleClick = useCallback(() => {
    const newCount = titleClicks + 1;
    setTitleClicks(newCount);
    
    if (newCount >= 10) {
      setDebugVisible(!debugVisible);
      setTitleClicks(0);
      toast.success(debugVisible ? "Debug mode disabled" : "Debug mode enabled");
    }
  }, [titleClicks, debugVisible]);

  // Get the 'from' parameter from the URL if it exists
  const from = searchParams?.get("from") || "/devotion/today";

  const setSessionCookie = useCallback(async (token: string) => {
    try {
      if (!token || typeof token !== 'string' || token.trim() === '') {
        console.error("Authentication - Invalid token format:", typeof token, token ? "non-empty" : "empty");
        throw new Error('Invalid token format');
      }
      
      console.log("Authentication - Setting session cookie with token length:", token.length);
      
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: token }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Authentication - Session API error:", data.error);
        throw new Error(data.error || 'Failed to set session');
      }

      console.log("Authentication - Session cookie set successfully");
      return true;
    } catch (error) {
      console.error("Authentication - Error setting session cookie:", error);
      throw error;
    }
  }, []);

  const redirectAfterLogin = useCallback(() => {
    // If 'from' is a valid URL path, redirect there
    if (from && from !== "/auth/login") {
      router.push(from);
    } else {
      // Otherwise, redirect to today's devotion
      const today = format(new Date(), "yyyy-MM-dd");
      router.push(`/devotion/${today}`);
    }
  }, [router, from]);

  const handleSignIn = useCallback(async () => {
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

    try {
      setLoading(true);
      setError("");

      console.log("Authentication: Starting Google sign-in process");
      
      // Use the helper function to sign in with Google
      const result = await signInWithGoogle();
      
      if (!result.user) {
        console.error("Authentication: No user returned from sign-in");
        throw new Error("Authentication failed - no user returned");
      }
      
      // Get the token
      let token;
      try {
        const tokenResult = await result.user.getIdTokenResult(true);
        token = tokenResult.token;
      } catch (tokenError) {
        console.error("Authentication: Token retrieval failed:", tokenError);
        token = await result.user.getIdToken(true);
      }
      
      // Set the session cookie
      try {
        await setSessionCookie(token);
      } catch (sessionError) {
        console.error("Authentication: Session cookie error:", sessionError);
        
        // Development fallback
        if (process.env.NODE_ENV !== 'production') {
          console.log("Authentication: Using development fallback");
          redirectAfterLogin();
          return;
        }
        
        throw new Error("Failed to establish your session");
      }

      console.log("Successfully signed in");
      toast.success("Successfully signed in!");
      redirectAfterLogin();
    } catch (error) {
      console.error("Sign-in error:", error);
      
      // Enhanced error handling
      let errorMessage = "";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'code' in error) {
        errorMessage = handleAuthError(error as AuthError);
      } else {
        errorMessage = "Unknown authentication error";
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [redirectAfterLogin, setSessionCookie]);

  return (
    <div className="min-h-screen">
      {/* Background Layer */}
      <div className="fixed inset-0">
        <div className="absolute inset-0">
          <Image
            src="/images/devotion-bg.jpg"
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
            <h1 
              className="text-4xl font-bold mb-2 cursor-pointer"
              onClick={handleTitleClick}
            >
              Welcome to Selah
            </h1>
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
              {error.includes("popup") && (
                <p className="mt-2 text-sm">
                  Having trouble? Try{" "}
                  <button 
                    onClick={() => {
                      setError("");
                      handleSignIn();
                    }}
                    className="underline text-red-400 hover:text-red-300"
                  >
                    signing in again
                  </button>
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="group w-full bg-white/10 hover:bg-white/20 text-white py-4 px-6 rounded-2xl backdrop-blur-sm transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Sign in with Google"
            data-testid="google-signin-button"
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

      {/* Debug Panel (hidden by default) */}
      {debugVisible && <DebugPanel />}

      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
}
