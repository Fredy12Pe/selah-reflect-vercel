"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Authentication from "./components/Authentication";
import { useAuth } from "@/lib/context/AuthContext";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { format } from "date-fns";

export default function Home() {
  const { user, loading } = useAuth();
  const { hasCompletedOnboarding, loading: onboardingLoading } = useOnboarding(user);
  const router = useRouter();
  
  useEffect(() => {
    // If user is already authenticated, check onboarding status
    if (!loading && user && !onboardingLoading) {
      if (hasCompletedOnboarding === false) {
        // First-time user, redirect to onboarding
        router.push('/onboarding');
      } else {
        // Existing user, redirect to today's devotion
        const today = format(new Date(), "yyyy-MM-dd");
        router.push(`/devotion/${today}`);
      }
    }
  }, [user, loading, router, hasCompletedOnboarding, onboardingLoading]);

  // Only show authentication component if user is not logged in
  if (loading || onboardingLoading) {
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
  
  // This will only show briefly before redirect happens
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
    </div>
  );
}
