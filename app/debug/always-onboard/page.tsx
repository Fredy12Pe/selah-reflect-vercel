"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

export default function AlwaysOnboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      console.log("No user, redirecting to login");
      router.push('/auth/login');
      return;
    }
    
    console.log("FORCE ONBOARDING: Setting onboarding status to false for user", user.uid);
    
    try {
      // Completely clear all possible keys first
      const possibleKeys = [
        `selah_onboarding_completed_${user.uid}`,
        `selah_onboarding_completed${user.uid}`
      ];
      
      // Remove and then explicitly set to false
      possibleKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          localStorage.setItem(key, 'false');
          console.log(`Set ${key} = false`);
        } catch (e) {
          console.error(`Error setting ${key}:`, e);
        }
      });
      
      // Wait for a moment to ensure changes are committed
      setTimeout(() => {
        // Check all keys to verify they are set correctly
        possibleKeys.forEach(key => {
          const value = localStorage.getItem(key);
          console.log(`Verified: ${key} = ${value}`);
        });
        
        // Force redirect to onboarding
        console.log("Verified onboarding flags set to false, redirecting to onboarding...");
        router.push('/onboarding');
      }, 500);
    } catch (error) {
      console.error("Error resetting onboarding status:", error);
      
      // In case of error, try direct navigation
      router.push('/onboarding');
    }
  }, [user, loading, router]);
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-4">Force Onboarding Mode</h1>
      <p className="mb-8 text-center">Setting your account to first-time user mode and redirecting to onboarding flow...</p>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
    </div>
  );
} 