"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";

export default function TestOnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState("Checking user...");

  useEffect(() => {
    // Check if user is logged in
    if (loading) {
      setStatus("Checking authentication status...");
      return;
    }

    if (!user) {
      setStatus("No user logged in. Please log in first.");
      return;
    }

    setStatus(`User ${user.uid} found. Forcing onboarding reset...`);

    // Force reset the onboarding status for this user
    try {
      const userOnboardingKey = `selah_onboarding_completed_${user.uid}`;
      
      // First check current value
      const currentValue = localStorage.getItem(userOnboardingKey);
      console.log(`Current onboarding status: ${currentValue}`);
      
      // Force to false (not completed)
      localStorage.setItem(userOnboardingKey, 'false');
      
      const newValue = localStorage.getItem(userOnboardingKey);
      setStatus(`Onboarding status reset for ${user.uid}: ${currentValue} -> ${newValue}`);
      
      // Give user a button to continue to onboarding
    } catch (error) {
      console.error("Error resetting onboarding status:", error);
      setStatus(`Error resetting onboarding: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">Onboarding Test Page</h1>
      
      <div className="mb-8 text-center">
        <p className="mb-4">{status}</p>
        
        {user && (
          <>
            <p className="text-green-400 mb-6">✓ User is logged in</p>
            
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => router.push('/onboarding')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Go to Onboarding
              </button>
              
              <button
                onClick={() => {
                  const userOnboardingKey = `selah_onboarding_completed_${user.uid}`;
                  localStorage.setItem(userOnboardingKey, 'true');
                  setStatus(`Onboarding marked as completed for ${user.uid}`);
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
              >
                Mark Onboarding as Complete
              </button>
              
              <button
                onClick={() => {
                  // Directly navigate to today's devotion
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = String(today.getMonth() + 1).padStart(2, "0");
                  const day = String(today.getDate()).padStart(2, "0");
                  const todayFormatted = `${year}-${month}-${day}`;
                  
                  router.push(`/devotion/${todayFormatted}`);
                }}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
              >
                Go to Today's Devotion
              </button>
            </div>
          </>
        )}
        
        {!user && !loading && (
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Log In First
          </button>
        )}
      </div>
    </div>
  );
} 