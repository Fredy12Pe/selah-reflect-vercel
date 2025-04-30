"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { format } from "date-fns";

export default function DevotionIndexPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If still loading auth state, show loading indicator
    if (loading) return;

    if (!user) {
      // Not logged in, redirect to login
      router.push("/auth/login");
      return;
    }

    // CRITICAL: Check onboarding status first before redirecting to today's devotion
    try {
      const onboardingKey = `selah_onboarding_completed_${user.uid}`;
      const onboardingValue = localStorage.getItem(onboardingKey);
      
      console.log("Devotion index: Direct check of onboarding status:", {
        userId: user.uid,
        onboardingKey,
        onboardingValue
      });
      
      // Only users who have explicitly completed onboarding should proceed
      if (onboardingValue !== 'true') {
        console.log("Devotion index: Forcing redirect to onboarding - user has not completed onboarding");
        // Set to false to be explicit
        localStorage.setItem(onboardingKey, 'false');
        router.push('/onboarding');
        return;
      }
      
      // User has completed onboarding, redirect to today's devotion
      const today = format(new Date(), "yyyy-MM-dd");
      router.push(`/devotion/${today}`);
    } catch (error) {
      console.error("Devotion index: Error checking onboarding status:", error);
      // If there's an error, send to onboarding as a safe default
      router.push('/onboarding');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-6"></div>
      <h1 className="text-xl font-medium mb-2">Loading Your Devotion</h1>
      <p className="text-white/70 text-center">Redirecting you to today's reflection...</p>
    </div>
  );
} 