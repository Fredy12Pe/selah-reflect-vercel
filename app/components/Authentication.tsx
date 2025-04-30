"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { signInWithGoogle } from "@/lib/firebase/authHelper";
import { AuthError } from "firebase/auth";
import toast, { Toaster } from "react-hot-toast";
import { format } from "date-fns";
import { isBrowser } from "@/lib/utils/environment";
import { useAuth } from "@/lib/context/AuthContext";

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
  const { login, signup, loginAnonymously } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugVisible, setDebugVisible] = useState(false);
  const [titleClicks, setTitleClicks] = useState(0);
  const [isAnonymousLoading, setIsAnonymousLoading] = useState(false);

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

  // Handle anonymous sign-in (defined before handleSignIn to avoid circular dependency)
  const handleAnonymousSignIn = useCallback(async () => {
    if (!isBrowser) return;
    
    try {
      setIsAnonymousLoading(true);
      setError("");
      
      await loginAnonymously();
      console.log("Successfully signed in anonymously");
      
      // Don't show a toast for anonymous sign-in
      redirectAfterLogin();
    } catch (error) {
      console.error("Anonymous sign-in error:", error);
      let errorMessage = error instanceof Error ? error.message : "Failed to sign in anonymously";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAnonymousLoading(false);
    }
  }, [loginAnonymously, redirectAfterLogin]);

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
        
        // Custom handling for session establishment error
        const sessionErrorMsg = "Failed to establish your session";
        setError(sessionErrorMsg);
        
        // Show a special toast for this specific error
        toast.error(
          <div>
            <p className="font-medium">Session error</p>
            <p className="text-sm">Unable to establish your session</p>
          </div>
        );
        
        // Show guest mode suggestion immediately for this error
        toast(
          (t) => (
            <div className="flex items-start">
              <div className="flex-1">
                <p className="font-bold">Try guest mode!</p>
                <p className="text-sm opacity-90">Continue as a guest while we fix this issue</p>
              </div>
              <button 
                onClick={() => {
                  toast.dismiss(t.id);
                  handleAnonymousSignIn();
                }}
                className="ml-3 px-3 py-1 bg-white text-black text-sm font-medium rounded-full"
              >
                Guest Mode
              </button>
            </div>
          ),
          { duration: 15000 }
        );
        
        return; // Return early to prevent showing the success message
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
      
      // Show a suggestion to try guest login as a fallback
      setTimeout(() => {
        toast(
          (t) => (
            <div className="flex items-start">
              <div className="flex-1">
                <p className="font-medium">Having trouble signing in?</p>
                <p className="text-sm opacity-90">Try continuing as a guest for now and login later, thanks!</p>
              </div>
              <button 
                onClick={() => {
                  toast.dismiss(t.id);
                  handleAnonymousSignIn();
                }}
                className="ml-3 px-3 py-1 bg-white text-black text-sm font-medium rounded-full"
              >
                Try it
              </button>
            </div>
          ),
          { duration: 8000 }
        );
      }, 1000); // Show after a short delay so it appears after the error message
    } finally {
      setLoading(false);
    }
  }, [redirectAfterLogin, setSessionCookie, handleAnonymousSignIn]);

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
            style={{ objectFit: "cover" }}
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
      </div>

      {/* Content Layer */}
      <div className="flex flex-col items-center justify-center min-h-screen relative z-10 px-4">
        <Toaster position="top-center" />
        
        <div className="max-w-md w-full text-center mb-8">
          <h1 
            className="text-4xl font-bold text-white mb-2 cursor-pointer"
            onClick={handleTitleClick}
          >
            Welcome to Selah
          </h1>
          <p className="text-white/75 text-lg">Your daily moment of reflection</p>
          
          {error && (
            <div className="mt-4 p-3 bg-red-900/50 rounded-lg border border-red-700">
              <p className="text-red-300">{error}</p>
            </div>
          )}
        </div>

        <div className="max-w-md w-full space-y-4">
          <button
            onClick={handleSignIn}
            disabled={loading}
            className={`w-full flex items-center justify-center py-3 px-4 bg-white rounded-full text-black font-medium transition ${
              loading ? "opacity-70 cursor-not-allowed" : "hover:bg-white/90"
            }`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
            ) : (
              <>
                <Image
                  src="/images/google-logo.svg"
                  alt="Google"
                  width={20}
                  height={20}
                  className="mr-3"
                />
                Continue with Google
              </>
            )}
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black/30 text-white/70">Or</span>
            </div>
          </div>
          
          <button
            onClick={handleAnonymousSignIn}
            disabled={isAnonymousLoading}
            className={`w-full flex items-center justify-center py-3 px-4 border border-white/30 rounded-full text-white font-medium transition ${
              isAnonymousLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-white/10"
            }`}
          >
            {isAnonymousLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              "Continue as Guest"
            )}
          </button>
        </div>
        
        <div className="mt-8 text-white/60 text-sm text-center">
          <p>
            By continuing, you agree to our <a href="/terms" className="underline hover:text-white">Terms of Service</a> and{" "}
            <a href="/privacy" className="underline hover:text-white">Privacy Policy</a>
          </p>
        </div>
      </div>
      
      {debugVisible && <DebugPanel />}
    </div>
  );
}
