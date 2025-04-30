"use client";

import { useState, useEffect } from "react";
import OnboardingScreen1 from "@/app/onboarding/OnboardingScreen1";
import OnboardingScreen2 from "@/app/onboarding/OnboardingScreen2";
import OnboardingScreen3 from "@/app/onboarding/OnboardingScreen3";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useAuth } from "@/lib/context/AuthContext";

export default function ForceOnboardingPage() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const router = useRouter();
  const { user } = useAuth();

  // Function to mark onboarding as complete and redirect
  function handleComplete() {
    console.log("Completing onboarding flow");
    
    try {
      // If user is logged in, mark onboarding as completed in localStorage
      if (user) {
        const userOnboardingKey = `selah_onboarding_completed_${user.uid}`;
        localStorage.setItem(userOnboardingKey, 'true');
        console.log("Onboarding marked as completed for user:", user.uid);
      }
      
      // Get today's date in YYYY-MM-DD format for the redirect
      const today = new Date();
      const formattedDate = format(today, 'yyyy-MM-dd');
      
      // Redirect to today's devotion
      router.push(`/devotion/${formattedDate}`);
    } catch (error) {
      console.error("Error during completion:", error);
      alert("There was an error completing onboarding.");
    }
  }

  // Screens to display in the onboarding flow
  const screens = [
    <OnboardingScreen1 key="welcome-screen" onNext={() => setCurrentScreen(1)} />,
    <OnboardingScreen2 key="scripture-screen" onNext={() => setCurrentScreen(2)} />,
    <OnboardingScreen3 key="homescreen-screen" onComplete={handleComplete} />
  ];

  // Render the current screen with navigation controls
  return (
    <>
      {screens[currentScreen]}
      
      {/* Navigation Controls */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center space-x-2">
        <button
          onClick={() => setCurrentScreen(Math.max(0, currentScreen - 1))}
          className="bg-black/50 text-white p-2 rounded-full text-xs"
          disabled={currentScreen === 0}
          title="Previous Screen"
        >
          ←
        </button>
        
        <span className="text-white bg-black/50 px-3 py-1 rounded-full text-xs">
          {currentScreen + 1} / {screens.length}
        </span>
        
        <button
          onClick={() => {
            if (currentScreen < screens.length - 1) {
              setCurrentScreen(currentScreen + 1);
            } else {
              handleComplete();
            }
          }}
          className="bg-black/50 text-white p-2 rounded-full text-xs"
          title={currentScreen < screens.length - 1 ? "Next Screen" : "Complete"}
        >
          {currentScreen < screens.length - 1 ? "→" : "✓"}
        </button>
      </div>
    </>
  );
} 