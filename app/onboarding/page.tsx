"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { format } from "date-fns";
import OnboardingScreen1 from "./OnboardingScreen1";
import OnboardingScreen2 from "./OnboardingScreen2";
import OnboardingScreen3 from "./OnboardingScreen3";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { hasCompletedOnboarding, loading: onboardingLoading, completeOnboarding } = useOnboarding(user);
  const [currentScreen, setCurrentScreen] = useState(0);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
  // IMMEDIATE FIX: Force set onboarding status to false on first load
  useEffect(() => {
    if (user && !authLoading) {
      console.log("Onboarding page: IMMEDIATE FIX - Setting onboarding status to false on load");
      try {
        // Use exact key format used in components
        const onboardingKey = `selah_onboarding_completed_${user.uid}`;
        
        // Force-set to false - this ensures we're in onboarding mode
        localStorage.setItem(onboardingKey, 'false');
        
        // Log the current value to verify
        const currentValue = localStorage.getItem(onboardingKey);
        console.log("Onboarding force-set status:", {
          key: onboardingKey,
          value: currentValue
        });
      } catch (error) {
        console.error("Error forcing onboarding status:", error);
      }
    }
  }, [user, authLoading]);
  
  // Screens to display in the onboarding flow:
  // Screen 1: Welcome to Selah with logo (OnboardingScreen1)
  // Screen 2: Daily Scripture & Reflection features (OnboardingScreen2)
  // Screen 3: Add to Home Screen instructions (OnboardingScreen3)
  const screens = [
    <OnboardingScreen1 key="welcome-screen" onNext={() => setCurrentScreen(1)} />,
    <OnboardingScreen2 key="scripture-screen" onNext={() => setCurrentScreen(2)} />,
    <OnboardingScreen3 key="homescreen-screen" onComplete={handleComplete} />
  ];
  
  // Function to handle authentication and onboarding state
  useEffect(() => {
    console.log("Onboarding page: UseEffect running", {
      hasUser: !!user,
      authLoading,
      onboardingLoading,
      hasCompletedOnboarding
    });
    
    if (!authLoading) {
      // Not logged in, redirect to login
      if (!user) {
        console.log("Onboarding page: No user, redirecting to login");
        router.push('/auth/login');
        return;
      }

      // Anonymous users should bypass onboarding
      if (user.isAnonymous) {
        console.log("Onboarding page: Anonymous user detected, skipping onboarding");
        // Get today's date in YYYY-MM-DD format
        const todayFormatted = format(new Date(), "yyyy-MM-dd");
        router.push(`/devotion/${todayFormatted}`);
        return;
      }
      
      // CRITICAL FIX: Double-check localStorage directly to ensure consistency
      if (user && !onboardingLoading) {
        try {
          const userId = user.uid;
          const userOnboardingKey = `selah_onboarding_completed_${userId}`;
          const onboardingValue = localStorage.getItem(userOnboardingKey);
          
          console.log("Onboarding page: Direct localStorage check:", {
            key: userOnboardingKey,
            value: onboardingValue
          });
          
          // If onboarding is explicitly marked as completed, redirect
          if (onboardingValue === 'true') {
            console.log("Onboarding explicitly completed in localStorage, redirecting");
            // Get today's date in YYYY-MM-DD format
            const todayFormatted = format(new Date(), "yyyy-MM-dd");
            router.push(`/devotion/${todayFormatted}`);
            return;
          }
          
          // If no value exists and this is the first visit, ensure it's marked as 'false'
          if (onboardingValue === null) {
            console.log("Onboarding page: First visit detected, setting explicit 'false'");
            localStorage.setItem(userOnboardingKey, 'false');
          }
        } catch (error) {
          console.error("Onboarding page: Error checking localStorage:", error);
        }
      }
      
      // Check if onboarding is completed
      if (!onboardingLoading) {
        setInitialCheckDone(true);
        
        console.log("Onboarding page: Onboarding status check complete", {
          hasCompletedOnboarding,
          userId: user.uid
        });
        
        // Only redirect if the onboarding was definitively completed
        if (hasCompletedOnboarding === true) {
          console.log("Onboarding already completed, redirecting to devotion");
          // Get today's date in YYYY-MM-DD format
          const todayFormatted = format(new Date(), "yyyy-MM-dd");
          router.push(`/devotion/${todayFormatted}`);
        }
      }
    }
  }, [router, user, authLoading, onboardingLoading, hasCompletedOnboarding]);
  
  // Function to mark onboarding as complete and redirect
  function handleComplete() {
    console.log("Completing onboarding and marking as done in localStorage");
    
    try {
      // Mark onboarding as complete
      completeOnboarding();
      
      // Get today's date in YYYY-MM-DD format
      const todayFormatted = format(new Date(), "yyyy-MM-dd");
      
      console.log("Redirecting to today's devotion:", todayFormatted);
      router.push(`/devotion/${todayFormatted}`);
    } catch (error) {
      console.error("Error during onboarding completion:", error);
      alert("There was an error completing onboarding. Please try again.");
    }
  }
  
  // Show loading state
  if (authLoading || (onboardingLoading && !initialCheckDone)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Show the current onboarding screen
  return (
    <>
      {screens[currentScreen]}
    </>
  );
} 