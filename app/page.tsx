"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Authentication from "./components/Authentication";
import { useAuth } from "@/lib/context/AuthContext";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { format } from "date-fns";

export default function Home() {
  const { user, loading } = useAuth();
  const { hasCompletedOnboarding, loading: onboardingLoading } = useOnboarding(user);
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  
  useEffect(() => {
    // Skip if already navigating or if not done loading
    if (isNavigating || loading || onboardingLoading) return;
    
    // Handle authenticated users
    if (user) {
      setIsNavigating(true); // Prevent multiple redirections
      
      console.log("User authenticated, checking onboarding status:", { 
        uid: user.uid, 
        onboardingStatus: hasCompletedOnboarding,
        isLoading: loading,
        isOnboardingLoading: onboardingLoading
      });
      
      // SUPER AGGRESSIVE FIX: Force onboarding unless explicitly completed
      // Check local storage directly to ensure we don't miss first-time users
      const onboardingKey = `selah_onboarding_completed_${user.uid}`;
      const onboardingValue = localStorage.getItem(onboardingKey);
      
      console.log("Homepage: Onboarding status check:", {
        key: onboardingKey,
        value: onboardingValue
      });
      
      // ONLY proceed to devotion if user has EXPLICITLY completed onboarding with 'true'
      if (onboardingValue !== 'true') {
        console.log("Homepage: User needs onboarding - forcing redirect");
        // Set explicit false value
        localStorage.setItem(onboardingKey, 'false');
        router.push('/onboarding');
        return;
      }
      
      // User has completed onboarding, redirect to today's devotion
      console.log("Homepage: User has completed onboarding - going to devotion");
      const today = format(new Date(), "yyyy-MM-dd");
      router.push(`/devotion/${today}`);
    }
  }, [user, loading, router, hasCompletedOnboarding, onboardingLoading, isNavigating]);

  // Show loading indicator while determining status
  if (loading || onboardingLoading || (user && !isNavigating && hasCompletedOnboarding === null)) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }
  
  // If user is not logged in, show the authentication component
  if (!user) {
    return <Authentication />;
  }
  
  // If we're in a stuck state, show debug information
  if (user && hasCompletedOnboarding === null && !loading && !onboardingLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-xl mb-4">Onboarding Status Issue</h1>
        <p className="mb-6">There seems to be an issue determining your onboarding status.</p>
        
        <div className="flex space-x-4">
          <button
            onClick={() => {
              // Force reset local storage for this user
              if (user) {
                const userId = user.uid;
                const key = `selah_onboarding_completed_${userId}`;
                localStorage.removeItem(key);
                console.log("Cleared onboarding status, reloading page");
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-blue-600 rounded-md"
          >
            Reset Onboarding & Reload
          </button>
          
          <button
            onClick={() => router.push('/onboarding')}
            className="px-4 py-2 bg-green-600 rounded-md"
          >
            Go to Onboarding
          </button>
        </div>
      </div>
    );
  }
  
  // This will only show briefly before redirect happens
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
    </div>
  );
}
