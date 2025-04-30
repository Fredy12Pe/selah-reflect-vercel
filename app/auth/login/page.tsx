"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import Authentication from "@/app/components/Authentication";
import { useOnboarding } from "@/lib/hooks/useOnboarding";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const { hasCompletedOnboarding, loading: onboardingLoading, resetOnboarding } = useOnboarding(user);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const from = searchParams?.get("from") || "/";

  // Expose a debug function to show the current state
  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  // If user is already authenticated, check onboarding status and redirect
  useEffect(() => {
    console.log("Login page: Effect running", { 
      user: user?.uid, 
      isNavigating, 
      loading, 
      onboardingLoading, 
      hasCompletedOnboarding
    });
    
    // Skip if already navigating or still loading
    if (isNavigating || loading || onboardingLoading || !user) return;
    
    console.log("Login page: User authenticated, checking onboarding status:", { 
      uid: user.uid, 
      onboardingStatus: hasCompletedOnboarding,
      isLoading: loading,
      isOnboardingLoading: onboardingLoading
    });
    
    // CRITICAL OVERRIDE: Force onboarding for new users by directly checking localStorage
    // This is more reliable than depending on the hook state which might have issues
    try {
      const userOnboardingKey = `selah_onboarding_completed_${user.uid}`;
      const onboardingValue = localStorage.getItem(userOnboardingKey);
      
      console.log("Login page: DIRECT check of localStorage onboarding value:", {
        key: userOnboardingKey,
        value: onboardingValue
      });
      
      // Only proceed if there's an EXPLICIT 'true' value
      if (onboardingValue !== 'true') {
        console.log("Login page: User NEEDS onboarding - redirecting to onboarding flow");
        // Set to false to be explicit
        localStorage.setItem(userOnboardingKey, 'false');
        // Redirect to onboarding
        setIsNavigating(true);
        router.push('/onboarding');
        return;
      }
    } catch (error) {
      console.error("Login page: Error checking localStorage:", error);
    }
    
    // Ready to navigate
    setIsNavigating(true);
    
    // hasCompletedOnboarding will be honored only if it's explicitly true
    if (hasCompletedOnboarding === true) {
      // Returning user with specific destination
      if (from !== "/auth/login") {
        console.log(`Login page: Returning user, redirecting to ${from}`);
        router.push(from);
      } else {
        // Returning user, no specific destination
        console.log("Login page: Returning user, redirecting to home");
        router.push('/');
      }
    } else {
      // Any non-true state goes to onboarding as a safety measure
      console.log("Login page: Non-true onboarding state, sending to onboarding");
      router.push('/onboarding');
    }
  }, [from, router, user, loading, hasCompletedOnboarding, onboardingLoading, isNavigating]);

  // Show the debugging panel if needed
  if (showDebug && user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="bg-zinc-900 p-6 rounded-lg max-w-md w-full mb-6">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Debug</h1>
          
          <div className="space-y-4 text-white">
            <div>
              <p className="font-semibold">User ID:</p>
              <p className="font-mono text-sm bg-black p-2 rounded">{user.uid}</p>
            </div>
            
            <div>
              <p className="font-semibold">Onboarding Status:</p>
              <p className="font-mono text-sm bg-black p-2 rounded">
                {hasCompletedOnboarding === true ? "Completed" : 
                 hasCompletedOnboarding === false ? "Not Completed" : "Unknown"}
              </p>
            </div>
            
            <div>
              <p className="font-semibold">Local Storage Value:</p>
              <p className="font-mono text-sm bg-black p-2 rounded">
                {typeof window !== 'undefined' 
                  ? localStorage.getItem(`selah_onboarding_completed_${user.uid}`) || "null" 
                  : "N/A"}
              </p>
            </div>
            
            <div className="pt-4 flex flex-col space-y-2">
              <button
                onClick={() => {
                  // Force reset onboarding status
                  resetOnboarding();
                  alert("Onboarding status reset. Reloading page...");
                  window.location.reload();
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm"
              >
                Reset Onboarding Status
              </button>
              
              <button
                onClick={() => {
                  router.push('/onboarding');
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
              >
                Go to Onboarding
              </button>
              
              <button
                onClick={() => setShowDebug(false)}
                className="bg-zinc-600 text-white px-4 py-2 rounded-md text-sm mt-2"
              >
                Hide Debug Panel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add debug toggle
  return (
    <>
      {user && (
        <button 
          onClick={toggleDebug}
          className="fixed bottom-4 right-4 bg-black/50 text-white p-2 rounded-full z-50"
        >
          🛠️
        </button>
      )}
      <Authentication />
    </>
  );
}
