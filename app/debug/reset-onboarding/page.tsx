"use client";

import { useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ResetOnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      // No user, redirect to login
      router.push('/auth/login');
      return;
    }
    
    // User is logged in, reset onboarding status
    try {
      const onboardingKey = `selah_onboarding_completed_${user.uid}`;
      
      // First check current status
      const currentValue = localStorage.getItem(onboardingKey);
      console.log("Current onboarding status:", {
        key: onboardingKey,
        value: currentValue
      });
      
      // Force set to false
      localStorage.setItem(onboardingKey, 'false');
      
      // Verify it was set
      const newValue = localStorage.getItem(onboardingKey);
      console.log("Updated onboarding status:", {
        key: onboardingKey,
        value: newValue,
        success: newValue === 'false'
      });
      
      // Small delay to ensure logs are visible
      setTimeout(() => {
        // Redirect to onboarding
        router.push('/onboarding');
      }, 500);
    } catch (error) {
      console.error("Error resetting onboarding status:", error);
    }
  }, [user, loading, router]);
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Resetting Onboarding Status</h1>
      <p className="mb-6">Please wait, redirecting to onboarding...</p>
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
    </div>
  );
} 