"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import OnboardingScreen1 from "./OnboardingScreen1";
import OnboardingScreen2 from "./OnboardingScreen2";
import OnboardingScreen3 from "./OnboardingScreen3";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { hasCompletedOnboarding, loading: onboardingLoading, completeOnboarding } = useOnboarding(user);
  const [currentScreen, setCurrentScreen] = useState(0);
  
  // Screens to display in the onboarding flow
  const screens = [
    <OnboardingScreen1 key="screen1" onNext={() => setCurrentScreen(1)} />,
    <OnboardingScreen2 key="screen2" onNext={() => setCurrentScreen(2)} />,
    <OnboardingScreen3 key="screen3" onComplete={handleComplete} />
  ];
  
  // Handle authentication and onboarding state
  useEffect(() => {
    if (!authLoading && !user) {
      // Not logged in, redirect to login
      router.push('/auth/login');
      return;
    }
    
    if (!authLoading && !onboardingLoading) {
      if (hasCompletedOnboarding) {
        // Already completed onboarding, redirect to main app
        router.push('/devotion');
      }
    }
  }, [user, authLoading, hasCompletedOnboarding, onboardingLoading, router]);
  
  // Function to mark onboarding as complete and redirect
  function handleComplete() {
    completeOnboarding();
    router.push('/devotion');
  }
  
  // Show loading state
  if (authLoading || onboardingLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Show the current onboarding screen
  return screens[currentScreen];
} 